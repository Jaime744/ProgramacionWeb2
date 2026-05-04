// T4 — Rutas modulares: /api/deliverynote
import { Router } from 'express'
import { authMiddleware }   from '../middleware/auth.middleware.js'
import { validate }         from '../middleware/validate.js'
import { uploadSignature }  from '../middleware/upload.js'
import {
  createDeliveryNote,
  listDeliveryNotes,
  getDeliveryNote,
  updateDeliveryNote,
  deleteDeliveryNote,
  signDeliveryNote,
  downloadDeliveryNotePdf,
} from '../controllers/deliverynote.controller.js'
import {
  createDeliveryNoteSchema,
  updateDeliveryNoteSchema,
} from '../validators/deliverynote.validator.js'

const router = Router()

// Todas las rutas de albaranes requieren JWT
router.use(authMiddleware)

/**
 * @openapi
 * /api/deliverynote:
 *   post:
 *     tags: [Delivery Notes]
 *     summary: Crear un albarán (material u horas)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [client, project, format, workDate]
 *             properties:
 *               client:   { type: string }
 *               project:  { type: string }
 *               format:   { type: string, enum: [material, hours] }
 *               workDate: { type: string, format: date-time }
 *               description: { type: string }
 *               material: { type: string, description: 'Sólo si format=material' }
 *               quantity: { type: number, minimum: 0 }
 *               unit:     { type: string }
 *               hours:    { type: number, minimum: 0, description: 'Sólo si format=hours' }
 *               workers:
 *                 type: array
 *                 items: { $ref: '#/components/schemas/Worker' }
 *     responses:
 *       201: { description: Albarán creado, content: { application/json: { schema: { $ref: '#/components/schemas/DeliveryNote' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *   get:
 *     tags: [Delivery Notes]
 *     summary: Listar albaranes (paginado y filtrado)
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: client
 *         schema: { type: string }
 *       - in: query
 *         name: project
 *         schema: { type: string }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
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
 *                       items: { $ref: '#/components/schemas/DeliveryNote' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/',      validate(createDeliveryNoteSchema), createDeliveryNote)
router.get('/',       listDeliveryNotes)

/**
 * @openapi
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     tags: [Delivery Notes]
 *     summary: Descargar PDF del albarán
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: PDF binario
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 */
router.get('/pdf/:id', downloadDeliveryNotePdf)

/**
 * @openapi
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     tags: [Delivery Notes]
 *     summary: Firmar albarán (subida de firma como imagen)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               signature: { type: string, format: binary }
 *     responses:
 *       200: { description: Albarán firmado (signed=true, signatureUrl, pdfUrl) }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.patch('/:id/sign', uploadSignature.single('signature'), signDeliveryNote)

/**
 * @openapi
 * /api/deliverynote/{id}:
 *   get:
 *     tags: [Delivery Notes]
 *     summary: Obtener un albarán por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán, content: { application/json: { schema: { $ref: '#/components/schemas/DeliveryNote' } } } }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *   put:
 *     tags: [Delivery Notes]
 *     summary: Actualizar un albarán (no firmado)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/DeliveryNote' }
 *     responses:
 *       200: { description: Albarán actualizado, content: { application/json: { schema: { $ref: '#/components/schemas/DeliveryNote' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 *   delete:
 *     tags: [Delivery Notes]
 *     summary: Eliminar albarán (no permitido si ya está firmado)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Albarán eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       404: { $ref: '#/components/responses/NotFound' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.get('/:id',    getDeliveryNote)
router.put('/:id',    validate(updateDeliveryNoteSchema), updateDeliveryNote)
router.delete('/:id', deleteDeliveryNote)

export default router
