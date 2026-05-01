// T5 — Controlador de albaranes (MVC) + Fase 3: firma y PDF
import sharp from 'sharp'
import { DeliveryNote } from '../models/DeliveryNote.js'
import { Project }      from '../models/Project.js'
import { Client }       from '../models/Client.js'
import { Company }      from '../models/Company.js'
import { AppError }     from '../utils/AppError.js'
import { parsePagination, parseSort, paginate } from '../utils/pagination.js'
import { uploadBuffer } from '../services/storage.service.js'
import { generateDeliveryNotePdf } from '../services/pdf.service.js'

const NOTE_SORTABLE = ['workDate', 'createdAt', 'updatedAt', 'format', 'signed']

const ensureClientInCompany = async (clientId, companyId) => {
  const c = await Client.findOne({ _id: clientId, company: companyId, deleted: false })
  if (!c) throw AppError.badRequest('El cliente no existe en tu compañía')
  return c
}

const ensureProjectInCompany = async (projectId, companyId) => {
  const p = await Project.findOne({ _id: projectId, company: companyId, deleted: false })
  if (!p) throw AppError.badRequest('El proyecto no existe en tu compañía')
  return p
}

// Acceso: el creador o cualquier usuario de la misma compañía puede operar.
const ensureCanAccess = (note, user) => {
  const sameCompany = user.company && note.company.toString() === user.company.toString()
  const isOwner     = note.user.toString() === user._id.toString()
  if (!sameCompany && !isOwner) {
    throw AppError.forbidden('No tienes acceso a este albarán')
  }
}

// Construye el filtro de listado a partir de los query params soportados.
const buildNoteFilter = (req) => {
  const filter = { company: req.user.company, deleted: false }
  if (req.query.project) filter.project = req.query.project
  if (req.query.client)  filter.client  = req.query.client
  if (req.query.format)  filter.format  = req.query.format
  if (req.query.signed !== undefined) {
    filter.signed = req.query.signed === 'true'
  }
  if (req.query.from || req.query.to) {
    filter.workDate = {}
    if (req.query.from) filter.workDate.$gte = new Date(req.query.from)
    if (req.query.to)   filter.workDate.$lte = new Date(req.query.to)
  }
  return filter
}

// ─── 1) Crear albarán ────────────────────────────────────────────────────────
export const createDeliveryNote = async (req, res) => {
  const user = req.user
  if (!user.company) {
    throw AppError.badRequest('Debes completar el onboarding de compañía primero')
  }

  await ensureClientInCompany(req.body.client, user.company)
  const project = await ensureProjectInCompany(req.body.project, user.company)

  // Coherencia: el proyecto debe pertenecer al cliente indicado
  if (project.client.toString() !== req.body.client) {
    throw AppError.badRequest('El proyecto no pertenece al cliente indicado')
  }

  const note = await DeliveryNote.create({
    ...req.body,
    user:    user._id,
    company: user.company,
  })

  res.status(201).json({ data: note })
}

// ─── 2) Listar albaranes (paginado + filtros) ────────────────────────────────
export const listDeliveryNotes = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const sort   = parseSort(req.query.sort, NOTE_SORTABLE, { workDate: -1 })
  const filter = buildNoteFilter(req)
  const result = await paginate(DeliveryNote, filter, { page, limit, skip, sort })
  res.json(result)
}

// ─── 3) Obtener albarán concreto (con populate) ──────────────────────────────
export const getDeliveryNote = async (req, res) => {
  const note = await DeliveryNote.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
    .populate('user',    'email name')
    .populate('client',  'name cif email')
    .populate('project', 'name projectCode')

  if (!note) throw AppError.notFound('Albarán no encontrado')
  res.json({ data: note })
}

// ─── 4) Actualizar albarán ───────────────────────────────────────────────────
export const updateDeliveryNote = async (req, res) => {
  const note = await DeliveryNote.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!note) throw AppError.notFound('Albarán no encontrado')

  // Un albarán firmado no se puede modificar (Fase 3 → 409)
  if (note.signed) {
    throw AppError.conflict('No se puede modificar un albarán firmado')
  }

  if (req.body.client) {
    await ensureClientInCompany(req.body.client, req.user.company)
  }
  if (req.body.project) {
    const project = await ensureProjectInCompany(req.body.project, req.user.company)
    const targetClient = req.body.client || note.client.toString()
    if (project.client.toString() !== targetClient) {
      throw AppError.badRequest('El proyecto no pertenece al cliente indicado')
    }
  }

  Object.assign(note, req.body)
  await note.save()
  res.json({ data: note })
}

// ─── 5) Eliminar albarán (solo si no está firmado) ───────────────────────────
export const deleteDeliveryNote = async (req, res) => {
  const { soft } = req.query
  const note = await DeliveryNote.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!note) throw AppError.notFound('Albarán no encontrado')

  if (note.signed) {
    throw AppError.conflict('No se puede borrar un albarán firmado')
  }

  if (soft === 'true') {
    note.deleted = true
    await note.save()
    return res.json({ data: { message: 'Albarán archivado (soft delete)' } })
  }

  await note.deleteOne()
  res.json({ data: { message: 'Albarán eliminado permanentemente' } })
}

// ─── 6) Firmar albarán + generar PDF (Fase 3) ────────────────────────────────
export const signDeliveryNote = async (req, res) => {
  if (!req.file) {
    throw AppError.badRequest('Falta la imagen de la firma (campo "signature")')
  }

  const note = await DeliveryNote.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!note) throw AppError.notFound('Albarán no encontrado')
  ensureCanAccess(note, req.user)

  if (note.signed) {
    throw AppError.conflict('El albarán ya está firmado')
  }

  // 1) Procesar firma con Sharp → webp 800px máx, calidad 85
  let signatureWebp
  try {
    signatureWebp = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer()
  } catch (err) {
    throw AppError.badRequest(`Imagen de firma inválida: ${err.message}`)
  }

  // 2) Subir firma a R2
  const signatureKey = `signatures/${note._id}-${Date.now()}.webp`
  const { url: signatureUrl } = await uploadBuffer(
    signatureWebp,
    signatureKey,
    'image/webp',
  )

  // 3) Marcar como firmado (antes de generar el PDF para que aparezca como tal)
  note.signed       = true
  note.signedAt     = new Date()
  note.signatureUrl = signatureUrl

  // 4) Generar PDF y subirlo a R2
  const [client, project, company] = await Promise.all([
    Client.findById(note.client),
    Project.findById(note.project),
    Company.findById(note.company),
  ])

  const pdfBuffer = await generateDeliveryNotePdf({
    note,
    company,
    client,
    project,
    user: req.user,
    signatureBuffer: signatureWebp,
  })

  const pdfKey = `deliverynotes/${note._id}.pdf`
  const { url: pdfUrl } = await uploadBuffer(pdfBuffer, pdfKey, 'application/pdf')
  note.pdfUrl = pdfUrl

  await note.save()

  res.json({ data: note })
}

// ─── 7) Descargar/redirigir PDF (Fase 3) ─────────────────────────────────────
export const downloadDeliveryNotePdf = async (req, res) => {
  const note = await DeliveryNote.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!note) throw AppError.notFound('Albarán no encontrado')
  ensureCanAccess(note, req.user)

  // Si ya hay un PDF en R2, redirigimos a su URL pública
  if (note.pdfUrl) {
    return res.redirect(note.pdfUrl)
  }

  // Si no, lo generamos al vuelo y lo devolvemos como stream
  const [client, project, company] = await Promise.all([
    Client.findById(note.client),
    Project.findById(note.project),
    Company.findById(note.company),
  ])

  const pdfBuffer = await generateDeliveryNotePdf({
    note,
    company,
    client,
    project,
    user: req.user,
  })

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader(
    'Content-Disposition',
    `inline; filename="albaran-${note._id}.pdf"`,
  )
  res.send(pdfBuffer)
}
