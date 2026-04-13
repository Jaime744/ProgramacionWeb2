// T1 — Punto de entrada: conecta MongoDB y arranca el servidor
import mongoose from 'mongoose'
import app from './app.js'

const PORT       = process.env.PORT       || 3000
const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI no definida en .env')
  process.exit(1)
}

// T2 — async/await para la conexión a MongoDB
const start = async () => {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Conectado a MongoDB Atlas')

  app.listen(PORT, () => {
    console.log(`🚀 BildyApp API corriendo en http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Error al arrancar:', err)
  process.exit(1)
})
