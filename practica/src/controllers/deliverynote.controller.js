// T5 — Controlador de albaranes (MVC)
import { DeliveryNote } from '../models/DeliveryNote.js'
import { Project }      from '../models/Project.js'
import { Client }       from '../models/Client.js'
import { AppError }     from '../utils/AppError.js'
import { parsePagination, parseSort, paginate } from '../utils/pagination.js'

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

  // Un albarán firmado no se puede modificar
  if (note.signed) {
    throw AppError.forbidden('No se puede modificar un albarán firmado')
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
    throw AppError.forbidden('No se puede borrar un albarán firmado')
  }

  if (soft === 'true') {
    note.deleted = true
    await note.save()
    return res.json({ data: { message: 'Albarán archivado (soft delete)' } })
  }

  await note.deleteOne()
  res.json({ data: { message: 'Albarán eliminado permanentemente' } })
}
