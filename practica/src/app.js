// T4, T6 — Configuración de Express con seguridad y middlewares
import express from 'express'
import helmet from 'helmet'
import mongoose from 'mongoose'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { errorHandler } from './middleware/error-handler.js'
import { swaggerSpec }  from './config/swagger.js'
import userRoutes         from './routes/user.routes.js'
import clientRoutes       from './routes/client.routes.js'
import projectRoutes      from './routes/project.routes.js'
import deliveryNoteRoutes from './routes/deliverynote.routes.js'

const app = express()

// ── Seguridad (T6) ────────────────────────────────────────────────────────────
app.use(helmet())

// Rate limiting global: 100 peticiones cada 15 minutos por IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  message:  { status: 'fail', message: 'Demasiadas peticiones. Inténtalo más tarde.' },
}))

// Sanitización manual contra inyección NoSQL (compatible con Express 5)
app.use((req, _res, next) => {
  const sanitize = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj)) {
        if (key.startsWith('$') || key.includes('.')) {
          delete obj[key]
        } else {
          sanitize(obj[key])
        }
      }
    }
  }
  sanitize(req.body)
  next()
})

// ── Parseo del body ───────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Archivos estáticos (logos subidos) ────────────────────────────────────────
app.use('/uploads', express.static('uploads'))

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Estado del servicio
 *     security: []
 *     responses:
 *       200:
 *         description: Servicio operativo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:    { type: string, example: ok }
 *                 db:        { type: string, enum: [connected, disconnected], example: connected }
 *                 uptime:    { type: number, example: 123.45 }
 *                 timestamp: { type: string, format: date-time }
 */
app.get('/health', (_req, res) => {
  const db = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  res.json({
    status:    'ok',
    db,
    uptime:    process.uptime(),
    timestamp: new Date().toISOString(),
  })
})

// ── Swagger UI (Fase 4) ───────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  swaggerOptions: { persistAuthorization: true },
}))
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec))

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/user',         userRoutes)
app.use('/api/client',       clientRoutes)
app.use('/api/project',      projectRoutes)
app.use('/api/deliverynote', deliveryNoteRoutes)

// ── Middleware centralizado de errores (T6) ───────────────────────────────────
app.use(errorHandler)

export default app
