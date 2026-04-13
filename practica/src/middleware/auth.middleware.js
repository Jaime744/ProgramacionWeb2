// T7 — Middleware de autenticación JWT
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { AppError } from '../utils/AppError.js'

export const authMiddleware = async (req, _res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Token requerido'))
  }

  const token = authHeader.split(' ')[1]
  // jwt.verify lanza excepción si el token es inválido → errorHandler lo captura
  const payload = jwt.verify(token, process.env.JWT_SECRET)

  const user = await User.findById(payload.id)
  if (!user || user.deleted) {
    return next(AppError.unauthorized('Usuario no encontrado'))
  }

  req.user = user
  next()
}
