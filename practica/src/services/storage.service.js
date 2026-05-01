// Fase 3 — Servicio de almacenamiento contra Cloudflare R2 (S3 compatible)
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { AppError } from '../utils/AppError.js'

const {
  R2_ACCOUNT_ID,
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET,
  R2_PUBLIC_URL,
} = process.env

let _client = null

const getClient = () => {
  if (_client) return _client
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
    throw AppError.internal('Credenciales de R2 no configuradas en el servidor')
  }
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  })
  return _client
}

const wrapNetworkError = (err, action) => {
  if (err instanceof AppError) return err
  const code = err?.$metadata?.httpStatusCode
  console.error(`[R2] Error en ${action}:`, err?.name, err?.message)
  return AppError.internal(
    `Error de almacenamiento (${action})${code ? ` [${code}]` : ''}: ${err?.message || 'fallo de red'}`,
  )
}

/**
 * Sube un Buffer al bucket configurado.
 * @param {Buffer} buffer
 * @param {string} key   Ruta dentro del bucket (p.ej. "signatures/abc.webp")
 * @param {string} contentType
 * @returns {Promise<{ key: string, url: string }>}
 */
export const uploadBuffer = async (buffer, key, contentType) => {
  if (!Buffer.isBuffer(buffer)) {
    throw AppError.badRequest('uploadBuffer: se esperaba un Buffer')
  }
  const client = getClient()
  try {
    await client.send(new PutObjectCommand({
      Bucket:      R2_BUCKET,
      Key:         key,
      Body:        buffer,
      ContentType: contentType,
    }))
  } catch (err) {
    throw wrapNetworkError(err, 'uploadBuffer')
  }
  return { key, url: getPublicUrl(key) }
}

/**
 * Borra un objeto del bucket.
 * @param {string} key
 */
export const deleteObject = async (key) => {
  if (!key) return
  const client = getClient()
  try {
    await client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key:    key,
    }))
  } catch (err) {
    throw wrapNetworkError(err, 'deleteObject')
  }
}

/**
 * Devuelve la URL pública para una key dada (basada en R2_PUBLIC_URL).
 */
export const getPublicUrl = (key) => {
  if (!R2_PUBLIC_URL) {
    throw AppError.internal('R2_PUBLIC_URL no configurada')
  }
  const base = R2_PUBLIC_URL.replace(/\/+$/, '')
  const path = String(key).replace(/^\/+/, '')
  return `${base}/${path}`
}

/**
 * Extrae la key (ruta dentro del bucket) a partir de una URL pública previamente
 * generada con getPublicUrl. Devuelve null si la URL no pertenece al bucket.
 */
export const extractKeyFromUrl = (url) => {
  if (!url || !R2_PUBLIC_URL) return null
  const base = R2_PUBLIC_URL.replace(/\/+$/, '')
  if (!url.startsWith(base + '/')) return null
  return url.slice(base.length + 1)
}
