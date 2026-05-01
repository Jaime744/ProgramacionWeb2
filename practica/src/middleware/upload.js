// T13 — Configuración de Multer (logo en disco, firma/PDF en memoria para R2)
import multer from 'multer'
import path from 'node:path'
import { AppError } from '../utils/AppError.js'

const ONE_MB = 1024 * 1024

// ── 1) Logo: se guarda en disco local (compatibilidad con código previo) ─────
const logoStorage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `logo-${Date.now()}${ext}`)
  },
})

export const upload = multer({
  storage: logoStorage,
  limits: { fileSize: 5 * ONE_MB },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Solo se permiten imágenes', 400))
    }
    cb(null, true)
  },
})

// ── 2) Firma: imagen en memoria (la procesamos con Sharp y subimos a R2) ─────
const ALLOWED_SIGNATURE_MIMETYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
])

export const uploadSignature = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 3 * ONE_MB },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_SIGNATURE_MIMETYPES.has(file.mimetype)) {
      return cb(new AppError('La firma debe ser una imagen (png/jpg/webp)', 400))
    }
    cb(null, true)
  },
})

// ── 3) PDF: archivos PDF en memoria (por si en el futuro se sube directo) ────
export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * ONE_MB },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      return cb(new AppError('Solo se permiten archivos PDF', 400))
    }
    cb(null, true)
  },
})
