// T1 — Punto de entrada: conecta MongoDB y arranca el servidor
// Fase 4 — Graceful shutdown (SIGTERM/SIGINT) con timeout de 10s
import mongoose from 'mongoose'
import app from './app.js'

const PORT        = process.env.PORT        || 3000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI no definida en .env')
  process.exit(1)
}

let server
let shuttingDown = false

const shutdown = async (signal) => {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`\n📴 Señal ${signal} recibida. Cerrando con gracia...`)

  // Timeout duro: si algo se cuelga, forzamos salida en 10s.
  const force = setTimeout(() => {
    console.error('⏱️  Timeout de 10s alcanzado. Forzando exit(1).')
    process.exit(1)
  }, 10_000)
  force.unref()

  try {
    if (server) {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      )
      console.log('🛑 HTTP server cerrado (no acepta nuevas conexiones).')
    }

    await mongoose.connection.close(false)
    console.log('🗄️  Conexión a MongoDB cerrada.')

    clearTimeout(force)
    process.exit(0)
  } catch (err) {
    console.error('Error durante shutdown:', err)
    process.exit(1)
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT',  () => shutdown('SIGINT'))

// T2 — async/await para la conexión a MongoDB
const start = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB Atlas')

  server = app.listen(PORT, () => {
    console.log(`🚀 BildyApp API corriendo en http://localhost:${PORT}`)
    console.log(`📚 Docs:    http://localhost:${PORT}/api-docs`)
    console.log(`❤️  Health: http://localhost:${PORT}/health`)
  })
}

start().catch((err) => {
  console.error('Error al arrancar:', err)
  process.exit(1)
})
