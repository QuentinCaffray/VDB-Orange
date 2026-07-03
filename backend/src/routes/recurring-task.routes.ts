import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import {
  recurringTaskDateSchema,
  createRecurringTaskSchema,
  updateRecurringTaskSchema,
  reorderRecurringTasksSchema,
} from '../types/recurring-task.types'
import {
  getRecurringTasksHandler,
  completeRecurringTaskHandler,
  uncompleteRecurringTaskHandler,
  getAdminRecurringTasksHandler,
  createAdminRecurringTaskHandler,
  reorderAdminRecurringTasksHandler,
  updateAdminRecurringTaskHandler,
  deleteAdminRecurringTaskHandler,
} from '../controllers/recurring-task.controller'

const recurringTaskRouter = Router()

// Toutes les routes de la checklist nécessitent d'être connecté
recurringTaskRouter.use(requireAuth)

// ─── Checklist quotidienne (tous les utilisateurs connectés) ──────────────────

// GET /recurring-tasks?date=YYYY-MM-DD — liste les tâches actives avec statut du jour
recurringTaskRouter.get('/', getRecurringTasksHandler)

// POST /recurring-tasks/:taskId/complete — coche une tâche
recurringTaskRouter.post(
  '/:taskId/complete',
  validateBody(recurringTaskDateSchema),
  completeRecurringTaskHandler,
)

// DELETE /recurring-tasks/:taskId/complete — décoche une tâche (admin uniquement)
recurringTaskRouter.delete(
  '/:taskId/complete',
  requireAdmin,
  validateBody(recurringTaskDateSchema),
  uncompleteRecurringTaskHandler,
)

// ─── Gestion admin des tâches récurrentes ─────────────────────────────────────

// GET /recurring-tasks/admin — liste toutes les tâches (actives + inactives)
recurringTaskRouter.get('/admin', requireAdmin, getAdminRecurringTasksHandler)

// POST /recurring-tasks/admin — crée une nouvelle tâche
recurringTaskRouter.post(
  '/admin',
  requireAdmin,
  validateBody(createRecurringTaskSchema),
  createAdminRecurringTaskHandler,
)

// PATCH /recurring-tasks/admin/reorder — réordonne les tâches
// IMPORTANT : enregistré AVANT /admin/:taskId pour qu'Express ne confonde pas
// le segment statique "reorder" avec un taskId dynamique.
recurringTaskRouter.patch(
  '/admin/reorder',
  requireAdmin,
  validateBody(reorderRecurringTasksSchema),
  reorderAdminRecurringTasksHandler,
)

// PATCH /recurring-tasks/admin/:taskId — modifie title et/ou isActive
recurringTaskRouter.patch(
  '/admin/:taskId',
  requireAdmin,
  validateBody(updateRecurringTaskSchema),
  updateAdminRecurringTaskHandler,
)

// DELETE /recurring-tasks/admin/:taskId — supprime une tâche (cascade sur les completions)
recurringTaskRouter.delete(
  '/admin/:taskId',
  requireAdmin,
  deleteAdminRecurringTaskHandler,
)

export default recurringTaskRouter
