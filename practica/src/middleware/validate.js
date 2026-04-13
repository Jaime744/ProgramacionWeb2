// T4, T6 — Middleware de validación Zod
import { ZodError } from 'zod'
import { AppError } from '../utils/AppError.js'

/**
 * Crea un middleware que valida req.body contra el schema Zod proporcionado.
 * Si la validación falla, lanza un AppError 400 con los mensajes de Zod.
 * Si tiene éxito, los datos transformados (normalize, trim…) sobreescriben req.body.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body)
  if (!result.success) {
    const message = result.error.errors
      .map(e => `${e.path.join('.')}: ${e.message}`)
      .join(' | ')
    return next(AppError.badRequest(message))
  }
  req.body = result.data // datos ya transformados por Zod
  next()
}
