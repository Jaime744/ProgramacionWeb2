// src/middleware/error.middleware.js
// Manejador global de errores de Express (4 parámetros = error handler)

/**
 * Captura errores de Prisma y los convierte en respuestas HTTP legibles.
 * Registrado al final de app.js con app.use(errorHandler)
 */
function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);

  // ── Errores de Prisma ──────────────────────────────────────────────────
  if (err.code) {
    switch (err.code) {
      // Violación de constraint UNIQUE (email duplicado, isbn duplicado, etc.)
      case "P2002": {
        const field = err.meta?.target?.[0] || "campo";
        return res.status(409).json({ error: `Ya existe un registro con ese ${field}` });
      }
      // Registro no encontrado al hacer update/delete
      case "P2025":
        return res.status(404).json({ error: "Registro no encontrado" });
      // FK violation — se referencia un ID que no existe
      case "P2003":
        return res.status(400).json({ error: "Referencia a un recurso que no existe" });
    }
  }

  // ── Error genérico ────────────────────────────────────────────────────
  const status = err.status || 500;
  const message = process.env.NODE_ENV === "production" && status === 500
    ? "Error interno del servidor"
    : err.message;

  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
