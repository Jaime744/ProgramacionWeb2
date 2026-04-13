// T4, T6 — Esquemas Zod con transform y refine
import { z } from 'zod'

// ─── Registro ───────────────────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('Formato de email inválido')
    .transform(v => v.toLowerCase().trim()), // T6 — normalize con .transform()
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres'),
})

// ─── Validación de email ─────────────────────────────────────────────────────
export const verifyCodeSchema = z.object({
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .length(6, 'El código debe tener exactamente 6 dígitos')
    .regex(/^\d{6}$/, 'El código debe contener solo dígitos'),
})

// ─── Login ───────────────────────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('Formato de email inválido')
    .transform(v => v.toLowerCase().trim()),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(1, 'La contraseña es obligatoria'),
})

// ─── Onboarding: datos personales ───────────────────────────────────────────
export const personalDataSchema = z.object({
  name:     z.string({ required_error: 'El nombre es obligatorio' }).trim().min(1),
  lastName: z.string({ required_error: 'Los apellidos son obligatorios' }).trim().min(1),
  nif:      z.string({ required_error: 'El NIF es obligatorio' }).trim().min(1),
})

// ─── Onboarding: datos de la compañía ───────────────────────────────────────
// T6 BONUS — discriminatedUnion según isFreelance
const addressSchema = z.object({
  street:   z.string().trim().optional(),
  number:   z.string().trim().optional(),
  postal:   z.string().trim().optional(),
  city:     z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional()

const freelanceCompanySchema = z.object({
  isFreelance: z.literal(true),
  // Si es autónomo, los datos se toman del perfil del usuario (no hace falta enviarlos)
})

const normalCompanySchema = z.object({
  isFreelance: z.literal(false).default(false),
  name:    z.string({ required_error: 'El nombre de empresa es obligatorio' }).trim().min(1),
  cif:     z.string({ required_error: 'El CIF es obligatorio' }).trim().min(1),
  address: addressSchema,
})

// T6 BONUS — discriminatedUnion
export const companySchema = z.discriminatedUnion('isFreelance', [
  freelanceCompanySchema,
  normalCompanySchema,
])

// ─── Cambio de contraseña ────────────────────────────────────────────────────
// T6 BONUS — .refine() para validación cruzada
export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ required_error: 'La contraseña actual es obligatoria' }).min(1),
    newPassword: z
      .string({ required_error: 'La nueva contraseña es obligatoria' })
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
  })
  .refine(data => data.currentPassword !== data.newPassword, {
    message: 'La nueva contraseña debe ser diferente a la actual',
    path: ['newPassword'],
  })

// ─── Invitar compañero ───────────────────────────────────────────────────────
export const inviteSchema = z.object({
  email: z
    .string({ required_error: 'El email es obligatorio' })
    .email('Formato de email inválido')
    .transform(v => v.toLowerCase().trim()),
  name:     z.string().trim().optional(),
  lastName: z.string().trim().optional(),
})

// ─── Refresh token ───────────────────────────────────────────────────────────
export const refreshTokenSchema = z.object({
  refreshToken: z.string({ required_error: 'El refresh token es obligatorio' }).min(1),
})
