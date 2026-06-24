import { Router } from 'express'
import { loginHandler, activateAccountHandler, changePasswordHandler } from '../controllers/auth.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { loginSchema, activateAccountSchema, changePasswordSchema } from '../types/auth.types'

const authRouter = Router()

// POST /auth/login — connexion avec CUID + mot de passe
authRouter.post('/login', validateBody(loginSchema), loginHandler)

// POST /auth/activate — définition du mot de passe définitif (première connexion)
authRouter.post('/activate', requireAuth, validateBody(activateAccountSchema), activateAccountHandler)

// POST /auth/change-password — changement de mot de passe depuis le profil (utilisateur connecté)
authRouter.post('/change-password', requireAuth, validateBody(changePasswordSchema), changePasswordHandler)

export default authRouter
