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

// ── Rutas públicas ───────────────────────────────────────────────────────────
router.post('/register',  validate(registerSchema), register) // 1) Registro
router.post('/login',     validate(loginSchema),    login)    // 3) Login
router.post('/refresh',   validate(refreshTokenSchema), refreshToken) // 7a) Refresh

// ── Rutas protegidas (requieren JWT) ─────────────────────────────────────────
router.put('/validation', authMiddleware, validate(verifyCodeSchema), verifyEmail)   // 2) Verificar email
router.put('/register',   authMiddleware, validate(personalDataSchema), updatePersonalData) // 4a) Datos personales
router.patch('/company',  authMiddleware, validate(companySchema),      updateCompany)      // 4b) Compañía
router.patch('/logo',     authMiddleware, upload.single('logo'),        uploadLogo)         // 5) Logo
router.get('/',           authMiddleware, getUser)                                          // 6) Get user
router.post('/logout',    authMiddleware, logout)                                           // 7b) Logout
router.delete('/',        authMiddleware, deleteUser)                                       // 8) Eliminar
router.put('/password',   authMiddleware, validate(changePasswordSchema), changePassword)  // 9) Cambiar pass
router.post('/invite',    authMiddleware, checkRole('admin'), validate(inviteSchema), inviteUser) // 10) Invitar

export default router
