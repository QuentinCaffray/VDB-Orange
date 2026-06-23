import { Router } from 'express'
import {
  getAllTasksHandler,
  createTaskHandler,
  takeTaskHandler,
  completeTaskHandler,
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

// POST /tasks — crée une tâche (admin uniquement)
taskRouter.post('/', requireAdmin, validateBody(createTaskSchema), createTaskHandler)

// PATCH /tasks/:id/take — un vendeur prend une tâche disponible
taskRouter.patch('/:id/take', takeTaskHandler)

// PATCH /tasks/:id/done — marque une tâche comme terminée (assigné ou admin)
taskRouter.patch('/:id/done', completeTaskHandler)

// DELETE /tasks/:id — supprime une tâche (admin uniquement)
taskRouter.delete('/:id', requireAdmin, deleteTaskHandler)

export default taskRouter
