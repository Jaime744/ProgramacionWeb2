# 📚 T9 — API de Biblioteca con Supabase + Prisma

API REST completa para gestionar una biblioteca digital.

## Stack

- **Node.js + Express** — servidor HTTP
- **Prisma ORM** — acceso a la base de datos
- **Supabase (PostgreSQL)** — base de datos en la nube
- **JWT** — autenticación
- **bcryptjs** — hash de contraseñas
- **Zod** — validación de datos

## Puesta en marcha

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar entorno
cp .env.example .env
# Edita .env con tu DATABASE_URL de Supabase y un JWT_SECRET

# 3. Crear tablas en la BD
npx prisma migrate dev --name init

# 4. (Opcional) Poblar con datos de prueba
npm run db:seed

# 5. Arrancar servidor
npm run dev
```

## Credenciales de prueba (tras el seed)

| Rol         | Email                   | Contraseña  |
|-------------|-------------------------|-------------|
| ADMIN       | admin@biblioteca.es     | password123 |
| LIBRARIAN   | biblio@biblioteca.es    | password123 |
| USER        | ana@correo.es           | password123 |

## Endpoints

### Auth
| Método | Ruta              | Acceso       |
|--------|-------------------|--------------|
| POST   | /api/auth/register | Público      |
| POST   | /api/auth/login    | Público      |
| GET    | /api/auth/me       | Autenticado  |

### Books
| Método | Ruta            | Acceso           |
|--------|-----------------|------------------|
| GET    | /api/books       | Público          |
| GET    | /api/books/:id   | Público          |
| POST   | /api/books       | Librarian/Admin  |
| PUT    | /api/books/:id   | Librarian/Admin  |
| DELETE | /api/books/:id   | Admin            |

### Loans
| Método | Ruta                  | Acceso           |
|--------|-----------------------|------------------|
| GET    | /api/loans             | Autenticado      |
| GET    | /api/loans/all         | Librarian/Admin  |
| POST   | /api/loans             | Autenticado      |
| PUT    | /api/loans/:id/return  | Autenticado      |

### Reviews
| Método | Ruta                     | Acceso      |
|--------|--------------------------|-------------|
| GET    | /api/books/:id/reviews    | Público     |
| POST   | /api/books/:id/reviews    | Autenticado |
| DELETE | /api/reviews/:id          | Autenticado |

## Reglas de negocio implementadas

- Máximo 3 préstamos activos por usuario
- No se puede pedir el mismo libro dos veces activo
- Solo se presta si hay ejemplares disponibles (`available > 0`)
- Duración del préstamo: 14 días
- Solo una reseña por usuario por libro
- Solo se puede reseñar si se ha devuelto el libro
- Al prestar: `available--` / Al devolver: `available++` (en transacción atómica)
