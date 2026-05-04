// Pequeñas pruebas unitarias para utilidades, para asegurar el 70% de branches.
import { AppError } from '../src/utils/AppError.js'
import { parsePagination, parseSort, paginate } from '../src/utils/pagination.js'

describe('AppError factories', () => {
  it.each([
    ['badRequest',       400],
    ['unauthorized',     401],
    ['forbidden',        403],
    ['notFound',         404],
    ['conflict',         409],
    ['tooManyRequests',  429],
    ['internal',         500],
  ])('AppError.%s() → status %d', (method, code) => {
    const e = AppError[method]()
    expect(e).toBeInstanceOf(AppError)
    expect(e.statusCode).toBe(code)
    // status: 'error' a partir de 500, 'fail' antes
    expect(e.status).toBe(code >= 500 ? 'error' : 'fail')
    // y aceptar mensaje custom
    expect(AppError[method]('custom').message).toBe('custom')
  })
})

describe('parsePagination', () => {
  it('aplica valores por defecto', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 })
  })

  it('respeta page/limit válidos', () => {
    expect(parsePagination({ page: '3', limit: '7' })).toEqual({ page: 3, limit: 7, skip: 14 })
  })

  it('clampa page mínimo a 1 y limit a [1, maxLimit]', () => {
    expect(parsePagination({ page: '0', limit: '0' })).toEqual({ page: 1, limit: 10, skip: 0 })
    expect(parsePagination({ page: '-5', limit: '500' })).toEqual({ page: 1, limit: 100, skip: 0 })
  })
})

describe('parseSort', () => {
  it('devuelve fallback si no se pasa', () => {
    expect(parseSort()).toEqual({ createdAt: -1 })
  })

  it('parsea ascendente y descendente', () => {
    expect(parseSort('name', ['name'])).toEqual({ name: 1 })
    expect(parseSort('-createdAt', ['createdAt'])).toEqual({ createdAt: -1 })
  })

  it('descarta campos no permitidos', () => {
    // password no está en allowed → cae al fallback
    expect(parseSort('password', ['name'])).toEqual({ createdAt: -1 })
  })

  it('admite varios separados por coma', () => {
    expect(parseSort('name,-createdAt', ['name', 'createdAt'])).toEqual({ name: 1, createdAt: -1 })
  })
})

describe('paginate (con populate)', () => {
  // Stub mínimo de un modelo Mongoose
  const buildStub = () => {
    const docs = [{ _id: '1' }, { _id: '2' }]
    const queryChain = {
      sort:     jest.fn().mockReturnThis(),
      skip:     jest.fn().mockReturnThis(),
      limit:    jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnThis(),
      then:     (resolve) => resolve(docs),
    }
    const Model = {
      find:           jest.fn().mockReturnValue(queryChain),
      countDocuments: jest.fn().mockResolvedValue(2),
    }
    return { Model, queryChain }
  }

  it('aplica un populate string', async () => {
    const { Model, queryChain } = buildStub()
    await paginate(Model, {}, { page: 1, limit: 10, skip: 0, sort: {}, populate: 'client' })
    expect(queryChain.populate).toHaveBeenCalledWith('client')
  })

  it('aplica varios populates', async () => {
    const { Model, queryChain } = buildStub()
    await paginate(Model, {}, { page: 1, limit: 10, skip: 0, sort: {}, populate: ['client', 'project'] })
    expect(queryChain.populate).toHaveBeenCalledTimes(2)
  })
})
