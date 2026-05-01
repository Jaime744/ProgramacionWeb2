// T4, T6 — Schemas Zod: Client
import { z } from 'zod'

const addressSchema = z.object({
  street:   z.string().trim().optional(),
  number:   z.string().trim().optional(),
  postal:   z.string().trim().optional(),
  city:     z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional()

export const createClientSchema = z.object({
  name: z.string({ required_error: 'El nombre es obligatorio' }).trim().min(1),
  cif:  z.string({ required_error: 'El CIF es obligatorio' }).trim().min(1),
  email: z
    .string()
    .email('Formato de email inválido')
    .transform(v => v.toLowerCase().trim())
    .optional(),
  phone:   z.string().trim().optional(),
  address: addressSchema,
})

export const updateClientSchema = createClientSchema.partial()
