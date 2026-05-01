// T4, T6 — Schemas Zod: DeliveryNote (con discriminatedUnion según `format`)
import { z } from 'zod'

const objectId = z
  .string({ required_error: 'El ID es obligatorio' })
  .regex(/^[0-9a-fA-F]{24}$/, 'ID inválido')

const workerSchema = z.object({
  name:  z.string({ required_error: 'El nombre del trabajador es obligatorio' }).trim().min(1),
  hours: z.number({ required_error: 'Las horas son obligatorias' }).nonnegative(),
})

const baseFields = {
  client:      objectId,
  project:     objectId,
  description: z.string().trim().optional(),
  workDate: z.coerce.date({
    required_error:     'La fecha de trabajo es obligatoria',
    invalid_type_error: 'Fecha inválida',
  }),
}

const materialBranch = z.object({
  ...baseFields,
  format:   z.literal('material'),
  material: z.string({ required_error: 'El material es obligatorio' }).trim().min(1),
  quantity: z.number({ required_error: 'La cantidad es obligatoria' }).nonnegative(),
  unit:     z.string({ required_error: 'La unidad es obligatoria' }).trim().min(1),
})

const hoursBranch = z.object({
  ...baseFields,
  format:  z.literal('hours'),
  hours:   z.number().nonnegative().optional(),
  workers: z.array(workerSchema).min(1, 'Debe haber al menos un trabajador'),
})

// T6 BONUS — discriminatedUnion según `format`
export const createDeliveryNoteSchema = z.discriminatedUnion('format', [
  materialBranch,
  hoursBranch,
])

// PUT: todos los campos opcionales. La coherencia material vs hours se valida en el controlador.
export const updateDeliveryNoteSchema = z.object({
  client:      objectId.optional(),
  project:     objectId.optional(),
  format:      z.enum(['material', 'hours']).optional(),
  description: z.string().trim().optional(),
  workDate:    z.coerce.date().optional(),
  material:    z.string().trim().optional(),
  quantity:    z.number().nonnegative().optional(),
  unit:        z.string().trim().optional(),
  hours:       z.number().nonnegative().optional(),
  workers:     z.array(workerSchema).optional(),
})
