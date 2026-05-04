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

/**
 * @openapi
 * /api/project/archived:
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos archivados
 *     responses:
 *       200:
 *         description: Lista de proyectos archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/archived', listArchivedProjects)

/**
 * @openapi
 * /api/project/{id}/restore:
 *   patch:
 *     tags: [Projects]
 *     summary: Restaurar un proyecto archivado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proyecto restaurado, content: { application/json: { schema: { $ref: '#/components/schemas/Project' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/restore', restoreProject)

/**
 * @openapi
 * /api/project:
 *   post:
 *     tags: [Projects]
 *     summary: Crear un proyecto
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, client]
 *             properties:
 *               name:        { type: string, example: Reforma oficinas }
 *               projectCode: { type: string, example: P-2026-001 }
 *               client:      { type: string, description: ID del cliente }
 *               email:       { type: string, format: email }
 *               notes:       { type: string }
 *               address:     { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201: { description: Proyecto creado, content: { application/json: { schema: { $ref: '#/components/schemas/Project' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/',      validate(createProjectSchema), createProject)

/**
 * @openapi
 * /api/project:
 *   get:
 *     tags: [Projects]
 *     summary: Listar proyectos (paginado y filtrado)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *         description: Filtrar por ID de cliente
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Lista paginada
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items: { $ref: '#/components/schemas/Project' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/',       listProjects)

/**
 * @openapi
 * /api/project/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Obtener un proyecto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Proyecto, content: { application/json: { schema: { $ref: '#/components/schemas/Project' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Projects]
 *     summary: Actualizar un proyecto
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:        { type: string }
 *               projectCode: { type: string }
 *               email:       { type: string, format: email }
 *               notes:       { type: string }
 *               address:     { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200: { description: Proyecto actualizado, content: { application/json: { schema: { $ref: '#/components/schemas/Project' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Projects]
 *     summary: Eliminar proyecto (soft delete por defecto, ?soft=false para hard)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200: { description: Proyecto eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id',    getProject)
router.put('/:id',    validate(updateProjectSchema), updateProject)
router.delete('/:id', deleteProject)

export default router
