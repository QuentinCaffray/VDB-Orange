import { Router } from 'express'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import {
  createRecurringTaskSchema,
  updateRecurringTaskSchema,
  reorderRecurringTasksSchema,
} from '../types/recurring-task.types'
import {
  getAdminRecurringTasksHandler,
  createAdminRecurringTaskHandler,
  reorderAdminRecurringTasksHandler,
  updateAdminRecurringTaskHandler,
  deleteAdminRecurringTaskHandler,
} from '../controllers/recurring-task.controller'

const recurringTaskRouter = Router()

// Toutes les routes de gestion des tâches récurrentes nécessitent d'être connecté
recurringTaskRouter.use(requireAuth)

// ─── Gestion admin des tâches récurrentes ─────────────────────────────────────
// (les instances quotidiennes générées à partir de ces templates sont consultées
// et traitées via /api/tasks, exactement comme des tâches manuelles)

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

// DELETE /recurring-tasks/admin/:taskId — supprime le template (les tâches déjà
// générées survivent, détachées — voir onDelete: SetNull dans le schéma)
recurringTaskRouter.delete(
  '/admin/:taskId',
  requireAdmin,
  deleteAdminRecurringTaskHandler,
)

export default recurringTaskRouter
