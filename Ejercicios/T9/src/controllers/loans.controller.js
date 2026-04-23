// src/controllers/loans.controller.js

const prisma = require("../config/prisma");

const MAX_ACTIVE_LOANS = 3;
const LOAN_DAYS = 14;

/**
 * GET /api/loans
 * Devuelve los préstamos del usuario autenticado.
 */
async function getMyLoans(req, res, next) {
  try {
    const loans = await prisma.loan.findMany({
      where: { userId: req.user.id },
      include: { book: { select: { id: true, title: true, author: true, isbn: true } } },
      orderBy: { loanDate: "desc" },
    });

    res.json(loans);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/loans/all
 * Todos los préstamos (solo LIBRARIAN/ADMIN).
 */
async function getAllLoans(req, res, next) {
  try {
    const loans = await prisma.loan.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        book: { select: { id: true, title: true, isbn: true } },
      },
      orderBy: { loanDate: "desc" },
    });

    res.json(loans);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/loans
 * Solicita un préstamo aplicando todas las reglas de negocio:
 *  - Máximo 3 préstamos activos
 *  - No puede pedir el mismo libro dos veces activo
 *  - Debe haber ejemplares disponibles
 * Usa una transacción para garantizar consistencia.
 */
async function createLoan(req, res, next) {
  try {
    const { bookId } = req.body;
    const userId = req.user.id;

    // Todas las comprobaciones y la escritura en una sola transacción
    const loan = await prisma.$transaction(async (tx) => {
      // 1. ¿Cuántos préstamos activos tiene el usuario?
      const activeCount = await tx.loan.count({
        where: { userId, status: "ACTIVE" },
      });
      if (activeCount >= MAX_ACTIVE_LOANS) {
        const err = new Error(`Límite de ${MAX_ACTIVE_LOANS} préstamos activos alcanzado`);
        err.status = 400;
        throw err;
      }

      // 2. ¿Ya tiene este libro en préstamo activo?
      const existingLoan = await tx.loan.findFirst({
        where: { userId, bookId, status: "ACTIVE" },
      });
      if (existingLoan) {
        const err = new Error("Ya tienes este libro en préstamo");
        err.status = 400;
        throw err;
      }

      // 3. ¿Hay ejemplares disponibles?
      const book = await tx.book.findUnique({ where: { id: bookId } });
      if (!book) {
        const err = new Error("Libro no encontrado");
        err.status = 404;
        throw err;
      }
      if (book.available <= 0) {
        const err = new Error("No hay ejemplares disponibles");
        err.status = 400;
        throw err;
      }

      // 4. Crear préstamo
      const loanDate = new Date();
      const dueDate = new Date(loanDate);
      dueDate.setDate(dueDate.getDate() + LOAN_DAYS);

      const newLoan = await tx.loan.create({
        data: { userId, bookId, loanDate, dueDate, status: "ACTIVE" },
        include: { book: { select: { title: true } } },
      });

      // 5. Decrementar disponibilidad
      await tx.book.update({
        where: { id: bookId },
        data: { available: { decrement: 1 } },
      });

      return newLoan;
    });

    res.status(201).json(loan);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/loans/:id/return
 * Devuelve un libro: actualiza el préstamo y restaura available.
 */
async function returnLoan(req, res, next) {
  try {
    const loanId = Number(req.params.id);
    const userId = req.user.id;

    const loan = await prisma.$transaction(async (tx) => {
      const existing = await tx.loan.findUnique({ where: { id: loanId } });

      if (!existing) {
        const err = new Error("Préstamo no encontrado");
        err.status = 404;
        throw err;
      }

      // Solo el propio usuario puede devolver (o admins/librarians)
      if (existing.userId !== userId && !["ADMIN", "LIBRARIAN"].includes(req.user.role)) {
        const err = new Error("No puedes devolver un préstamo que no es tuyo");
        err.status = 403;
        throw err;
      }

      if (existing.status === "RETURNED") {
        const err = new Error("Este libro ya fue devuelto");
        err.status = 400;
        throw err;
      }

      const returnDate = new Date();
      const updatedLoan = await tx.loan.update({
        where: { id: loanId },
        data: { status: "RETURNED", returnDate },
        include: { book: { select: { title: true } } },
      });

      // Restaurar disponibilidad
      await tx.book.update({
        where: { id: existing.bookId },
        data: { available: { increment: 1 } },
      });

      return updatedLoan;
    });

    res.json(loan);
  } catch (err) {
    next(err);
  }
}

module.exports = { getMyLoans, getAllLoans, createLoan, returnLoan };
