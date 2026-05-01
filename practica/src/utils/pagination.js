// Fase 2 — Helper de paginación, sort y consulta paginada
// Centraliza la lógica que comparten los listados de Client/Project/DeliveryNote.

// Normaliza ?page y ?limit a enteros con valores por defecto y máximos sanos.
export const parsePagination = (query, { defaultLimit = 10, maxLimit = 100 } = {}) => {
  const page  = Math.max(parseInt(query.page,  10) || 1, 1)
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || defaultLimit, 1), maxLimit)
  const skip  = (page - 1) * limit
  return { page, limit, skip }
}

// Convierte ?sort=field o ?sort=-field (admite varios separados por coma) a objeto Mongoose.
// Solo acepta campos incluidos en `allowed` para evitar sort arbitrario.
export const parseSort = (sortParam, allowed = [], fallback = { createdAt: -1 }) => {
  if (!sortParam) return fallback
  const sort = {}
  for (const raw of String(sortParam).split(',')) {
    const token = raw.trim()
    if (!token) continue
    const dir   = token.startsWith('-') ? -1 : 1
    const field = token.replace(/^[-+]/, '')
    if (allowed.includes(field)) sort[field] = dir
  }
  return Object.keys(sort).length ? sort : fallback
}

// Ejecuta find + countDocuments en paralelo y devuelve la respuesta paginada estándar.
export const paginate = async (Model, filter, { page, limit, skip, sort, populate } = {}) => {
  let query = Model.find(filter).sort(sort).skip(skip).limit(limit)
  if (populate) {
    for (const p of [].concat(populate)) query = query.populate(p)
  }
  const [data, totalItems] = await Promise.all([
    query,
    Model.countDocuments(filter),
  ])
  return {
    data,
    totalItems,
    totalPages:  Math.max(Math.ceil(totalItems / limit), 1),
    currentPage: page,
  }
}
