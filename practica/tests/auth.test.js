// Fase 5 — Tests de integración: registro / login / /api/user
import request from 'supertest'
import jwt from 'jsonwebtoken'

import app from '../src/app.js'
import { User } from '../src/models/User.js'
import {
  createUser,
  createUserWithCompany,
  loginRequest,
  tokenFor,
} from './helpers/factories.js'

describe('POST /api/user/register', () => {
  it('crea un usuario y devuelve accessToken + refreshToken', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'NewUser@Bildy.test', password: 'secret123' })

    expect(res.status).toBe(201)
    expect(res.body.data).toEqual(expect.objectContaining({
      email:        'newuser@bildy.test', // normalizado por Zod
      status:       'pending',
      role:         'admin',
      accessToken:  expect.any(String),
      refreshToken: expect.any(String),
    }))

    // El usuario quedó persistido y hashedo
    const stored = await User.findOne({ email: 'newuser@bildy.test' })
    expect(stored).not.toBeNull()
    expect(stored.password).not.toBe('secret123')
  })

  it('rechaza email inválido (400)', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'no-email', password: 'secret123' })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe('fail')
  })

  it('rechaza contraseña corta (400)', async () => {
    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'short@bildy.test', password: '123' })

    expect(res.status).toBe(400)
    expect(res.body.status).toBe('fail')
  })

  it('devuelve 409 si el email ya existe verificado', async () => {
    await createUser({ email: 'dup@bildy.test', status: 'verified' })

    const res = await request(app)
      .post('/api/user/register')
      .send({ email: 'dup@bildy.test', password: 'secret123' })

    expect(res.status).toBe(409)
  })
})

describe('PUT /api/user/validation', () => {
  it('verifica el email cuando el código es correcto', async () => {
    const { user } = await createUser({ status: 'pending' })
    const token = tokenFor(user)

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '123456' })

    expect(res.status).toBe(200)
    const refreshed = await User.findById(user._id)
    expect(refreshed.status).toBe('verified')
  })

  it('decrementa intentos y devuelve 400 si el código es incorrecto', async () => {
    const { user } = await createUser({ status: 'pending' })
    const token = tokenFor(user)

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '999999' })

    expect(res.status).toBe(400)
    const refreshed = await User.findById(user._id)
    expect(refreshed.verificationAttempts).toBe(2)
  })

  it('rechaza códigos con formato inválido (400)', async () => {
    const { user } = await createUser({ status: 'pending' })
    const token = tokenFor(user)

    const res = await request(app)
      .put('/api/user/validation')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'abc' })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/user/login', () => {
  it('devuelve token con credenciales correctas', async () => {
    const { user, password } = await createUser()

    const res = await loginRequest(app, user.email, password)

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toEqual(expect.any(String))
    expect(res.body.data.refreshToken).toEqual(expect.any(String))
  })

  it('rechaza con contraseña incorrecta (401)', async () => {
    const { user } = await createUser()

    const res = await loginRequest(app, user.email, 'wrong-pass')

    expect(res.status).toBe(401)
  })

  it('rechaza si el email no existe (401)', async () => {
    const res = await loginRequest(app, 'ghost@bildy.test', 'secret123')

    expect(res.status).toBe(401)
  })
})

describe('GET /api/user', () => {
  it('devuelve el usuario autenticado con su compañía populada', async () => {
    const { user, token, company } = await createUserWithCompany()

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    expect(res.body.data.email).toBe(user.email)
    expect(res.body.data.company._id).toBe(company._id.toString())
    expect(res.body.data.password).toBeUndefined()
  })

  it('devuelve 401 sin token', async () => {
    const res = await request(app).get('/api/user')
    expect(res.status).toBe(401)
  })

  it('devuelve 401 con token inválido', async () => {
    const res = await request(app)
      .get('/api/user')
      .set('Authorization', 'Bearer not-a-real-token')

    expect(res.status).toBe(401)
  })
})

describe('PATCH /api/user/company + PUT /api/user/register (onboarding)', () => {
  it('completa datos personales y luego crea la compañía', async () => {
    const { user } = await createUser({ name: undefined, lastName: undefined, nif: undefined })
    const token = tokenFor(user)

    const personal = await request(app)
      .put('/api/user/register')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Ana', lastName: 'Pérez', nif: 'X1111111Y' })
    expect(personal.status).toBe(200)

    const comp = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: false, name: 'BildyCo', cif: 'B11111111' })

    expect(comp.status).toBe(201)
    expect(comp.body.data.company.name).toBe('BildyCo')
  })

  it('isFreelance=true sin NIF responde 400', async () => {
    const { user } = await createUser()
    user.nif = undefined
    await user.save()
    const token = tokenFor(user)

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: true })

    expect(res.status).toBe(400)
  })

  it('isFreelance=true con NIF crea la compañía como autónomo', async () => {
    const { user } = await createUser({ nif: 'F99999999' })
    const token = tokenFor(user)

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${token}`)
      .send({ isFreelance: true })

    expect(res.status).toBe(201)
    expect(res.body.data.company.isFreelance).toBe(true)
    expect(res.body.data.company.cif).toBe('F99999999')
  })

  it('si la compañía ya existe (mismo CIF) el usuario se une como guest', async () => {
    // Primer usuario crea su compañía
    const owner = await createUser({ email: 'owner@bildy.test' })
    const ownerToken = tokenFor(owner.user)
    await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ isFreelance: false, name: 'Shared Co', cif: 'SHARED-CIF' })

    // Segundo usuario manda el mismo CIF → se une como guest
    const joiner = await createUser({ email: 'joiner@bildy.test' })
    const joinerToken = tokenFor(joiner.user)

    const res = await request(app)
      .patch('/api/user/company')
      .set('Authorization', `Bearer ${joinerToken}`)
      .send({ isFreelance: false, name: 'Whatever', cif: 'SHARED-CIF' })

    expect(res.status).toBe(200)
    expect(res.body.data.role).toBe('guest')
  })
})

describe('POST /api/user/refresh', () => {
  it('rota el refresh token y guarda el nuevo en BBDD', async () => {
    const { user, password } = await createUser()
    const login = await loginRequest(app, user.email, password)
    const refreshToken = login.body.data.refreshToken

    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken })

    expect(res.status).toBe(200)
    expect(res.body.data.accessToken).toEqual(expect.any(String))
    expect(res.body.data.refreshToken).toEqual(expect.any(String))

    // El refresh token persistido coincide con el devuelto (rotación efectiva)
    const refreshed = await User.findById(user._id)
    expect(refreshed.refreshToken).toBe(res.body.data.refreshToken)
  })

  it('rechaza un refresh token inválido (401)', async () => {
    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: 'fake.token.value' })

    expect(res.status).toBe(401)
  })

  it('rechaza un refresh token que no coincide con el guardado (401)', async () => {
    const { user } = await createUser()
    // Token con el secreto correcto pero no almacenado en el usuario
    const otherToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' })

    const res = await request(app)
      .post('/api/user/refresh')
      .send({ refreshToken: otherToken })

    expect(res.status).toBe(401)
  })
})

describe('POST /api/user/logout y DELETE /api/user', () => {
  it('hace logout (limpia refreshToken)', async () => {
    const { user, password } = await createUser()
    const login = await loginRequest(app, user.email, password)
    const access = login.body.data.accessToken

    const res = await request(app)
      .post('/api/user/logout')
      .set('Authorization', `Bearer ${access}`)

    expect(res.status).toBe(200)
    const refreshed = await User.findById(user._id)
    expect(refreshed.refreshToken).toBeNull()
  })

  it('soft-elimina al usuario', async () => {
    const { user } = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .delete('/api/user?soft=true')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const refreshed = await User.findById(user._id)
    expect(refreshed.deleted).toBe(true)
  })

  it('hard-elimina al usuario por defecto', async () => {
    const { user } = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .delete('/api/user')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(200)
    const refreshed = await User.findById(user._id)
    expect(refreshed).toBeNull()
  })
})

describe('app — middlewares globales', () => {
  it('GET /health responde con db connected y uptime', async () => {
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.db).toBe('connected')
    expect(typeof res.body.uptime).toBe('number')
  })

  it('sanitiza claves $-prefijadas y con punto en el body', async () => {
    // Payload con operadores Mongo: deben ser eliminados antes de llegar a la lógica.
    const res = await request(app)
      .post('/api/user/login')
      .send({ email: 'a@b.com', password: 'x', $where: '1==1', 'a.b': true })
    // Si la sanitización funciona, es un 401 (credenciales inválidas), no un 500.
    expect([400, 401]).toContain(res.status)
  })
})

describe('upload — file filters', () => {
  it('logo rechaza un mimetype no-imagen (400)', async () => {
    const { token } = await createUserWithCompany()

    const res = await request(app)
      .patch('/api/user/logo')
      .set('Authorization', `Bearer ${token}`)
      .attach('logo', Buffer.from('hello'), { filename: 'x.txt', contentType: 'text/plain' })

    expect(res.status).toBe(400)
  })
})

describe('error-handler — casos límite', () => {
  it('CastError de Mongo se traduce a 400', async () => {
    const { token } = await createUserWithCompany()

    // /api/client/:id no tiene validador, así que el id basura llega al controller
    // y findOne lanza CastError → error-handler responde 400.
    const res = await request(app)
      .get('/api/client/not-an-object-id')
      .set('Authorization', `Bearer ${token}`)

    expect(res.status).toBe(400)
    expect(res.body.message).toMatch(/ID inválido/)
  })

  it('TokenExpiredError se traduce a 401', async () => {
    const { user } = await createUser()
    const expired = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: -10 })

    const res = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${expired}`)

    expect(res.status).toBe(401)
  })
})

describe('PUT /api/user/password', () => {
  it('cambia la contraseña con la actual correcta', async () => {
    const { user, password } = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: 'newSecret123' })

    expect(res.status).toBe(200)

    // login ahora debe funcionar con la nueva
    const ok = await loginRequest(app, user.email, 'newSecret123')
    expect(ok.status).toBe(200)
  })

  it('rechaza si la contraseña actual es incorrecta (401)', async () => {
    const { user } = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'badpass', newPassword: 'newSecret123' })

    expect(res.status).toBe(401)
  })

  it('rechaza si la nueva es igual a la actual (400, refine)', async () => {
    const { user, password } = await createUser()
    const token = tokenFor(user)

    const res = await request(app)
      .put('/api/user/password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: password, newPassword: password })

    expect(res.status).toBe(400)
  })
})

describe('POST /api/user/invite (role middleware)', () => {
  it('admin puede invitar a un guest', async () => {
    const { user, token } = await createUserWithCompany()
    expect(user.role).toBe('admin')

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'guest@bildy.test', name: 'G', lastName: 'U' })

    expect(res.status).toBe(201)
    expect(res.body.data.role).toBe('guest')
  })

  it('un guest no puede invitar (403)', async () => {
    const { user, company } = await createUserWithCompany()
    user.role = 'guest'
    await user.save()
    const guestToken = tokenFor(user)

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${guestToken}`)
      .send({ email: 'g2@bildy.test' })

    expect(res.status).toBe(403)
    // El usuario seguía teniendo company asignada
    expect(company).toBeDefined()
  })

  it('un admin sin compañía no puede invitar (400)', async () => {
    const { user } = await createUser({ role: 'admin', company: null })
    const token = tokenFor(user)

    const res = await request(app)
      .post('/api/user/invite')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'g3@bildy.test' })

    expect(res.status).toBe(400)
  })
})
