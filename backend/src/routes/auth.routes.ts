import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import {
  loginHandler,
  activateAccountHandler,
  changePasswordHandler,
  refreshTokenHandler,
  logoutHandler,
} from '../controllers/auth.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { loginSchema, activateAccountSchema, changePasswordSchema } from '../types/auth.types'

const authRouter = Router()

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Trop de tentatives de connexion, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// Généreux (20/15 min) : le refresh est appelé au démarrage et toutes les ~55 min en usage normal
const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Trop de tentatives de renouvellement de session, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const changePasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de tentatives de changement de mot de passe, réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
})

// POST /auth/login — connexion avec CUID + mot de passe
authRouter.post('/login', loginRateLimiter, validateBody(loginSchema), loginHandler)

// POST /auth/refresh — renouvelle l'access token via le cookie httpOnly (pas de body requis)
authRouter.post('/refresh', refreshRateLimiter, refreshTokenHandler)

// POST /auth/logout — efface le cookie de refresh token
authRouter.post('/logout', logoutHandler)

// POST /auth/activate — définition du mot de passe définitif (première connexion)
authRouter.post('/activate', requireAuth, validateBody(activateAccountSchema), activateAccountHandler)

// POST /auth/change-password — changement de mot de passe depuis le profil
authRouter.post('/change-password', requireAuth, changePasswordRateLimiter, validateBody(changePasswordSchema), changePasswordHandler)

export default authRouter
