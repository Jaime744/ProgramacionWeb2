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

router.post('/',      validate(createDeliveryNoteSchema), createDeliveryNote)
router.get('/',       listDeliveryNotes)

// Fase 3 — Descarga del PDF (declarado antes de "/:id" para evitar colisiones)
router.get('/pdf/:id', downloadDeliveryNotePdf)

// Fase 3 — Firma del albarán (multipart/form-data, campo "signature")
router.patch('/:id/sign', uploadSignature.single('signature'), signDeliveryNote)

router.get('/:id',    getDeliveryNote)
router.put('/:id',    validate(updateDeliveryNoteSchema), updateDeliveryNote)
router.delete('/:id', deleteDeliveryNote)

export default router
