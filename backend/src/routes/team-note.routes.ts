import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { upsertTeamNoteSchema, updateChallengeCurrentSchema } from '../types/team-note.types'
import {
  getAllTeamNotesHandler,
  getOwnTeamNoteHandler,
  updateOwnChallengeHandler,
  upsertTeamNoteHandler,
} from '../controllers/team-note.controller'

const teamNoteRouter = Router()

teamNoteRouter.use(requireAuth)

// GET /team-notes — admin : liste tous les vendeurs + leurs notes complètes
teamNoteRouter.get('/', requireAdmin, getAllTeamNotesHandler)

// GET /team-notes/me — tout utilisateur : sa propre note publique + challenges
teamNoteRouter.get('/me', getOwnTeamNoteHandler)

// PATCH /team-notes/me/challenges/:challengeId — tout utilisateur : met à jour son propre résultat
teamNoteRouter.patch(
  '/me/challenges/:challengeId',
  validateBody(updateChallengeCurrentSchema),
  updateOwnChallengeHandler,
)

// PUT /team-notes/:userId — admin : créer ou mettre à jour la note + challenges d'un vendeur
teamNoteRouter.put('/:userId', requireAdmin, validateBody(upsertTeamNoteSchema), upsertTeamNoteHandler)

export default teamNoteRouter
