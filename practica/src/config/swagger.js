// Fase 4 — Configuración de Swagger / OpenAPI 3.0
import swaggerJSDoc from 'swagger-jsdoc'

const PORT = process.env.PORT || 3000

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description:
        'API REST para gestión de albaranes (BildyApp). Incluye usuarios, ' +
        'compañías, clientes, proyectos y albaranes con firma + PDF.',
      contact: { name: 'BildyApp' },
      license: { name: 'MIT' },
    },
    servers: [
      { url: `http://localhost:${PORT}`, description: 'Local' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Address: {
          type: 'object',
          properties: {
            street:   { type: 'string', example: 'Calle Mayor' },
            number:   { type: 'string', example: '10' },
            postal:   { type: 'string', example: '28013' },
            city:     { type: 'string', example: 'Madrid' },
            province: { type: 'string', example: 'Madrid' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id:      { type: 'string', example: '65f5a0c2e1b7a8d9c0a12345' },
            email:    { type: 'string', format: 'email', example: 'admin@bildy.com' },
            name:     { type: 'string', example: 'Jaime' },
            lastName: { type: 'string', example: 'Cruz' },
            fullName: { type: 'string', example: 'Jaime Cruz' },
            nif:      { type: 'string', example: '12345678A' },
            role:     { type: 'string', enum: ['admin', 'guest'], example: 'admin' },
            status:   { type: 'string', enum: ['pending', 'verified'], example: 'verified' },
            company:  { type: 'string', nullable: true, example: '65f5a0c2e1b7a8d9c0a99999' },
            address:  { $ref: '#/components/schemas/Address' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Company: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            owner:       { type: 'string', description: 'ID del User propietario' },
            name:        { type: 'string', example: 'BildyApp S.L.' },
            cif:         { type: 'string', example: 'B12345678' },
            address:     { $ref: '#/components/schemas/Address' },
            logo:        { type: 'string', nullable: true, example: 'https://r2.../logo.png' },
            isFreelance: { type: 'boolean', example: false },
          },
        },
        Client: {
          type: 'object',
          properties: {
            _id:     { type: 'string' },
            user:    { type: 'string' },
            company: { type: 'string' },
            name:    { type: 'string', example: 'Acme Inc.' },
            cif:     { type: 'string', example: 'A87654321' },
            email:   { type: 'string', format: 'email', example: 'contacto@acme.com' },
            phone:   { type: 'string', example: '+34 600 000 000' },
            address: { $ref: '#/components/schemas/Address' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            user:        { type: 'string' },
            company:     { type: 'string' },
            client:      { type: 'string' },
            name:        { type: 'string', example: 'Reforma oficinas' },
            projectCode: { type: 'string', example: 'P-2026-001' },
            email:       { type: 'string', format: 'email' },
            notes:       { type: 'string' },
            address:     { $ref: '#/components/schemas/Address' },
            active:      { type: 'boolean', example: true },
            createdAt:   { type: 'string', format: 'date-time' },
            updatedAt:   { type: 'string', format: 'date-time' },
          },
        },
        Worker: {
          type: 'object',
          required: ['name', 'hours'],
          properties: {
            name:  { type: 'string', example: 'Pedro' },
            hours: { type: 'number', minimum: 0, example: 8 },
          },
        },
        DeliveryNote: {
          type: 'object',
          properties: {
            _id:         { type: 'string' },
            user:        { type: 'string' },
            company:     { type: 'string' },
            client:      { type: 'string' },
            project:     { type: 'string' },
            format:      { type: 'string', enum: ['material', 'hours'], example: 'hours' },
            description: { type: 'string', example: 'Trabajo de albañilería' },
            workDate:    { type: 'string', format: 'date-time' },
            material:    { type: 'string', nullable: true },
            quantity:    { type: 'number', nullable: true, minimum: 0 },
            unit:        { type: 'string', nullable: true },
            hours:       { type: 'number', nullable: true, minimum: 0 },
            workers: {
              type: 'array',
              items: { $ref: '#/components/schemas/Worker' },
            },
            signed:       { type: 'boolean', example: false },
            signedAt:     { type: 'string', format: 'date-time', nullable: true },
            signatureUrl: { type: 'string', nullable: true },
            pdfUrl:       { type: 'string', nullable: true },
            createdAt:    { type: 'string', format: 'date-time' },
            updatedAt:    { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { type: 'object' },
              description: 'Listado de elementos de la página actual',
            },
            page:       { type: 'integer', example: 1 },
            limit:      { type: 'integer', example: 10 },
            total:      { type: 'integer', example: 42 },
            totalPages: { type: 'integer', example: 5 },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            status:  { type: 'string', example: 'fail' },
            message: { type: 'string', example: 'Recurso no encontrado' },
            errors: {
              type: 'array',
              nullable: true,
              items: { type: 'object' },
              description: 'Detalle de errores de validación (si aplica)',
            },
          },
        },
      },
      responses: {
        BadRequest:    { description: 'Petición inválida', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Unauthorized:  { description: 'No autenticado',    content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Forbidden:     { description: 'Sin permisos',      content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        NotFound:      { description: 'No encontrado',     content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        Conflict:      { description: 'Conflicto',         content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
        ServerError:   { description: 'Error interno',     content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'Health',         description: 'Estado del servicio' },
      { name: 'Users',          description: 'Registro, login y gestión de usuarios' },
      { name: 'Clients',        description: 'Gestión de clientes' },
      { name: 'Projects',       description: 'Gestión de proyectos' },
      { name: 'Delivery Notes', description: 'Gestión de albaranes (firma + PDF)' },
    ],
  },
  apis: ['./src/routes/*.js', './src/app.js'],
}

export const swaggerSpec = swaggerJSDoc(options)
