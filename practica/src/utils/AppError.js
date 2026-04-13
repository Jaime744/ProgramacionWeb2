// T6 — Clase de errores personalizada con métodos factoría
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = statusCode >= 500 ? 'error' : 'fail'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }

  // Métodos factoría para los errores más comunes
  static badRequest(message = 'Solicitud incorrecta') {
    return new AppError(message, 400)
  }

  static unauthorized(message = 'No autorizado') {
    return new AppError(message, 401)
  }

  static forbidden(message = 'Acceso denegado') {
    return new AppError(message, 403)
  }

  static notFound(message = 'Recurso no encontrado') {
    return new AppError(message, 404)
  }

  static conflict(message = 'Conflicto con el recurso existente') {
    return new AppError(message, 409)
  }

  static tooManyRequests(message = 'Demasiados intentos') {
    return new AppError(message, 429)
  }

  static internal(message = 'Error interno del servidor') {
    return new AppError(message, 500)
  }
}
