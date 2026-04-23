// src/utils/jwt.js
// Funciones para firmar y verificar tokens JWT

const jwt = require("jsonwebtoken");

const SECRET = process.env.JWT_SECRET || "fallback_secret_dev";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Genera un token JWT con el payload del usuario.
 * @param {object} payload - Datos a incluir (id, email, role)
 * @returns {string} Token JWT firmado
 */
function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Verifica y decodifica un token JWT.
 * @param {string} token
 * @returns {object} Payload decodificado
 * @throws {Error} Si el token no es válido o ha expirado
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { signToken, verifyToken };
