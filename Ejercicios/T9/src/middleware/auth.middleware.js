// src/middleware/auth.middleware.js
// Middlewares para autenticación (JWT) y autorización (roles)

const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/prisma");

/**
 * authenticate — Verifica que el request lleva un JWT válido.
 * Extrae el token del header: Authorization: Bearer <token>
 * Si es válido, adjunta el usuario completo a req.user
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token no proporcionado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyToken(token);

    // Verificar que el usuario aún existe en la BD (podría haberse eliminado)
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(401).json({ error: "Usuario no encontrado" });

    req.user = user; // Disponible en los controladores como req.user
    next();
  } catch {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

/**
 * authorize(...roles) — Factory que devuelve un middleware que verifica roles.
 * Se usa después de authenticate.
 * Ejemplo: authorize("ADMIN", "LIBRARIAN")
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso denegado. Roles requeridos: ${roles.join(", ")}`,
      });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
