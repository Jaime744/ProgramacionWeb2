// Fase 3 — Generación de PDF de albarán con pdfkit
import PDFDocument from 'pdfkit'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Genera el PDF de un albarán y devuelve un Buffer.
 *
 * @param {object} ctx
 * @param {object} ctx.note      DeliveryNote (con .toObject() opcional)
 * @param {object} ctx.company   Compañía del usuario
 * @param {object} ctx.client    Cliente
 * @param {object} ctx.project   Proyecto
 * @param {object} ctx.user      Usuario creador
 * @param {Buffer} [ctx.signatureBuffer] Imagen de la firma (si está firmado)
 * @returns {Promise<Buffer>}
 */
export const generateDeliveryNotePdf = ({
  note,
  company,
  client,
  project,
  user,
  signatureBuffer,
}) => new Promise((resolve, reject) => {
  try {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    // ── Cabecera: logo + nombre empresa ──────────────────────────────────────
    drawHeader(doc, company)

    // ── Título ───────────────────────────────────────────────────────────────
    doc.moveDown(0.5)
    doc.fontSize(18).fillColor('#222').text('ALBARÁN', { align: 'center' })
    doc.fontSize(10).fillColor('#666')
       .text(`ID: ${note._id || note.id || ''}`, { align: 'center' })
       .text(`Fecha de trabajo: ${formatDate(note.workDate)}`, { align: 'center' })
       .text(`Emitido: ${formatDate(note.createdAt) || formatDate(new Date())}`, { align: 'center' })
    doc.moveDown(1)

    // ── Cliente / Proyecto / Usuario ─────────────────────────────────────────
    drawTwoCols(doc,
      {
        title: 'Cliente',
        lines: [
          client?.name,
          client?.cif && `CIF: ${client.cif}`,
          client?.email,
          client?.phone,
          formatAddress(client?.address),
        ],
      },
      {
        title: 'Proyecto',
        lines: [
          project?.name,
          project?.projectCode && `Código: ${project.projectCode}`,
          project?.email,
          formatAddress(project?.address),
        ],
      },
    )
    doc.moveDown(0.5)
    drawSection(doc, 'Emitido por', [
      [user?.name, user?.lastName].filter(Boolean).join(' ') || user?.email || '',
      user?.email,
      user?.nif && `NIF: ${user.nif}`,
    ])

    if (note.description) {
      doc.moveDown(0.5)
      drawSection(doc, 'Descripción', [note.description])
    }

    // ── Tabla según formato ──────────────────────────────────────────────────
    doc.moveDown(0.8)
    if (note.format === 'hours') {
      drawHoursTable(doc, note)
    } else {
      drawMaterialTable(doc, note)
    }

    // ── Firma ────────────────────────────────────────────────────────────────
    doc.moveDown(2)
    drawSignature(doc, note, signatureBuffer)

    doc.end()
  } catch (err) {
    reject(err)
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const drawHeader = (doc, company) => {
  const logoPath = resolveLocalLogo(company?.logo)
  if (logoPath) {
    try { doc.image(logoPath, 50, 45, { width: 60 }) } catch { /* noop */ }
  }
  doc.fontSize(16).fillColor('#222').text(company?.name || 'BildyApp', 120, 50)
  if (company?.cif) {
    doc.fontSize(10).fillColor('#666').text(`CIF: ${company.cif}`, 120, 70)
  }
  const addr = formatAddress(company?.address)
  if (addr) doc.fontSize(10).fillColor('#666').text(addr, 120, 84)
  doc.moveTo(50, 115).lineTo(545, 115).strokeColor('#ccc').stroke()
  doc.moveDown(2)
}

const drawTwoCols = (doc, left, right) => {
  const startY = doc.y
  const colW = (doc.page.width - 100) / 2 - 10
  drawSectionAt(doc, 50, startY, colW, left.title, left.lines)
  const leftBottom = doc.y
  drawSectionAt(doc, 50 + colW + 20, startY, colW, right.title, right.lines)
  doc.y = Math.max(leftBottom, doc.y)
}

const drawSection = (doc, title, lines) => {
  drawSectionAt(doc, 50, doc.y, doc.page.width - 100, title, lines)
}

const drawSectionAt = (doc, x, y, width, title, lines) => {
  doc.fontSize(11).fillColor('#444').text(title, x, y, { width, underline: true })
  doc.fontSize(10).fillColor('#222')
  for (const line of lines.filter(Boolean)) {
    doc.text(String(line), x, doc.y, { width })
  }
}

const drawMaterialTable = (doc, note) => {
  const headers = ['Material', 'Cantidad', 'Unidad']
  const rows = [[
    note.material || '-',
    note.quantity != null ? String(note.quantity) : '-',
    note.unit || '-',
  ]]
  drawTable(doc, headers, rows, [260, 110, 110])
}

const drawHoursTable = (doc, note) => {
  const headers = ['Trabajador', 'Horas']
  const rows = (note.workers || []).map((w) => [w.name || '-', String(w.hours ?? '-')])
  if (rows.length === 0 && note.hours != null) {
    rows.push(['(total)', String(note.hours)])
  }
  drawTable(doc, headers, rows, [360, 120])
  if (note.hours != null) {
    doc.moveDown(0.5)
    doc.fontSize(11).fillColor('#222').text(`Total horas: ${note.hours}`, { align: 'right' })
  }
}

const drawTable = (doc, headers, rows, widths) => {
  const startX = 50
  let y = doc.y
  const rowH = 20

  // Header
  doc.fontSize(10).fillColor('#fff')
  doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill('#444')
  let x = startX
  headers.forEach((h, i) => {
    doc.fillColor('#fff').text(h, x + 6, y + 5, { width: widths[i] - 12 })
    x += widths[i]
  })
  y += rowH

  // Rows
  doc.fillColor('#222')
  rows.forEach((row, idx) => {
    if (idx % 2 === 0) {
      doc.rect(startX, y, widths.reduce((a, b) => a + b, 0), rowH).fill('#f4f4f4')
    }
    let cx = startX
    doc.fillColor('#222')
    row.forEach((cell, i) => {
      doc.text(String(cell), cx + 6, y + 5, { width: widths[i] - 12 })
      cx += widths[i]
    })
    y += rowH
  })
  doc.y = y + 8
}

const drawSignature = (doc, note, signatureBuffer) => {
  doc.fontSize(11).fillColor('#444').text('Firma', 50, doc.y, { underline: true })
  const y = doc.y + 4
  if (note.signed && signatureBuffer) {
    try {
      doc.image(signatureBuffer, 50, y, { fit: [200, 80] })
    } catch {
      doc.fontSize(10).fillColor('#a00').text('(no se pudo renderizar la firma)', 50, y)
    }
    doc.fontSize(9).fillColor('#666')
       .text(`Firmado el ${formatDate(note.signedAt)}`, 50, y + 90)
  } else {
    doc.rect(50, y, 200, 70).strokeColor('#bbb').stroke()
    doc.fontSize(9).fillColor('#999').text('Pendiente de firma', 60, y + 30)
  }
}

const formatDate = (d) => {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

const formatAddress = (a) => {
  if (!a) return ''
  const parts = [
    [a.street, a.number].filter(Boolean).join(' '),
    [a.postal, a.city].filter(Boolean).join(' '),
    a.province,
  ].filter(Boolean)
  return parts.join(', ')
}

const resolveLocalLogo = (logo) => {
  if (!logo) return null
  // Solo intentamos cargar logos locales (las URL remotas las omitimos por simplicidad)
  if (/^https?:\/\//i.test(logo)) return null
  const filename = logo.replace(/^\/?uploads\/?/, '')
  const full = path.resolve('uploads', filename)
  return fs.existsSync(full) ? full : null
}
