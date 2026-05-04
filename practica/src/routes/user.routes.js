// T4 — Rutas modulares: /api/user
import { Router } from 'express'
import { authMiddleware }  from '../middleware/auth.middleware.js'
import { checkRole }       from '../middleware/role.middleware.js'
import { validate }        from '../middleware/validate.js'
import { upload }          from '../middleware/upload.js'
import {
  register,
  verifyEmail,
  login,
  updatePersonalData,
  updateCompany,
  uploadLogo,
  getUser,
  refreshToken,
  logout,
  deleteUser,
  changePassword,
  inviteUser,
} from '../controllers/user.controller.js'
import {
  registerSchema,
  verifyCodeSchema,
  loginSchema,
  personalDataSchema,
  companySchema,
  changePasswordSchema,
  inviteSchema,
  refreshTokenSchema,
} from '../validators/user.validator.js'

const router = Router()

/**
 * @openapi
 * /api/user/register:
 *   post:
 *     tags: [Users]
 *     summary: Registro de usuario
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email, example: admin@bildy.com }
 *               password: { type: string, minLength: 8, example: secret12 }
 *     responses:
 *       201: { description: Usuario creado, devuelve token + user }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/register',  validate(registerSchema), register)

/**
 * @openapi
 * /api/user/login:
 *   post:
 *     tags: [Users]
 *     summary: Login
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200: { description: Token + refreshToken + user }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/login',     validate(loginSchema),    login)

/**
 * @openapi
 * /api/user/refresh:
 *   post:
 *     tags: [Users]
 *     summary: Renovar access token con refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200: { description: Nuevo access token }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/refresh',   validate(refreshTokenSchema), refreshToken)

/**
 * @openapi
 * /api/user/validation:
 *   put:
 *     tags: [Users]
 *     summary: Verificar email con código
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string, example: '123456' }
 *     responses:
 *       200: { description: Email verificado }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/validation', authMiddleware, validate(verifyCodeSchema), verifyEmail)

/**
 * @openapi
 * /api/user/register:
 *   put:
 *     tags: [Users]
 *     summary: Completar datos personales (onboarding)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:     { type: string }
 *               lastName: { type: string }
 *               nif:      { type: string }
 *     responses:
 *       200: { description: Usuario actualizado, content: { application/json: { schema: { $ref: '#/components/schemas/User' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/register',   authMiddleware, validate(personalDataSchema), updatePersonalData)

/**
 * @openapi
 * /api/user/company:
 *   patch:
 *     tags: [Users]
 *     summary: Crear o actualizar la compañía del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name:        { type: string }
 *               cif:         { type: string }
 *               isFreelance: { type: boolean }
 *               address:     { $ref: '#/components/schemas/Address' }
 *     responses:
 *       200: { description: Compañía actualizada, content: { application/json: { schema: { $ref: '#/components/schemas/Company' } } } }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch('/company',  authMiddleware, validate(companySchema),      updateCompany)

/**
 * @openapi
 * /api/user/logo:
 *   patch:
 *     tags: [Users]
 *     summary: Subir logo de la compañía
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo: { type: string, format: binary }
 *     responses:
 *       200: { description: Logo subido (URL en company.logo) }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.patch('/logo',     authMiddleware, upload.single('logo'),        uploadLogo)

/**
 * @openapi
 * /api/user:
 *   get:
 *     tags: [Users]
 *     summary: Obtener usuario autenticado
 *     responses:
 *       200:
 *         description: Usuario actual
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.get('/',           authMiddleware, getUser)

/**
 * @openapi
 * /api/user/logout:
 *   post:
 *     tags: [Users]
 *     summary: Logout (invalida refreshToken)
 *     responses:
 *       200: { description: Logout correcto }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.post('/logout',    authMiddleware, logout)

/**
 * @openapi
 * /api/user:
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar usuario (soft delete por defecto, ?soft=false para hard)
 *     parameters:
 *       - in: query
 *         name: soft
 *         schema: { type: boolean, default: true }
 *     responses:
 *       200: { description: Usuario eliminado }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.delete('/',        authMiddleware, deleteUser)

/**
 * @openapi
 * /api/user/password:
 *   put:
 *     tags: [Users]
 *     summary: Cambiar contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword: { type: string }
 *               newPassword: { type: string, minLength: 8 }
 *     responses:
 *       200: { description: Contraseña cambiada }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 */
router.put('/password',   authMiddleware, validate(changePasswordSchema), changePassword)

/**
 * @openapi
 * /api/user/invite:
 *   post:
 *     tags: [Users]
 *     summary: Invitar a un usuario "guest" a la compañía (solo admin)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       201: { description: Invitación enviada }
 *       400: { $ref: '#/components/responses/BadRequest' }
 *       401: { $ref: '#/components/responses/Unauthorized' }
 *       403: { $ref: '#/components/responses/Forbidden' }
 *       409: { $ref: '#/components/responses/Conflict' }
 */
router.post('/invite',    authMiddleware, checkRole('admin'), validate(inviteSchema), inviteUser)

export default router
