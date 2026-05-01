// T5 — Modelo Mongoose: Client
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  street:   { type: String, trim: true },
  number:   { type: String, trim: true },
  postal:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
}, { _id: false })

const clientSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  name:    { type: String, required: true, trim: true },
  cif:     { type: String, required: true, trim: true },
  email:   { type: String, lowercase: true, trim: true },
  phone:   { type: String, trim: true },
  address: addressSchema,
  deleted: { type: Boolean, default: false }, // T6 — Soft delete
}, { timestamps: true })

// CIF único dentro de la misma compañía (incluye soft-deleted para que /restore funcione)
clientSchema.index({ company: 1, cif: 1 }, { unique: true })
clientSchema.index({ company: 1, deleted: 1 })

export const Client = mongoose.model('Client', clientSchema)
