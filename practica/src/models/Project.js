// T5 — Modelo Mongoose: Project
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  street:   { type: String, trim: true },
  number:   { type: String, trim: true },
  postal:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
}, { _id: false })

const projectSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true },
  name:        { type: String, required: true, trim: true },
  projectCode: { type: String, required: true, trim: true },
  email:       { type: String, lowercase: true, trim: true },
  notes:       { type: String, trim: true },
  address:     addressSchema,
  active:      { type: Boolean, default: true },
  deleted:     { type: Boolean, default: false }, // T6 — Soft delete
}, { timestamps: true })

// projectCode único dentro de la misma compañía
projectSchema.index({ company: 1, projectCode: 1 }, { unique: true })
projectSchema.index({ company: 1, client: 1, deleted: 1 })

export const Project = mongoose.model('Project', projectSchema)
