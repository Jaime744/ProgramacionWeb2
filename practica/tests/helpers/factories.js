// Helpers compartidos por los tests de integración
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import request from 'supertest'

import { User } from '../../src/models/User.js'
import { Company } from '../../src/models/Company.js'
import { Client } from '../../src/models/Client.js'
import { Project } from '../../src/models/Project.js'

const randomEmail = (prefix = 'user') =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@bildy.test`

const randomCif = (prefix = 'B') =>
  `${prefix}${Math.floor(10_000_000 + Math.random() * 89_999_999)}`

// ─── Usuarios ────────────────────────────────────────────────────────────────
export const createUser = async ({
  email   = randomEmail(),
  password = 'secret123',
  status  = 'verified',
  role    = 'admin',
  company = null,
  name    = 'Test',
  lastName = 'User',
  nif     = 'X1234567Y',
} = {}) => {
  const hashed = await bcrypt.hash(password, 8)
  const user = await User.create({
    email,
    password: hashed,
    status,
    role,
    company,
    name,
    lastName,
    nif,
    verificationCode:     '123456',
    verificationAttempts: 3,
  })
  return { user, password }
}

export const tokenFor = (user) =>
  jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' })

// Crea un usuario, una compañía y los enlaza. Devuelve { user, company, token }.
export const createUserWithCompany = async (opts = {}) => {
  const { user, password } = await createUser(opts.user)
  const company = await Company.create({
    owner: user._id,
    name:  opts.company?.name ?? 'Test Co.',
    cif:   opts.company?.cif ?? randomCif('A'),
    isFreelance: false,
  })
  user.company = company._id
  await user.save()
  return { user, company, password, token: tokenFor(user) }
}

// ─── Cliente / Proyecto semilla ──────────────────────────────────────────────
export const createSeedClient = async (user, company, overrides = {}) => Client.create({
  user:    user._id,
  company: company._id,
  name:    'Cliente Semilla',
  cif:     randomCif('C'),
  email:   'cliente@example.com',
  ...overrides,
})

export const createSeedProject = async (user, company, client, overrides = {}) => Project.create({
  user:        user._id,
  company:     company._id,
  client:      client._id,
  name:        'Proyecto Semilla',
  projectCode: `P-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  ...overrides,
})

// ─── HTTP / Login ────────────────────────────────────────────────────────────
// Realiza un login real contra la API y devuelve el accessToken.
export const loginRequest = async (app, email, password) => {
  const res = await request(app)
    .post('/api/user/login')
    .send({ email, password })
  return res
}

// PNG 1x1 transparente válido (suficiente para que sharp lo procese)
export const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=',
  'base64',
)
