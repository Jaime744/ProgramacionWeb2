// src/app.js
// Punto de entrada de la aplicación Express

require("dotenv").config(); // Carga variables de .env

const express = require("express");
const { errorHandler } = require("./middleware/error.middleware");
const { deleteReview } = require("./controllers/reviews.controller");
const { authenticate } = require("./middleware/auth.middleware");

// ── Rutas ────────────────────────────────────────────────────────────────────
const authRoutes    = require("./routes/auth.routes");
const booksRoutes   = require("./routes/books.routes");
const loansRoutes   = require("./routes/loans.routes");
const reviewsRoutes = require("./routes/reviews.routes");

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(express.json()); // Parsea el body como JSON automáticamente

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use("/api/auth",   authRoutes);
app.use("/api/books",  booksRoutes);
app.use("/api/loans",  loansRoutes);

// Reseñas anidadas bajo libros: /api/books/:id/reviews
app.use("/api/books/:id/reviews", reviewsRoutes);

// Eliminar reseña directamente: DELETE /api/reviews/:id
app.delete("/api/reviews/:id", authenticate, deleteReview);

// ── Ruta 404 ──────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Manejador de errores (siempre al final) ───────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📚 API de Biblioteca — Entorno: ${process.env.NODE_ENV || "development"}`);
});

module.exports = app; // Exportamos para tests
