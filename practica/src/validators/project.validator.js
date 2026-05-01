// T4 — Schemas Zod: Project
import { z } from 'zod'

const objectId = z
  .string({ required_error: 'El ID es obligatorio' })
  .regex(/^[0-9a-fA-F]{24}$/, 'ID inválido')

const addressSchema = z.object({
  street:   z.string().trim().optional(),
  number:   z.string().trim().optional(),
  postal:   z.string().trim().optional(),
  city:     z.string().trim().optional(),
  province: z.string().trim().optional(),
}).optional()

export const createProjectSchema = z.object({
  client:      objectId,
  name:        z.string({ required_error: 'El nombre es obligatorio' }).trim().min(1),
  projectCode: z.string({ required_error: 'El código del proyecto es obligatorio' }).trim().min(1),
  email: z
    .string()
    .email('Formato de email inválido')
    .transform(v => v.toLowerCase().trim())
    .optional(),
  notes:   z.string().trim().optional(),
  address: addressSchema,
  active:  z.boolean().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()
