// Fase 5 — Tests de integración: albaranes (CRUD, firma, PDF)
// Importante: mockeamos storage.service y pdf.service ANTES de importar app
// para que el controlador use los mocks (jest.mock se hoistea por babel-jest).

jest.mock('../src/services/storage.service.js', () => ({
  uploadBuffer: jest.fn().mockImplementation(async (_buf, key) => ({
    key,
    url: `https://test.r2.dev/${key}`,
  })),
  deleteObject:     jest.fn().mockResolvedValue(undefined),
  getPublicUrl:     jest.fn((k) => `https://test.r2.dev/${k}`),
  extractKeyFromUrl: jest.fn(() => null),
}))

jest.mock('../src/services/pdf.service.js', () => ({
  generateDeliveryNotePdf: jest
    .fn()
    .mockResolvedValue(Buffer.from('%PDF-1.4 fake-pdf')),
}))

import request from 'supertest'

import app from '../src/app.js'
import { DeliveryNote } from '../src/models/DeliveryNote.js'
import {
  createUserWithCompany,
  createSeedClient,
  createSeedProject,
  TINY_PNG,
} from './helpers/factories.js'

import * as storageService from '../src/services/storage.service.js'
import * as pdfService     from '../src/services/pdf.service.js'

describe('DeliveryNotes API', () => {
  let user, company, client, project, token

  beforeEach(async () => {
    ({ user, company, token } = await createUserWithCompany())
    client  = await createSeedClient(user, company)
    project = await createSeedProject(user, company, client)
  })

  // ─── POST /api/deliverynote ────────────────────────────────────────────────
  describe('POST /api/deliverynote', () => {
    it('crea un albarán de horas', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          client:   client._id.toString(),
          project:  project._id.toString(),
          format:   'hours',
          workDate: '2026-05-04T10:00:00Z',
          workers:  [{ name: 'Pepe', hours: 8 }],
        })

      expect(res.status).toBe(201)
      expect(res.body.data.format).toBe('hours')
      expect(res.body.data.signed).toBe(false)
    })

    it('crea un albarán de material', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          client:   client._id.toString(),
          project:  project._id.toString(),
          format:   'material',
          workDate: '2026-05-04',
          material: 'Cemento',
          quantity: 10,
          unit:     'sacos',
        })

      expect(res.status).toBe(201)
      expect(res.body.data.material).toBe('Cemento')
    })

    it('rechaza si el proyecto no pertenece al cliente (400)', async () => {
      const otroCliente = await createSeedClient(user, company, { cif: 'C-OTHER' })

      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({
          client:   otroCliente._id.toString(),
          project:  project._id.toString(),
          format:   'material',
          workDate: '2026-05-04',
          material: 'X', quantity: 1, unit: 'u',
        })

      expect(res.status).toBe(400)
    })

    it('rechaza si faltan campos obligatorios (400)', async () => {
      const res = await request(app)
        .post('/api/deliverynote')
        .set('Authorization', `Bearer ${token}`)
        .send({ client: client._id.toString() })

      expect(res.status).toBe(400)
    })
  })

  // ─── GET listado ──────────────────────────────────────────────────────────
  describe('GET /api/deliverynote', () => {
    beforeEach(async () => {
      for (let i = 0; i < 6; i += 1) {
        await DeliveryNote.create({
          user: user._id, company: company._id,
          client: client._id, project: project._id,
          format: 'material',
          material: `M-${i}`, quantity: i + 1, unit: 'u',
          workDate: new Date(`2026-04-0${i + 1}`),
        })
      }
    })

    it('pagina los resultados', async () => {
      const res = await request(app)
        .get('/api/deliverynote?limit=2&page=2')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data).toHaveLength(2)
      expect(res.body.totalItems).toBe(6)
      expect(res.body.totalPages).toBe(3)
    })

    it('filtra por rango de fechas (from/to)', async () => {
      const res = await request(app)
        .get('/api/deliverynote?from=2026-04-02&to=2026-04-04')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      // Las semillas tienen workDate 2026-04-01..2026-04-06; el rango incluye 02, 03, 04
      expect(res.body.data.length).toBe(3)
    })

    it('filtra por signed=false', async () => {
      const res = await request(app)
        .get('/api/deliverynote?signed=false')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBe(6)
    })

    it('filtra por project', async () => {
      const otroP = await createSeedProject(user, company, client, { projectCode: 'P-X' })
      await DeliveryNote.create({
        user: user._id, company: company._id,
        client: client._id, project: otroP._id,
        format: 'material', material: 'Z', quantity: 1, unit: 'u',
        workDate: new Date('2026-05-04'),
      })

      const res = await request(app)
        .get(`/api/deliverynote?project=${otroP._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.body.data).toHaveLength(1)
      expect(res.body.data[0].material).toBe('Z')
    })
  })

  // ─── GET /:id ──────────────────────────────────────────────────────────────
  describe('GET /api/deliverynote/:id', () => {
    it('devuelve el albarán con populates', async () => {
      const note = await DeliveryNote.create({
        user: user._id, company: company._id,
        client: client._id, project: project._id,
        format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
        workDate: new Date(),
      })

      const res = await request(app)
        .get(`/api/deliverynote/${note._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body.data.client.name).toBe(client.name)
      expect(res.body.data.project.projectCode).toBe(project.projectCode)
    })

    it('404 para id inexistente', async () => {
      const res = await request(app)
        .get('/api/deliverynote/507f1f77bcf86cd799439099')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })

  // ─── Firma + PDF ───────────────────────────────────────────────────────────
  describe('PATCH /api/deliverynote/:id/sign', () => {
    const createNote = () => DeliveryNote.create({
      user: user._id, company: company._id,
      client: client._id, project: project._id,
      format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
      workDate: new Date(),
    })

    it('firma el albarán: sube firma+PDF a R2 y deja signed=true', async () => {
      const note = await createNote()

      const res = await request(app)
        .patch(`/api/deliverynote/${note._id}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .attach('signature', TINY_PNG, { filename: 'sig.png', contentType: 'image/png' })

      expect(res.status).toBe(200)
      expect(res.body.data.signed).toBe(true)
      expect(res.body.data.signatureUrl).toMatch(/test\.r2\.dev\/signatures\//)
      expect(res.body.data.pdfUrl).toMatch(/test\.r2\.dev\/deliverynotes\//)

      // R2 y PDF se invocaron
      expect(storageService.uploadBuffer).toHaveBeenCalledTimes(2)
      expect(pdfService.generateDeliveryNotePdf).toHaveBeenCalledTimes(1)
    })

    it('400 si no se envía la firma', async () => {
      const note = await createNote()

      const res = await request(app)
        .patch(`/api/deliverynote/${note._id}/sign`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(400)
    })

    it('409 si ya estaba firmado', async () => {
      const note = await createNote()
      note.signed = true
      await note.save()

      const res = await request(app)
        .patch(`/api/deliverynote/${note._id}/sign`)
        .set('Authorization', `Bearer ${token}`)
        .attach('signature', TINY_PNG, { filename: 'sig.png', contentType: 'image/png' })

      expect(res.status).toBe(409)
    })
  })

  // ─── Edición / borrado bloqueados tras firma ───────────────────────────────
  describe('inmutabilidad tras firma', () => {
    const signedNote = async () => DeliveryNote.create({
      user: user._id, company: company._id,
      client: client._id, project: project._id,
      format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
      workDate: new Date(),
      signed: true, signedAt: new Date(),
      signatureUrl: 'https://test.r2.dev/signatures/x.webp',
      pdfUrl:       'https://test.r2.dev/deliverynotes/x.pdf',
    })

    it('PUT devuelve 409 si está firmado', async () => {
      const note = await signedNote()

      const res = await request(app)
        .put(`/api/deliverynote/${note._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ material: 'Cemento' })

      expect(res.status).toBe(409)
    })

    it('DELETE devuelve 409 si está firmado', async () => {
      const note = await signedNote()

      const res = await request(app)
        .delete(`/api/deliverynote/${note._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
    })

    it('DELETE soft también responde 409 si está firmado', async () => {
      const note = await signedNote()

      const res = await request(app)
        .delete(`/api/deliverynote/${note._id}?soft=true`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(409)
    })
  })

  // ─── Soft delete (no firmado) ──────────────────────────────────────────────
  describe('soft delete + hard delete (no firmado)', () => {
    const fresh = () => DeliveryNote.create({
      user: user._id, company: company._id,
      client: client._id, project: project._id,
      format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
      workDate: new Date(),
    })

    it('soft delete archiva un albarán no firmado', async () => {
      const note = await fresh()

      const res = await request(app)
        .delete(`/api/deliverynote/${note._id}?soft=true`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      const refreshed = await DeliveryNote.findById(note._id)
      expect(refreshed.deleted).toBe(true)
    })

    it('hard delete elimina un albarán no firmado', async () => {
      const note = await fresh()

      const res = await request(app)
        .delete(`/api/deliverynote/${note._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      const stored = await DeliveryNote.findById(note._id)
      expect(stored).toBeNull()
    })
  })

  // ─── PUT (no firmado) ──────────────────────────────────────────────────────
  describe('PUT /api/deliverynote/:id (no firmado)', () => {
    it('actualiza descripción', async () => {
      const note = await DeliveryNote.create({
        user: user._id, company: company._id,
        client: client._id, project: project._id,
        format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
        workDate: new Date(),
      })

      const res = await request(app)
        .put(`/api/deliverynote/${note._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ description: 'Actualizado' })

      expect(res.status).toBe(200)
      expect(res.body.data.description).toBe('Actualizado')
    })
  })

  // ─── Descarga del PDF ──────────────────────────────────────────────────────
  describe('GET /api/deliverynote/pdf/:id', () => {
    it('redirige a la URL pública si ya tiene pdfUrl', async () => {
      const note = await DeliveryNote.create({
        user: user._id, company: company._id,
        client: client._id, project: project._id,
        format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
        workDate: new Date(),
        signed: true, signedAt: new Date(),
        pdfUrl: 'https://test.r2.dev/deliverynotes/abc.pdf',
      })

      const res = await request(app)
        .get(`/api/deliverynote/pdf/${note._id}`)
        .set('Authorization', `Bearer ${token}`)
        .redirects(0)

      expect(res.status).toBe(302)
      expect(res.headers.location).toBe('https://test.r2.dev/deliverynotes/abc.pdf')
    })

    it('genera el PDF al vuelo si no hay pdfUrl', async () => {
      const note = await DeliveryNote.create({
        user: user._id, company: company._id,
        client: client._id, project: project._id,
        format: 'material', material: 'Yeso', quantity: 5, unit: 'kg',
        workDate: new Date(),
      })

      const res = await request(app)
        .get(`/api/deliverynote/pdf/${note._id}`)
        .set('Authorization', `Bearer ${token}`)
        .buffer(true)
        .parse((response, cb) => {
          const chunks = []
          response.on('data', (c) => chunks.push(c))
          response.on('end', () => cb(null, Buffer.concat(chunks)))
        })

      expect(res.status).toBe(200)
      expect(res.headers['content-type']).toMatch(/application\/pdf/)
      expect(pdfService.generateDeliveryNotePdf).toHaveBeenCalled()
    })
  })

  // ─── Aislamiento ───────────────────────────────────────────────────────────
  describe('aislamiento entre compañías', () => {
    it('GET /:id 404 si el albarán es de otra compañía', async () => {
      const other = await createUserWithCompany({ user: { email: 'foo@x.test' } })
      const oc = await createSeedClient(other.user, other.company)
      const op = await createSeedProject(other.user, other.company, oc)
      const note = await DeliveryNote.create({
        user: other.user._id, company: other.company._id,
        client: oc._id, project: op._id,
        format: 'material', material: 'Y', quantity: 1, unit: 'u',
        workDate: new Date(),
      })

      const res = await request(app)
        .get(`/api/deliverynote/${note._id}`)
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(404)
    })
  })
})
