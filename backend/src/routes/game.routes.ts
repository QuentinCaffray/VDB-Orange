import { Router } from 'express'
import {
  getActiveGameHandler,
  createGameHandler,
  pauseGameHandler,
  resumeGameHandler,
  resetGameHandler,
  finishGameHandler,
  adminAdvancePawnHandler,
  submitMoveRequestHandler,
  getPendingMoveRequestsHandler,
  resolveMoveRequestHandler,
} from '../controllers/game.controller'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'

const gameRouter = Router()

gameRouter.use(requireAuth)

// GET /game — état de la partie active (null si aucune)
gameRouter.get('/', getActiveGameHandler)

// POST /game — créer une nouvelle partie (admin)
gameRouter.post('/', requireAdmin, createGameHandler)

// PATCH /game/:id/pause — mettre en pause (admin)
gameRouter.patch('/:id/pause', requireAdmin, pauseGameHandler)

// PATCH /game/:id/resume — reprendre la partie (admin)
gameRouter.patch('/:id/resume', requireAdmin, resumeGameHandler)

// PATCH /game/:id/reset — remettre tous les pions à 0 (admin)
gameRouter.patch('/:id/reset', requireAdmin, resetGameHandler)

// PATCH /game/:id/finish — terminer manuellement la partie (admin)
gameRouter.patch('/:id/finish', requireAdmin, finishGameHandler)

// POST /game/:id/admin-advance — l'admin avance son propre pion directement
gameRouter.post('/:id/admin-advance', requireAdmin, adminAdvancePawnHandler)

// POST /game/:id/move-request — vendeur soumet une demande d'avancement
gameRouter.post('/:id/move-request', submitMoveRequestHandler)

// GET /game/:id/move-requests — liste des demandes en attente (admin)
gameRouter.get('/:id/move-requests', requireAdmin, getPendingMoveRequestsHandler)

// PATCH /game/move-requests/:requestId/resolve — approuver ou rejeter (admin)
gameRouter.patch('/move-requests/:requestId/resolve', requireAdmin, resolveMoveRequestHandler)

export default gameRouter
