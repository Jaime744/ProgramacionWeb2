// T5, T7 — Controlador de usuarios (MVC)
// Express 5 gestiona errores async automáticamente
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { Company } from '../models/Company.js'
import { AppError } from '../utils/AppError.js'
import { notificationService } from '../services/notification.service.js'

// ─── Helpers JWT ─────────────────────────────────────────────────────────────
const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  })

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  })

const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000)) // 6 dígitos

// ─── 1) Registro ─────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const { email, password } = req.body

  // Comprobar si ya existe un usuario verificado con ese email
  const existing = await User.findOne({ email, status: 'verified' })
  if (existing) throw AppError.conflict('Ya existe una cuenta con ese email')

  const hashedPassword   = await bcrypt.hash(password, 12)
  const verificationCode = generateVerificationCode()

  const refreshToken = generateRefreshToken('temp') // se actualiza tras guardar

  const user = await User.create({
    email,
    password:             hashedPassword,
    verificationCode,
    verificationAttempts: 3,
    status:               'pending',
    role:                 'admin',
  })

  const accessToken  = generateAccessToken(user._id)
  const newRefresh   = generateRefreshToken(user._id)
  user.refreshToken  = newRefresh
  await user.save()

  // T2 — Emitir evento
  notificationService.emit('user:registered', { email })

  // Consola para desarrollo: código de verificación
  console.log(`[DEV] Código de verificación para ${email}: ${verificationCode}`)

  res.status(201).json({
    data: {
      email:        user.email,
      status:       user.status,
      role:         user.role,
      accessToken,
      refreshToken: newRefresh,
    },
  })
}

// ─── 2) Validación del email ──────────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
  const { code } = req.body
  const user = req.user

  if (user.status === 'verified') {
    return res.json({ data: { message: 'Email ya verificado' } })
  }

  if (user.verificationAttempts <= 0) {
    throw AppError.tooManyRequests('Sin intentos restantes. Vuelve a registrarte.')
  }

  if (user.verificationCode !== code) {
    user.verificationAttempts -= 1
    await user.save()

    if (user.verificationAttempts === 0) {
      throw AppError.tooManyRequests('Código incorrecto. Se han agotado los intentos.')
    }

    throw AppError.badRequest(
      `Código incorrecto. Intentos restantes: ${user.verificationAttempts}`
    )
  }

  user.status = 'verified'
  user.verificationCode = undefined
  await user.save()

  notificationService.emit('user:verified', { email: user.email })

  res.json({ data: { message: 'Email verificado correctamente' } })
}

// ─── 3) Login ─────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { email, password } = req.body

  const user = await User.findOne({ email, deleted: false })
  if (!user) throw AppError.unauthorized('Credenciales incorrectas')

  const validPassword = await bcrypt.compare(password, user.password)
  if (!validPassword) throw AppError.unauthorized('Credenciales incorrectas')

  const accessToken  = generateAccessToken(user._id)
  const refreshToken = generateRefreshToken(user._id)

  user.refreshToken = refreshToken
  await user.save()

  res.json({
    data: {
      email:        user.email,
      status:       user.status,
      role:         user.role,
      accessToken,
      refreshToken,
    },
  })
}

// ─── 4a) Onboarding: datos personales ────────────────────────────────────────
export const updatePersonalData = async (req, res) => {
  const { name, lastName, nif } = req.body
  const user = req.user

  user.name     = name
  user.lastName = lastName
  user.nif      = nif
  await user.save()

  res.json({ data: { message: 'Datos personales actualizados', fullName: user.fullName } })
}

// ─── 4b) Onboarding: datos de compañía ───────────────────────────────────────
export const updateCompany = async (req, res) => {
  const user = req.user
  const { isFreelance } = req.body

  let companyData

  if (isFreelance) {
    // Autónomo: la company usa los datos personales del usuario
    if (!user.nif) throw AppError.badRequest('Completa tus datos personales antes del onboarding')
    companyData = {
      name:        user.fullName || user.name,
      cif:         user.nif,
      address:     user.address,
      isFreelance: true,
    }
  } else {
    companyData = {
      name:        req.body.name,
      cif:         req.body.cif,
      address:     req.body.address,
      isFreelance: false,
    }
  }

  // Lógica de asignación según el CIF
  const existing = await Company.findOne({ cif: companyData.cif, deleted: false })

  if (existing) {
    // Ya existe → el usuario se une como guest
    user.company = existing._id
    user.role    = 'guest'
    await user.save()
    return res.json({ data: { message: 'Te has unido a la compañía existente', role: 'guest' } })
  }

  // No existe → crear nueva compañía, el usuario es owner/admin
  const company = await Company.create({ owner: user._id, ...companyData })
  user.company = company._id
  await user.save()

  res.status(201).json({ data: { message: 'Compañía creada', company } })
}

// ─── 5) Logo de la compañía ───────────────────────────────────────────────────
export const uploadLogo = async (req, res) => {
  const user = req.user

  if (!user.company) throw AppError.badRequest('Debes completar el onboarding de compañía primero')
  if (!req.file)     throw AppError.badRequest('No se ha enviado ninguna imagen')

  const logoUrl = `/uploads/${req.file.filename}`
  await Company.findByIdAndUpdate(user.company, { logo: logoUrl })

  res.json({ data: { message: 'Logo actualizado', logo: logoUrl } })
}

// ─── 6) Obtener usuario (con populate) ───────────────────────────────────────
export const getUser = async (req, res) => {
  // T5 — populate para traer los datos completos de Company
  const user = await User.findById(req.user._id)
    .populate('company')
    .select('-password -refreshToken -verificationCode')

  // El virtual fullName aparece gracias a toJSON: { virtuals: true }
  res.json({ data: user })
}

// ─── 7a) Refresh token ───────────────────────────────────────────────────────
export const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET)
  } catch {
    throw AppError.unauthorized('Refresh token inválido o expirado')
  }

  const user = await User.findById(payload.id)
  if (!user || user.deleted || user.refreshToken !== token) {
    throw AppError.unauthorized('Refresh token inválido')
  }

  // Rotar el refresh token
  const newAccessToken  = generateAccessToken(user._id)
  const newRefreshToken = generateRefreshToken(user._id)
  user.refreshToken     = newRefreshToken
  await user.save()

  res.json({ data: { accessToken: newAccessToken, refreshToken: newRefreshToken } })
}

// ─── 7b) Logout ───────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  req.user.refreshToken = null
  await req.user.save()
  res.json({ data: { message: 'Sesión cerrada correctamente' } })
}

// ─── 8) Eliminar usuario (hard o soft) ───────────────────────────────────────
export const deleteUser = async (req, res) => {
  const { soft } = req.query
  const user = req.user

  if (soft === 'true') {
    // T6 — Soft delete
    user.deleted      = true
    user.refreshToken = null
    await user.save()
    notificationService.emit('user:deleted', { email: user.email, soft: true })
    return res.json({ data: { message: 'Cuenta desactivada (soft delete)' } })
  }

  // Hard delete
  await User.findByIdAndDelete(user._id)
  notificationService.emit('user:deleted', { email: user.email, soft: false })
  res.json({ data: { message: 'Cuenta eliminada permanentemente' } })
}

// ─── 9) Cambiar contraseña ────────────────────────────────────────────────────
export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await User.findById(req.user._id) // necesitamos el campo password

  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) throw AppError.unauthorized('La contraseña actual es incorrecta')

  user.password = await bcrypt.hash(newPassword, 12)
  await user.save()

  res.json({ data: { message: 'Contraseña actualizada correctamente' } })
}

// ─── 10) Invitar compañero ────────────────────────────────────────────────────
export const inviteUser = async (req, res) => {
  const { email, name, lastName } = req.body
  const adminUser = req.user

  if (!adminUser.company) {
    throw AppError.badRequest('Debes tener una compañía para invitar compañeros')
  }

  // Generar contraseña temporal (el invitado deberá cambiarla)
  const tempPassword    = Math.random().toString(36).slice(-10)
  const hashedPassword  = await bcrypt.hash(tempPassword, 12)
  const verificationCode = generateVerificationCode()

  const invited = await User.create({
    email,
    name,
    lastName,
    password:             hashedPassword,
    role:                 'guest',
    status:               'pending',
    company:              adminUser.company,
    verificationCode,
    verificationAttempts: 3,
  })

  // T2 — Emitir evento user:invited
  notificationService.emit('user:invited', {
    email:     invited.email,
    invitedBy: adminUser.email,
  })

  console.log(`[DEV] Contraseña temporal para ${email}: ${tempPassword}`)

  res.status(201).json({
    data: {
      message:  'Usuario invitado correctamente',
      email:    invited.email,
      role:     invited.role,
      company:  invited.company,
    },
  })
}
