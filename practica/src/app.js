// T4, T6 — Configuración de Express con seguridad y middlewares
import express from 'express'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { errorHandler } from './middleware/error-handler.js'
import userRoutes from './routes/user.routes.js'

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

// ── Healthcheck ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok' }))

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/user', userRoutes)

// ── Middleware centralizado de errores (T6) ───────────────────────────────────
app.use(errorHandler)

export default app
