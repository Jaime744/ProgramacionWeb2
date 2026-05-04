// Fase 5 — Tests de integración: clientes
import request from 'supertest'

import app from '../src/app.js'
import { Client } from '../src/models/Client.js'
import {
  createUser,
  createUserWithCompany,
  createSeedClient,
  tokenFor,
} from './helpers/factories.js'

describe('Clients API', () => {
  let user, company, token

  beforeEach(async () => {
    ({ user, company, token } = await createUserWithCompany())
  })

  // ─── POST /api/client ──────────────────────────────────────────────────────
  describe('POST /api/client', () => {
    it('crea un cliente con CIF único', async () => {
      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente A', cif: 'C12345678', email: 'a@x.com' })

      expect(res.status).toBe(201)
      expect(res.body.data.name).toBe('Cliente A')
      expect(res.body.data.company).toBe(company._id.toString())
    })

    it('rechaza CIF duplicado dentro de la misma compañía (409)', async () => {
      await createSeedClient(user, company, { cif: 'C99999999' })

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Otro', cif: 'C99999999' })

      expect(res.status).toBe(409)
    })

    it('falla con 400 si el usuario no tiene compañía', async () => {
      const { user: solo } = await createUser({ company: null })
      const soloToken = tokenFor(solo)

      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${soloToken}`)
        .send({ name: 'X', cif: 'X1' })

      expect(res.status).toBe(400)
    })

    it('valida campos obligatorios (400 si falta nombre)', async () => {
      const res = await request(app)
        .post('/api/client')
        .set('Authorization', `Bearer ${token}`)
        .send({ cif: 'C0000' })

      expect(res.status).toBe(400)
    })
  })

  // ─── GET /api/client (paginado y filtros) ──────────────────────────────────
  describe('GET /api/client', () => {
    beforeEach(async () => {
      // 12 clientes para poder paginar
      for (let i = 0; i < 12; i += 1) {
        await createSeedClient(user, company, {
          name: `Cliente ${String(i).padStart(2, '0')}`,
          cif:  `C${i.toString().padStart(8, '0')}`,
        })
      }
    })

    it('devuelve la primera página (limit 5)', async () => {
      const res = await request(app)
        .get('/api/client?page=1&limit=5')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(5)
      expect(res.body.totalItems).toBe(12)
      expect(res.body.totalPages).toBe(3)
      expect(res.body.currentPage).toBe(1)
    })

    it('filtra por nombre (regex case-insensitive)', async () => {
      const res = await request(app)
        .get('/api/client?name=cliente%2005')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].name).toBe('Cliente 05')
    })

    it('aplica sort permitido', async () => {
      const res = await request(app)
        .get('/api/client?sort=-name&limit=3')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data[0].name).toBe('Cliente 11')
    })
  })

  // ─── Aislamiento entre compañías ───────────────────────────────────────────
  describe('aislamiento entre compañías', () => {
    it('un usuario no ve clientes de otra compañía', async () => {
      await createSeedClient(user, company, { name: 'Mío' })

      // Otro tenant con su propio cliente
      const other = await createUserWithCompany({ user: { email: 'other@x.test' } })
      await createSeedClient(other.user, other.company, { name: 'Ajeno' })

      const res = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.map((c) => c.name)).toEqual(['Mío'])
    })

    it('GET /api/client/:id devuelve 404 para id de otra compañía', async () => {
      const other = await createUserWithCompany({ user: { email: 'other2@x.test' } })
      const ajeno = await createSeedClient(other.user, other.company)

      const res = await request(app)
        .get(`/api/client/${ajeno._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── PUT /api/client/:id ───────────────────────────────────────────────────
  describe('PUT /api/client/:id', () => {
    it('actualiza un cliente existente', async () => {
      const c = await createSeedClient(user, company)

      const res = await request(app)
        .put(`/api/client/${c._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Cliente Renombrado' })

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Cliente Renombrado')
    })

    it('devuelve 409 si el nuevo CIF ya existe en la compañía', async () => {
      const c1 = await createSeedClient(user, company, { cif: 'C00010001' })
      await createSeedClient(user, company, { cif: 'C00010002' })

      const res = await request(app)
        .put(`/api/client/${c1._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ cif: 'C00010002' })

      expect(res.status).toBe(409)
    })

    it('404 al actualizar id inexistente', async () => {
      const res = await request(app)
        .put('/api/client/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nuevo' })

      expect(res.status).toBe(404)
    })
  })

  // ─── DELETE / archivado / restore ──────────────────────────────────────────
  describe('archivado y restauración', () => {
    it('soft delete archiva el cliente y aparece en /archived', async () => {
      const c = await createSeedClient(user, company)

      const del = await request(app)
        .delete(`/api/client/${c._id}?soft=true`)
        .set('Authorization', `Bearer ${token}`)
      expect(del.status).toBe(200)

      const list = await request(app)
        .get('/api/client')
        .set('Authorization', `Bearer ${token}`)
      expect(list.body.data).toHaveLength(0)

      const archived = await request(app)
        .get('/api/client/archived')
        .set('Authorization', `Bearer ${token}`)
      expect(archived.status).toBe(200)
      expect(archived.body.data).toHaveLength(1)
    })

    it('PATCH /api/client/:id/restore restaura un cliente archivado', async () => {
      const c = await createSeedClient(user, company)
      await Client.findByIdAndUpdate(c._id, { deleted: true })

      const res = await request(app)
        .patch(`/api/client/${c._id}/restore`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      const refreshed = await Client.findById(c._id)
      expect(refreshed.deleted).toBe(false)
    })

    it('hard delete elimina definitivamente', async () => {
      const c = await createSeedClient(user, company)

      const res = await request(app)
        .delete(`/api/client/${c._id}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)

      const stored = await Client.findById(c._id)
      expect(stored).toBeNull()
    })
  })
})
