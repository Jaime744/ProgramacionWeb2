// T5, T13 — Configuración de Multer para subida de logos
import multer from 'multer'
import path from 'node:path'
import { AppError } from '../utils/AppError.js'

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname)
    cb(null, `logo-${Date.now()}${ext}`)
  },
})

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB máximo
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new AppError('Solo se permiten imágenes', 400))
    }
    cb(null, true)
  },
})
