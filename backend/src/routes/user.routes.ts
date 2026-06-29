import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { findAllUsers, updateUserColor, updateUserRole, softDeleteUser } from '../repositories/user.repository'
import { Role } from '@prisma/client'
import { adminCreateVendor, adminUpdateUserProfile, adminResetPassword } from '../services/user.service'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { updateRoleSchema } from '../types/user.types'
import { eventBus } from '../lib/event-bus'

const CUID_REGEX = /^[A-Z]{4}[0-9]{4}$/
const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

const updateColorSchema = z.object({
  color: z.string().regex(HEX_COLOR_REGEX, 'Couleur hex invalide (format attendu : #RRGGBB)'),
})

const createVendorSchema = z.object({
  name: z.string().min(2, 'Nom requis (2 caractères minimum)'),
  cuid: z.string().regex(CUID_REGEX, 'Format CUID invalide (ex : LERN5042)'),
  password: z.string().min(8, 'Mot de passe temporaire (8 caractères minimum)'),
  color: z.string().regex(HEX_COLOR_REGEX, 'Couleur hex invalide (format attendu : #RRGGBB)'),
})

const updateProfileSchema = z.object({
  cuid: z.string().regex(CUID_REGEX, 'Format CUID invalide (ex : LERN5042)').optional(),
  color: z.string().regex(HEX_COLOR_REGEX, 'Couleur hex invalide').optional(),
})

const resetPasswordSchema = z.object({
  newPassword: z.string().min(8, 'Mot de passe (8 caractères minimum)'),
})

const userRouter = Router()

userRouter.use(requireAuth)

// GET /users — liste tous les utilisateurs (nom, couleur, rôle) pour la sidebar et l'admin
userRouter.get('/', async (_request: Request, response: Response, next: NextFunction) => {
  try {
    const users = await findAllUsers()
    response.json(users)
  } catch (error) {
    next(error)
  }
})

// POST /users — admin : crée un nouveau vendeur
userRouter.post('/', requireAdmin, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const input = createVendorSchema.parse(request.body)
    const newUser = await adminCreateVendor(input)
    console.log(JSON.stringify({ event: 'admin.user.created', adminId: request.authenticatedUser!.userId, newUserId: newUser.id, newUserCuid: newUser.cuid, timestamp: new Date().toISOString() }))
    response.status(201).json(newUser)
  } catch (error) {
    next(error)
  }
})

// PATCH /users/:userId — admin : met à jour le profil (CUID, couleur)
userRouter.patch('/:userId', requireAdmin, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userId = request.params.userId as string
    const input = updateProfileSchema.parse(request.body)
    const updatedUser = await adminUpdateUserProfile(userId, input)
    response.json(updatedUser)
  } catch (error) {
    next(error)
  }
})

// PATCH /users/:userId/color — admin : met à jour uniquement la couleur d'un vendeur
userRouter.patch('/:userId/color', requireAdmin, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userId = request.params.userId as string
    const { color } = updateColorSchema.parse(request.body)
    await updateUserColor(userId, color)
    response.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// PATCH /users/:userId/role — admin : change le rôle d'un utilisateur (vendeur ↔ admin)
userRouter.patch('/:userId/role', requireAdmin, validateBody(updateRoleSchema), async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userId = request.params.userId as string
    const adminUserId = request.authenticatedUser!.userId

    if (userId === adminUserId) {
      response.status(400).json({ message: 'Impossible de modifier son propre rôle' })
      return
    }

    const { role } = request.body as { role: Role }
    await updateUserRole(userId, role)
    console.log(JSON.stringify({ event: 'admin.user.role_changed', adminId: adminUserId, targetUserId: userId, newRole: role, timestamp: new Date().toISOString() }))
    response.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// DELETE /users/:userId — admin : supprime un compte (impossible de se supprimer soi-même)
userRouter.delete('/:userId', requireAdmin, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userId = request.params.userId as string
    const adminUserId = request.authenticatedUser!.userId

    if (userId === adminUserId) {
      response.status(400).json({ message: 'Impossible de supprimer son propre compte' })
      return
    }

    await softDeleteUser(userId)
    eventBus.publishEvent({ type: 'user.deleted', userId })
    console.log(JSON.stringify({ event: 'admin.user.deleted', adminId: adminUserId, targetUserId: userId, timestamp: new Date().toISOString() }))
    response.json({ success: true })
  } catch (error) {
    next(error)
  }
})

// PATCH /users/:userId/reset-password — admin : réinitialise le mot de passe d'un vendeur
userRouter.patch('/:userId/reset-password', requireAdmin, async (request: Request, response: Response, next: NextFunction) => {
  try {
    const userId = request.params.userId as string
    const { newPassword } = resetPasswordSchema.parse(request.body)
    await adminResetPassword(userId, newPassword)
    console.log(JSON.stringify({ event: 'admin.user.password_reset', adminId: request.authenticatedUser!.userId, targetUserId: userId, timestamp: new Date().toISOString() }))
    response.json({ success: true })
  } catch (error) {
    next(error)
  }
})

export default userRouter
