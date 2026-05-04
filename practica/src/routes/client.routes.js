// T4 — Rutas modulares: /api/client
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate }       from '../middleware/validate.js'
import {
  createClient,
  listClients,
  listArchivedClients,
  getClient,
  updateClient,
  deleteClient,
  restoreClient,
} from '../controllers/client.controller.js'
import {
  createClientSchema,
  updateClientSchema,
} from '../validators/client.validator.js'

const router = Router()

// Todas las rutas de clientes requieren JWT
router.use(authMiddleware)

/**
 * @openapi
 * /api/client/archived:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes archivados (soft-deleted)
 *     responses:
 *       200:
 *         description: Lista de clientes archivados
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Client' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/archived', listArchivedClients)

/**
 * @openapi
 * /api/client/{id}/restore:
 *   patch:
 *     tags: [Clients]
 *     summary: Restaurar un cliente archivado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente restaurado, content: { application/json: { schema: { $ref: '#/components/schemas/Client' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.patch('/:id/restore', restoreClient)

/**
 * @openapi
 * /api/client:
 *   post:
 *     tags: [Clients]
 *     summary: Crear un cliente
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name:    { type: string, example: Acme Inc. }
 *               cif:     { type: string, example: A87654321 }
 *               email:   { type: string, format: email }
 *               phone:   { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       201: { description: Cliente creado, content: { application/json: { schema: { $ref: '#/components/schemas/Client' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/',      validate(createClientSchema), createClient)

/**
 * @openapi
 * /api/client:
 *   get:
 *     tags: [Clients]
 *     summary: Listar clientes (paginado y filtrado)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1, minimum: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10, minimum: 1, maximum: 100 }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Filtra por name o cif
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
 *                       items: { $ref: '#/components/schemas/Client' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/',       listClients)

/**
 * @openapi
 * /api/client/{id}:
 *   get:
 *     tags: [Clients]
 *     summary: Obtener un cliente por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Cliente, content: { application/json: { schema: { $ref: '#/components/schemas/Client' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Clients]
 *     summary: Actualizar un cliente
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
 *               name:    { type: string }
 *               cif:     { type: string }
 *               email:   { type: string, format: email }
 *               phone:   { type: string }
 *               address: { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200: { description: Cliente actualizado, content: { application/json: { schema: { $ref: '#/components/schemas/Client' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Clients]
 *     summary: Eliminar cliente (soft delete por defecto, ?soft=false para hard)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200: { description: Cliente eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/:id',    getClient)
router.put('/:id',    validate(updateClientSchema), updateClient)
router.delete('/:id', deleteClient)

export default router
