import { Router } from 'express'
import {
  getAllTasksHandler,
  createTaskHandler,
  takeTaskHandler,
  completeTaskHandler,
  releaseTaskHandler,
  getTaskHistoryForDateHandler,
  getActiveDatesHandler,
  deleteTaskHandler,
} from '../controllers/task.controller'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { createTaskSchema } from '../types/task.types'

const taskRouter = Router()

// Toutes les routes tâches nécessitent d'être connecté
taskRouter.use(requireAuth)

// GET /tasks — liste toutes les tâches (tous les utilisateurs connectés)
taskRouter.get('/', getAllTasksHandler)

// POST /tasks — crée une tâche (tout utilisateur connecté)
taskRouter.post('/', validateBody(createTaskSchema), createTaskHandler)

// PATCH /tasks/:id/take — un vendeur prend une tâche disponible
taskRouter.patch('/:id/take', takeTaskHandler)

// PATCH /tasks/:id/done — marque une tâche comme terminée (assigné ou admin)
taskRouter.patch('/:id/done', completeTaskHandler)

// GET /tasks/history?date=YYYY-MM-DD — tâches terminées ce jour-là (lecture seule, anti-triche)
taskRouter.get('/history', getTaskHistoryForDateHandler)

// GET /tasks/history/active-dates?month=N&year=N — jours du mois ayant au moins une tâche terminée
taskRouter.get('/history/active-dates', getActiveDatesHandler)

// PATCH /tasks/:id/release — remet une tâche en cours dans "À faire" (assigné ou admin)
taskRouter.patch('/:id/release', releaseTaskHandler)

// DELETE /tasks/:id — supprime une tâche (admin uniquement)
taskRouter.delete('/:id', requireAdmin, deleteTaskHandler)

export default taskRouter
