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

// /archived debe declararse antes que /:id para no ser capturado como param.
router.get('/archived', listArchivedClients)
router.patch('/:id/restore', restoreClient)

router.post('/',      validate(createClientSchema), createClient)
router.get('/',       listClients)
router.get('/:id',    getClient)
router.put('/:id',    validate(updateClientSchema), updateClient)
router.delete('/:id', deleteClient)

export default router
