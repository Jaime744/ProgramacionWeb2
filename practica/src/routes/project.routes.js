// T4 — Rutas modulares: /api/project
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate }       from '../middleware/validate.js'
import {
  createProject,
  listProjects,
  listArchivedProjects,
  getProject,
  updateProject,
  deleteProject,
  restoreProject,
} from '../controllers/project.controller.js'
import {
  createProjectSchema,
  updateProjectSchema,
} from '../validators/project.validator.js'

const router = Router()

// Todas las rutas de proyectos requieren JWT
router.use(authMiddleware)

// /archived debe declararse antes que /:id para no ser capturado como param.
router.get('/archived', listArchivedProjects)
router.patch('/:id/restore', restoreProject)

router.post('/',      validate(createProjectSchema), createProject)
router.get('/',       listProjects)
router.get('/:id',    getProject)
router.put('/:id',    validate(updateProjectSchema), updateProject)
router.delete('/:id', deleteProject)

export default router
