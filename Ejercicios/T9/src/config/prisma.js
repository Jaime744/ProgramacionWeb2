// src/config/prisma.js
// Exporta una única instancia del cliente Prisma (patrón Singleton)
// Evita abrir demasiadas conexiones en desarrollo con hot-reload

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
});

module.exports = prisma;
