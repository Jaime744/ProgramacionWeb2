// T5, T7 — Modelo Mongoose: User
// Incluye: virtuals, indexes, soft delete, refresh token
import mongoose from 'mongoose'

const addressSchema = new mongoose.Schema({
  street:   { type: String, trim: true },
  number:   { type: String, trim: true },
  postal:   { type: String, trim: true },
  city:     { type: String, trim: true },
  province: { type: String, trim: true },
}, { _id: false })

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  password:             { type: String, required: true },
  name:                 { type: String, trim: true },
  lastName:             { type: String, trim: true },
  nif:                  { type: String, trim: true },
  role:                 { type: String, enum: ['admin', 'guest'], default: 'admin' },
  status:               { type: String, enum: ['pending', 'verified'], default: 'pending' },
  verificationCode:     { type: String },
  verificationAttempts: { type: Number, default: 3 },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    default: null,
  },
  address:      addressSchema,
  refreshToken: { type: String, default: null },  // T7 — Refresh token
  deleted:      { type: Boolean, default: false }, // T6 — Soft delete
}, {
  timestamps: true,
  toJSON:   { virtuals: true }, // T5 — Necesario para que virtuals aparezcan en JSON
  toObject: { virtuals: true },
})

// T5 — Virtual: fullName
userSchema.virtual('fullName').get(function () {
  if (this.name && this.lastName) return `${this.name} ${this.lastName}`
  return this.name || ''
})

// T5 — Indexes para consultas frecuentes
userSchema.index({ email: 1 }, { unique: true })
userSchema.index({ company: 1 })
userSchema.index({ status: 1 })
userSchema.index({ role: 1 })

export const User = mongoose.model('User', userSchema)
