// src/controllers/auth.controller.js

const prisma = require("../config/prisma");
const { hashPassword, comparePasswords } = require("../utils/password");
const { signToken } = require("../utils/jwt");

/**
 * POST /api/auth/register
 * Crea un nuevo usuario con contraseña hasheada y devuelve un JWT.
 */
async function register(req, res, next) {
  try {
    const { email, name, password } = req.body;

    const hashed = await hashPassword(password);

    const user = await prisma.user.create({
      data: { email, name, password: hashed },
      select: { id: true, email: true, name: true, role: true }, // No devolvemos el hash
    });

    const token = signToken({ id: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, token });
  } catch (err) {
    next(err); // Pasa al errorHandler (gestionará P2002 si email duplicado)
  }
}

/**
 * POST /api/auth/login
 * Verifica credenciales y devuelve un JWT.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !(await comparePasswords(password, user.password))) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role });
    const { password: _, ...userSafe } = user; // Excluye el hash del response

    res.json({ user: userSafe, token });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Devuelve el perfil del usuario autenticado (req.user viene del middleware).
 */
async function getMe(req, res) {
  const { password: _, ...userSafe } = req.user;
  res.json({ user: userSafe });
}

module.exports = { register, login, getMe };
