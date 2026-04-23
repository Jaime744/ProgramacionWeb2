// src/schemas/validation.js
// Esquemas de validación con Zod para todos los endpoints

const { z } = require("zod");

// ── Auth ────────────────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ── Books ───────────────────────────────────────────────────────────────────

const createBookSchema = z.object({
  isbn: z.string().min(1, "ISBN requerido"),
  title: z.string().min(1),
  author: z.string().min(1),
  genre: z.string().min(1),
  description: z.string().optional(),
  publishedYear: z.number().int().min(1000).max(new Date().getFullYear()),
  copies: z.number().int().positive(),
  available: z.number().int().min(0).optional(), // Por defecto = copies
});

const updateBookSchema = createBookSchema.partial(); // Todos los campos opcionales

// ── Loans ───────────────────────────────────────────────────────────────────

const createLoanSchema = z.object({
  bookId: z.number().int().positive(),
});

// ── Reviews ─────────────────────────────────────────────────────────────────

const createReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

// ── Middleware genérico de validación ────────────────────────────────────────

/**
 * Devuelve un middleware Express que valida req.body con el esquema dado.
 * Si falla, responde con 400 y los errores de Zod.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Datos inválidos",
        details: result.error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    req.body = result.data; // Reemplaza el body con los datos validados/transformados
    next();
  };
}

module.exports = {
  registerSchema,
  loginSchema,
  createBookSchema,
  updateBookSchema,
  createLoanSchema,
  createReviewSchema,
  validate,
};
