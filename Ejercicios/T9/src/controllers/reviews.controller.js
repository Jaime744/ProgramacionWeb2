// src/controllers/reviews.controller.js

const prisma = require("../config/prisma");

/**
 * GET /api/books/:id/reviews
 * Lista todas las reseñas de un libro.
 */
async function getBookReviews(req, res, next) {
  try {
    const bookId = Number(req.params.id);

    // Verificar que el libro existe
    const book = await prisma.book.findUnique({ where: { id: bookId } });
    if (!book) return res.status(404).json({ error: "Libro no encontrado" });

    const reviews = await prisma.review.findMany({
      where: { bookId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });

    // Calcular media
    const avgRating = reviews.length
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : null;

    res.json({ reviews, avgRating: avgRating ? Number(avgRating.toFixed(2)) : null, total: reviews.length });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/books/:id/reviews
 * Crea una reseña.
 * Regla: solo usuarios que hayan devuelto ese libro pueden reseñar.
 */
async function createReview(req, res, next) {
  try {
    const bookId = Number(req.params.id);
    const userId = req.user.id;
    const { rating, comment } = req.body;

    // ¿El usuario tiene un préstamo DEVUELTO de este libro?
    const completedLoan = await prisma.loan.findFirst({
      where: { userId, bookId, status: "RETURNED" },
    });

    if (!completedLoan) {
      return res.status(403).json({
        error: "Solo puedes reseñar libros que hayas leído (préstamo devuelto)",
      });
    }

    const review = await prisma.review.create({
      data: { userId, bookId, rating, comment },
      include: { user: { select: { id: true, name: true } } },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err); // P2002 si ya existe reseña de ese usuario para ese libro
  }
}

/**
 * DELETE /api/reviews/:id
 * Elimina la propia reseña del usuario autenticado.
 */
async function deleteReview(req, res, next) {
  try {
    const reviewId = Number(req.params.id);
    const userId = req.user.id;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });

    if (!review) return res.status(404).json({ error: "Reseña no encontrada" });

    if (review.userId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "No puedes eliminar una reseña que no es tuya" });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getBookReviews, createReview, deleteReview };
