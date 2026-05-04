// Fase 5 — Lifecycle de la base de datos en memoria para los tests
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

// Importar los modelos asegura que estén registrados en mongoose antes de
// construir índices y antes de que cualquier ruta los use.
import '../src/models/User.js'
import '../src/models/Company.js'
import '../src/models/Client.js'
import '../src/models/Project.js'
import '../src/models/DeliveryNote.js'

let mongo

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri(), { dbName: 'jest' })

  // Forzamos la creación de índices (unique, compuestos…) para que los tests
  // que dependen de duplicados se comporten igual que en producción.
  await Promise.all(
    Object.values(mongoose.models).map((m) => m.init()),
  )
})

afterAll(async () => {
  await mongoose.disconnect()
  if (mongo) await mongo.stop()
})

// Limpiamos las colecciones entre tests para que cada uno arranque en blanco.
afterEach(async () => {
  const { collections } = mongoose.connection
  await Promise.all(
    Object.values(collections).map((c) => c.deleteMany({})),
  )
})
