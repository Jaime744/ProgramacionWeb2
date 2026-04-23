// prisma/seed.js
// Pobla la base de datos con datos de prueba realistas

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Sembrando base de datos...");

  // Limpiar datos previos en orden correcto (por las FK)
  await prisma.review.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.book.deleteMany();
  await prisma.user.deleteMany();

  // ── Usuarios ─────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("password123", 10);

  const [admin, librarian, user1, user2] = await Promise.all([
    prisma.user.create({
      data: { email: "admin@biblioteca.es", name: "Admin", password: hashedPassword, role: "ADMIN" },
    }),
    prisma.user.create({
      data: { email: "biblio@biblioteca.es", name: "Bibliotecario", password: hashedPassword, role: "LIBRARIAN" },
    }),
    prisma.user.create({
      data: { email: "ana@correo.es", name: "Ana García", password: hashedPassword, role: "USER" },
    }),
    prisma.user.create({
      data: { email: "luis@correo.es", name: "Luis Martínez", password: hashedPassword, role: "USER" },
    }),
  ]);

  // ── Libros ────────────────────────────────────────────────────────────
  const [libro1, libro2, libro3] = await Promise.all([
    prisma.book.create({
      data: {
        isbn: "978-84-204-2153-9",
        title: "Don Quijote de la Mancha",
        author: "Miguel de Cervantes",
        genre: "Clásico",
        description: "La obra cumbre de la literatura española.",
        publishedYear: 1605,
        copies: 5,
        available: 4,
      },
    }),
    prisma.book.create({
      data: {
        isbn: "978-0-7432-7356-5",
        title: "El señor de los anillos",
        author: "J.R.R. Tolkien",
        genre: "Fantasía",
        publishedYear: 1954,
        copies: 3,
        available: 2,
      },
    }),
    prisma.book.create({
      data: {
        isbn: "978-84-376-0494-7",
        title: "La casa de los espíritus",
        author: "Isabel Allende",
        genre: "Realismo mágico",
        publishedYear: 1982,
        copies: 4,
        available: 4,
      },
    }),
  ]);

  // ── Préstamo de prueba ────────────────────────────────────────────────
  const loanDate = new Date();
  const dueDate = new Date(loanDate);
  dueDate.setDate(dueDate.getDate() + 14);

  await prisma.loan.create({
    data: {
      userId: user1.id,
      bookId: libro1.id,
      loanDate,
      dueDate,
      status: "ACTIVE",
    },
  });

  // Reducir disponibilidad
  await prisma.book.update({ where: { id: libro1.id }, data: { available: { decrement: 1 } } });

  // ── Reseña de prueba (préstamo devuelto previo simulado) ──────────────
  await prisma.review.create({
    data: { userId: user2.id, bookId: libro2.id, rating: 5, comment: "¡Una obra maestra absoluta!" },
  });

  console.log(" Base de datos sembrada con éxito");
  console.log("\nCredenciales de prueba (contraseña: password123):");
  console.log("  Admin:         admin@biblioteca.es");
  console.log("  Bibliotecario: biblio@biblioteca.es");
  console.log("  Usuario:       ana@correo.es");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
