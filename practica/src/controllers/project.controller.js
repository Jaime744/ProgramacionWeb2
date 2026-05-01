// T5 — Controlador de proyectos (MVC)
import { Project } from '../models/Project.js'
import { Client }  from '../models/Client.js'
import { AppError } from '../utils/AppError.js'
import { parsePagination, parseSort, paginate } from '../utils/pagination.js'

const PROJECT_SORTABLE = ['name', 'projectCode', 'createdAt', 'updatedAt', 'active']

// El cliente referenciado debe pertenecer a la compañía del usuario y estar activo
const ensureClientInCompany = async (clientId, companyId) => {
  const client = await Client.findOne({ _id: clientId, company: companyId, deleted: false })
  if (!client) throw AppError.badRequest('El cliente no existe en tu compañía')
  return client
}

// Construye el filtro común a list/archived a partir de los query params.
const buildProjectFilter = (req, { deleted }) => {
  const filter = { company: req.user.company, deleted }
  if (req.query.client) filter.client = req.query.client
  if (req.query.name)   filter.name   = { $regex: req.query.name, $options: 'i' }
  if (req.query.active !== undefined) {
    filter.active = req.query.active === 'true'
  }
  return filter
}

// ─── 1) Crear proyecto ───────────────────────────────────────────────────────
export const createProject = async (req, res) => {
  const user = req.user
  if (!user.company) {
    throw AppError.badRequest('Debes completar el onboarding de compañía primero')
  }

  await ensureClientInCompany(req.body.client, user.company)

  const exists = await Project.findOne({
    company:     user.company,
    projectCode: req.body.projectCode,
  })
  if (exists) {
    throw AppError.conflict('Ya existe un proyecto con ese código en la compañía')
  }

  const project = await Project.create({
    ...req.body,
    user:    user._id,
    company: user.company,
  })

  res.status(201).json({ data: project })
}

// ─── 2) Listar proyectos (paginado + filtros) ────────────────────────────────
export const listProjects = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const sort   = parseSort(req.query.sort, PROJECT_SORTABLE)
  const filter = buildProjectFilter(req, { deleted: false })
  const result = await paginate(Project, filter, { page, limit, skip, sort })
  res.json(result)
}

// ─── 2b) Listar proyectos archivados ─────────────────────────────────────────
export const listArchivedProjects = async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query)
  const sort   = parseSort(req.query.sort, PROJECT_SORTABLE)
  const filter = buildProjectFilter(req, { deleted: true })
  const result = await paginate(Project, filter, { page, limit, skip, sort })
  res.json(result)
}

// ─── 3) Obtener proyecto concreto ────────────────────────────────────────────
export const getProject = async (req, res) => {
  const project = await Project.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!project) throw AppError.notFound('Proyecto no encontrado')
  res.json({ data: project })
}

// ─── 4) Actualizar proyecto ──────────────────────────────────────────────────
export const updateProject = async (req, res) => {
  const project = await Project.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!project) throw AppError.notFound('Proyecto no encontrado')

  if (req.body.client && req.body.client !== project.client.toString()) {
    await ensureClientInCompany(req.body.client, req.user.company)
  }

  if (req.body.projectCode && req.body.projectCode !== project.projectCode) {
    const dup = await Project.findOne({
      company:     req.user.company,
      projectCode: req.body.projectCode,
      _id:         { $ne: project._id },
    })
    if (dup) throw AppError.conflict('Ya existe un proyecto con ese código en la compañía')
  }

  Object.assign(project, req.body)
  await project.save()
  res.json({ data: project })
}

// ─── 5) Eliminar proyecto (soft o hard) ──────────────────────────────────────
export const deleteProject = async (req, res) => {
  const { soft } = req.query
  const project = await Project.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: false,
  })
  if (!project) throw AppError.notFound('Proyecto no encontrado')

  if (soft === 'true') {
    project.deleted = true
    await project.save()
    return res.json({ data: { message: 'Proyecto archivado (soft delete)' } })
  }

  await project.deleteOne()
  res.json({ data: { message: 'Proyecto eliminado permanentemente' } })
}

// ─── 6) Restaurar proyecto archivado ─────────────────────────────────────────
export const restoreProject = async (req, res) => {
  const project = await Project.findOne({
    _id:     req.params.id,
    company: req.user.company,
    deleted: true,
  })
  if (!project) throw AppError.notFound('Proyecto archivado no encontrado')

  project.deleted = false
  await project.save()
  res.json({ data: project })
}
