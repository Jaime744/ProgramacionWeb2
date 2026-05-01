// T5 — Controlador de clientes (MVC)
// Express 5 gestiona errores async automáticamente
import { Client } from '../models/Client.js'
import { AppError } from '../utils/AppError.js'

// ─── 1) Crear cliente ────────────────────────────────────────────────────────
export const createClient = async (req, res) => {
  const user = req.user
  if (!user.company) {
    throw AppError.badRequest('Debes completar el onboarding de compañía primero')
  }

  // CIF único dentro de la compañía (incluye archivados — el índice también)
  const exists = await Client.findOne({ company: user.company, cif: req.body.cif })
  if (exists) {
    throw AppError.conflict('Ya existe un cliente con ese CIF en la compañía')
  }

  const client = await Client.create({
    ...req.body,
    user:    user._id,
    company: user.company,
  })

  res.status(201).json({ data: client })
}

// ─── 2) Listar clientes ──────────────────────────────────────────────────────
export const listClients = async (req, res) => {
  const clients = await Client.find({ company: req.user.company, deleted: false })
  res.json({ data: clients })
}

// ─── 3) Obtener cliente concreto ─────────────────────────────────────────────
export const getClient = async (req, res) => {
  const client = await Client.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!client) throw AppError.notFound('Cliente no encontrado')
  res.json({ data: client })
}

// ─── 4) Actualizar cliente ───────────────────────────────────────────────────
export const updateClient = async (req, res) => {
  const client = await Client.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!client) throw AppError.notFound('Cliente no encontrado')

  if (req.body.cif && req.body.cif !== client.cif) {
    const dup = await Client.findOne({
      company: req.user.company,
      cif:     req.body.cif,
      _id:     { $ne: client._id },
    })
    if (dup) throw AppError.conflict('Ya existe un cliente con ese CIF en la compañía')
  }

  Object.assign(client, req.body)
  await client.save()
  res.json({ data: client })
}

// ─── 5) Eliminar cliente (soft o hard) ───────────────────────────────────────
export const deleteClient = async (req, res) => {
  const { soft } = req.query
  const client = await Client.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!client) throw AppError.notFound('Cliente no encontrado')

  if (soft === 'true') {
    client.deleted = true
    await client.save()
    return res.json({ data: { message: 'Cliente archivado (soft delete)' } })
  }

  await client.deleteOne()
  res.json({ data: { message: 'Cliente eliminado permanentemente' } })
}
