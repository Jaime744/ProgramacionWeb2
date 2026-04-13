// T6 — Middleware centralizado de errores
import { AppError } from '../utils/AppError.js'

export const errorHandler = (err, _req, res, _next) => {
  // Error de Mongoose: duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'campo'
    return res.status(409).json({
      status: 'fail',
      message: `Ya existe un registro con ese ${field}`,
    })
  }

  // Error de Mongoose: CastError (ObjectId inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      status: 'fail',
      message: `ID inválido: ${err.value}`,
    })
  }

  // Error JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ status: 'fail', message: 'Token inválido' })
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ status: 'fail', message: 'Token expirado' })
  }

  // AppError — errores operacionales conocidos
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    })
  }

  // Error inesperado
  console.error('ERROR NO CONTROLADO:', err)
  res.status(500).json({
    status: 'error',
    message: 'Error interno del servidor',
  })
}
