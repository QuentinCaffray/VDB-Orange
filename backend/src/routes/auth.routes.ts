import { Router } from 'express'
import { loginHandler, activateAccountHandler } from '../controllers/auth.controller'
import { requireAuth } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { loginSchema, activateAccountSchema } from '../types/auth.types'

const authRouter = Router()

// POST /auth/login — connexion avec CUID + mot de passe
authRouter.post('/login', validateBody(loginSchema), loginHandler)

// POST /auth/activate — définition du mot de passe définitif (première connexion)
authRouter.post('/activate', requireAuth, validateBody(activateAccountSchema), activateAccountHandler)

export default authRouter
