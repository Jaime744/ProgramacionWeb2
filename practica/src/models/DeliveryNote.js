// T5 — Modelo Mongoose: DeliveryNote (Albarán)
import mongoose from 'mongoose'

const workerSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  hours: { type: Number, required: true, min: 0 },
}, { _id: false })

const deliveryNoteSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  client:  { type: mongoose.Schema.Types.ObjectId, ref: 'Client',  required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },

  format:      { type: String, enum: ['material', 'hours'], required: true },
  description: { type: String, trim: true },
  workDate:    { type: Date, required: true },

  // format === 'material'
  material: { type: String, trim: true },
  quantity: { type: Number, min: 0 },
  unit:     { type: String, trim: true },

  // format === 'hours'
  hours:   { type: Number, min: 0 },
  workers: { type: [workerSchema], default: [] },

  // Firma + PDF (Fase 3)
  signed:       { type: Boolean, default: false },
  signedAt:     { type: Date },
  signatureUrl: { type: String },
  pdfUrl:       { type: String },

  deleted: { type: Boolean, default: false }, // T6 — Soft delete
}, { timestamps: true })

deliveryNoteSchema.index({ company: 1, project: 1, deleted: 1 })
deliveryNoteSchema.index({ company: 1, client: 1, deleted: 1 })
deliveryNoteSchema.index({ company: 1, workDate: -1 })

export const DeliveryNote = mongoose.model('DeliveryNote', deliveryNoteSchema)
