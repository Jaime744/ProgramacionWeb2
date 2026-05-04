// Fase 5 — Tests de integración: proyectos
import request from 'supertest'

import app from '../src/app.js'
import { Project } from '../src/models/Project.js'
import {
  createUserWithCompany,
  createSeedClient,
  createSeedProject,
} from './helpers/factories.js'

describe('Projects API', () => {
  let user, company, client, token

  beforeEach(async () => {
    ({ user, company, token } = await createUserWithCompany())
    client = await createSeedClient(user, company)
  })

  // ─── POST /api/project ─────────────────────────────────────────────────────
  describe('POST /api/project', () => {
    it('crea un proyecto enlazado a un cliente de la propia compañía', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name:        'Reforma',
          projectCode: 'P-001',
          client:      client._id.toString(),
        })

      expect(res.status).toBe(201)
      expect(res.body.data.projectCode).toBe('P-001')
      expect(res.body.data.client).toBe(client._id.toString())
    })

    it('rechaza si el client no pertenece a la compañía (400)', async () => {
      const other = await createUserWithCompany({ user: { email: 'foreign@x.test' } })
      const ajeno = await createSeedClient(other.user, other.company)

      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name:        'X',
          projectCode: 'P-002',
          client:      ajeno._id.toString(),
        })

      expect(res.status).toBe(400)
    })

    it('rechaza projectCode duplicado dentro de la compañía (409)', async () => {
      await createSeedProject(user, company, client, { projectCode: 'P-DUP' })

      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name:        'Duplicado',
          projectCode: 'P-DUP',
          client:      client._id.toString(),
        })

      expect(res.status).toBe(409)
    })

    it('valida ObjectId mal formado en client (400)', async () => {
      const res = await request(app)
        .post('/api/project')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name:        'X',
          projectCode: 'P-BAD',
          client:      'not-a-valid-id',
        })

      expect(res.status).toBe(400)
    })
  })

  // ─── GET /api/project (paginado y filtros) ─────────────────────────────────
  describe('GET /api/project', () => {
    beforeEach(async () => {
      for (let i = 0; i < 8; i += 1) {
        await createSeedProject(user, company, client, {
          name:        `Proy ${String(i).padStart(2, '0')}`,
          projectCode: `P-${i.toString().padStart(3, '0')}`,
        })
      }
    })

    it('pagina (limit=3 → 3 elementos por página, totalPages=3)', async () => {
      const res = await request(app)
        .get('/api/project?limit=3&page=1')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(3)
      expect(res.body.totalItems).toBe(8)
      expect(res.body.totalPages).toBe(3)
    })

    it('filtra por client', async () => {
      const otroCliente = await createSeedClient(user, company, { name: 'Cli B', cif: 'C200' })
      await createSeedProject(user, company, otroCliente, { projectCode: 'P-OTRO' })

      const res = await request(app)
        .get(`/api/project?client=${otroCliente._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].projectCode).toBe('P-OTRO')
    })

    it('filtra por active=false', async () => {
      const inactivo = await createSeedProject(user, company, client, {
        projectCode: 'P-INACTIVE',
        active:      false,
      })

      const res = await request(app)
        .get('/api/project?active=false')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0]._id).toBe(inactivo._id.toString())
    })
  })

  // ─── Aislamiento entre compañías ───────────────────────────────────────────
  describe('aislamiento', () => {
    it('no devuelve proyectos de otra compañía', async () => {
      const other = await createUserWithCompany({ user: { email: 'iso@x.test' } })
      const otherClient = await createSeedClient(other.user, other.company)
      await createSeedProject(other.user, other.company, otherClient)

      const mio = await createSeedProject(user, company, client)

      const res = await request(app)
        .get('/api/project')
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.data.map((p) => p._id)).toEqual([mio._id.toString()])
    })
  })

  // ─── PUT / DELETE / restore ────────────────────────────────────────────────
  describe('actualización y archivado', () => {
    it('PUT actualiza el proyecto', async () => {
      const p = await createSeedProject(user, company, client)

      const res = await request(app)
        .put(`/api/project/${p._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Renombrado' })

      expect(res.status).toBe(200)
      expect(res.body.data.name).toBe('Renombrado')
    })

    it('PUT con projectCode duplicado → 409', async () => {
      await createSeedProject(user, company, client, { projectCode: 'P-AAA' })
      const p = await createSeedProject(user, company, client, { projectCode: 'P-BBB' })

      const res = await request(app)
        .put(`/api/project/${p._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ projectCode: 'P-AAA' })

      expect(res.status).toBe(409)
    })

    it('soft delete + restore', async () => {
      const p = await createSeedProject(user, company, client)

      const del = await request(app)
        .delete(`/api/project/${p._id}?soft=true`)
        .set('Authorization', `Bearer ${token}`)
      expect(del.status).toBe(200)

      const archived = await request(app)
        .get('/api/project/archived')
        .set('Authorization', `Bearer ${token}`)
      expect(archived.body.data).toHaveLength(1)

      const restore = await request(app)
        .patch(`/api/project/${p._id}/restore`)
        .set('Authorization', `Bearer ${token}`)
      expect(restore.status).toBe(200)

      const refreshed = await Project.findById(p._id)
      expect(refreshed.deleted).toBe(false)
    })

    it('hard delete elimina', async () => {
      const p = await createSeedProject(user, company, client)

      const res = await request(app)
        .delete(`/api/project/${p._id}`)
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)

      const stored = await Project.findById(p._id)
      expect(stored).toBeNull()
    })

    it('GET /:id 404 para id inexistente', async () => {
      const res = await request(app)
        .get('/api/project/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})
