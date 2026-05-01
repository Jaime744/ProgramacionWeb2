// T4 — Rutas modulares: /api/client
import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { validate }       from '../middleware/validate.js'
import {
  createClient,
  listClients,
  getClient,
  updateClient,
  deleteClient,
} from '../controllers/client.controller.js'
import {
  createClientSchema,
  updateClientSchema,
} from '../validators/client.validator.js'

const router = Router()

// Todas las rutas de clientes requieren JWT
router.use(authMiddleware)

router.post('/',      validate(createClientSchema), createClient)
router.get('/',       listClients)
router.get('/:id',    getClient)
router.put('/:id',    validate(updateClientSchema), updateClient)
router.delete('/:id', deleteClient)

export default router
