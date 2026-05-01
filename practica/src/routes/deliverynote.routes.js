// T4 — Rutas modulares: /api/deliverynote
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate }       from '../middleware/validate.js'
import {
  createDeliveryNote,
  listDeliveryNotes,
  getDeliveryNote,
  updateDeliveryNote,
  deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js'
import {
  createDeliveryNoteSchema,
  updateDeliveryNoteSchema,
} from '../validators/deliverynote.validator.js'

const router = Router()

// Todas las rutas de albaranes requieren JWT
router.use(authMiddleware)

router.post('/',      validate(createDeliveryNoteSchema), createDeliveryNote)
router.get('/',       listDeliveryNotes)
router.get('/:id',    getDeliveryNote)
router.put('/:id',    validate(updateDeliveryNoteSchema), updateDeliveryNote)
router.delete('/:id', deleteDeliveryNote)

export default router
