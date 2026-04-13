// T7 — Middleware de autorización por roles
import { AppError } from '../utils/AppError.js'

/**
 * Uso: checkRole('admin') o checkRole('admin', 'guest')
 */
export const checkRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(AppError.unauthorized('No autenticado'))
  if (!roles.includes(req.user.role)) {
    return next(AppError.forbidden(`Requiere rol: ${roles.join(' o ')}`))
  }
  next()
}
