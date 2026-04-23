// src/controllers/books.controller.js

const prisma = require("../config/prisma");

/**
 * GET /api/books
 * Lista libros con filtros opcionales por query string:
 * ?genre=Fantasía&author=Tolkien&available=true&page=1&limit=10
 */
async function getBooks(req, res, next) {
  try {
    const { genre, author, available, page = 1, limit = 10 } = req.query;

    const where = {};
    if (genre) where.genre = { contains: genre, mode: "insensitive" };
    if (author) where.author = { contains: author, mode: "insensitive" };
    if (available === "true") where.available = { gt: 0 };

    const skip = (Number(page) - 1) * Number(limit);

    const [books, total] = await Promise.all([
      prisma.book.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { title: "asc" },
        // Incluimos la media de valoraciones calculada con _avg
        include: {
          _count: { select: { loans: true, reviews: true } },
        },
      }),
      prisma.book.count({ where }),
    ]);

    res.json({
      data: books,
      pagination: { total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/books/:id
 * Detalle de un libro con sus reseñas y media de valoración.
 */
async function getBookById(req, res, next) {
  try {
    const book = await prisma.book.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        reviews: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { loans: true } },
      },
    });

    if (!book) return res.status(404).json({ error: "Libro no encontrado" });

    // Calcular media de valoración manualmente
    const avgRating = book.reviews.length
      ? book.reviews.reduce((sum, r) => sum + r.rating, 0) / book.reviews.length
      : null;

    res.json({ ...book, avgRating: avgRating ? Number(avgRating.toFixed(2)) : null });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/books
 * Crea un libro. Solo LIBRARIAN o ADMIN.
 */
async function createBook(req, res, next) {
  try {
    const { available, copies, ...rest } = req.body;

    const book = await prisma.book.create({
      data: {
        ...rest,
        copies,
        available: available ?? copies, // Si no se indica available, = copies
      },
    });

    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/books/:id
 * Actualiza un libro. Solo LIBRARIAN o ADMIN.
 */
async function updateBook(req, res, next) {
  try {
    const book = await prisma.book.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });

    res.json(book);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/books/:id
 * Elimina un libro. Solo ADMIN.
 */
async function deleteBook(req, res, next) {
  try {
    await prisma.book.delete({ where: { id: Number(req.params.id) } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook };
