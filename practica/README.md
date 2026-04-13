# BildyApp API

API REST para gestión de albaranes — Práctica Intermedia Web II.

## Stack Tecnológico

- **Node.js 22** con ESM (`"type": "module"`)
- **Express 5** — manejo automático de errores async
- **MongoDB Atlas** + **Mongoose** (MVC, virtuals, indexes, populate)
- **Zod** — validación con `.transform()`, `.refine()`, `discriminatedUnion`
- **JWT** — access token (15 min) + refresh token (7 días)
- **bcryptjs** — hash de contraseñas
- **Multer** — subida de archivos (logos)
- **Helmet** + **express-rate-limit** + **express-mongo-sanitize** — seguridad
- **EventEmitter** — eventos del ciclo de vida del usuario

## Instalación

```bash
git clone <repo>
cd bildyapp-api
npm install
cp .env.example .env
# Rellena las variables en .env
```

## Variables de entorno (`.env`)

```
PORT=3000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=secreto_muy_seguro
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=otro_secreto_muy_seguro
JWT_REFRESH_EXPIRES_IN=7d
```

## Ejecución

```bash
# Desarrollo (con --watch y --env-file)
npm run dev

# Producción
npm start
```

## Endpoints

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| POST | `/api/user/register` | ❌ | Registro (devuelve tokens) |
| PUT | `/api/user/validation` | ✅ | Verificar email con código 6 dígitos |
| POST | `/api/user/login` | ❌ | Login (devuelve tokens) |
| PUT | `/api/user/register` | ✅ | Onboarding: datos personales |
| PATCH | `/api/user/company` | ✅ | Onboarding: crear/unirse a compañía |
| PATCH | `/api/user/logo` | ✅ | Subir logo de la compañía |
| GET | `/api/user` | ✅ | Obtener usuario (con populate Company) |
| POST | `/api/user/refresh` | ❌ | Renovar access token |
| POST | `/api/user/logout` | ✅ | Cerrar sesión |
| DELETE | `/api/user?soft=true` | ✅ | Eliminar cuenta (hard/soft) |
| PUT | `/api/user/password` | ✅ | Cambiar contraseña |
| POST | `/api/user/invite` | ✅ Admin | Invitar compañero |

Ver ejemplos completos en `api.http`.

## Estructura del proyecto

```
bildyapp-api/
├── src/
│   ├── controllers/user.controller.js   — Lógica de negocio
│   ├── middleware/
│   │   ├── auth.middleware.js            — Verificación JWT
│   │   ├── error-handler.js             — Errores centralizados
│   │   ├── role.middleware.js            — Autorización por roles
│   │   ├── upload.js                    — Multer
│   │   └── validate.js                  — Validación Zod
│   ├── models/
│   │   ├── User.js                       — Mongoose (virtuals + indexes)
│   │   └── Company.js                   — Mongoose
│   ├── routes/user.routes.js            — Rutas Express
│   ├── services/notification.service.js — EventEmitter (T2)
│   ├── utils/AppError.js                — Clase de errores (T6)
│   ├── validators/user.validator.js     — Schemas Zod (T4/T6)
│   ├── app.js                           — Configuración Express
│   └── index.js                         — Punto de entrada
├── uploads/                             — Logos subidos
├── api.http                             — Ejemplos REST Client
├── .env.example
└── package.json
```

## Temas del curso cubiertos

| Tema | Contenido |
|------|-----------|
| T1 | ESM, Node.js 22, `--watch`, `--env-file` |
| T2 | EventEmitter (`user:registered`, `user:verified`, `user:invited`, `user:deleted`) |
| T4 | Express 5, middleware, Zod |
| T5 | MVC, Mongoose, populate, virtuals (`fullName`), indexes |
| T6 | AppError, errorHandler, soft delete, Helmet, rate limiting, sanitización, Zod `.transform()` / `.refine()` |
| T7 | JWT access+refresh, bcrypt, roles admin/guest |

### Bonus implementados

- ✅ `PUT /api/user/password` con `.refine()` (nueva ≠ actual)
- ✅ `discriminatedUnion` en el schema de compañía según `isFreelance`
