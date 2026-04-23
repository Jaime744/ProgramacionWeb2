// src/utils/password.js
// Funciones para hashear y comparar contraseñas con bcrypt

const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10; // Factor de coste — más alto = más seguro pero más lento

/**
 * Genera el hash de una contraseña en texto plano.
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compara una contraseña en texto plano con su hash almacenado.
 * @returns {boolean}
 */
async function comparePasswords(plain, hashed) {
  return bcrypt.compare(plain, hashed);
}

module.exports = { hashPassword, comparePasswords };
