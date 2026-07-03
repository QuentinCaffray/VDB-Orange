import { Request, Response, NextFunction } from 'express'
import {
  getRecurringTasksWithCompletions,
  completeRecurringTask,
  uncompleteRecurringTask,
  getAllRecurringTasksForAdmin,
  createNewRecurringTask,
  updateRecurringTaskForAdmin,
  deleteRecurringTaskForAdmin,
  reorderRecurringTasksForAdmin,
} from '../services/recurring-task.service'
import {
  RecurringTaskDateInput,
  CreateRecurringTaskInput,
  UpdateRecurringTaskInput,
  ReorderRecurringTasksInput,
} from '../types/recurring-task.types'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

// ─── Endpoints checklist quotidienne ─────────────────────────────────────────

// GET /api/recurring-tasks?date=YYYY-MM-DD
// Si la date est absente, le service utilise la date locale du serveur.
export async function getRecurringTasksHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const dateParam = request.query.date as string | undefined

    if (dateParam !== undefined && !DATE_REGEX.test(dateParam)) {
      response.status(400).json({ error: 'Paramètre date invalide — format attendu : YYYY-MM-DD' })
      return
    }

    const tasks = await getRecurringTasksWithCompletions(dateParam)
    response.json(tasks)
  } catch (error) {
    next(error)
  }
}

// POST /api/recurring-tasks/:taskId/complete
// Body validé par le middleware validateBody avant d'arriver ici.
export async function completeRecurringTaskHandler(
  request: Request<{ taskId: string }, unknown, RecurringTaskDateInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = request.params
    const { date } = request.body
    const currentUserId = request.authenticatedUser!.userId

    const updatedTask = await completeRecurringTask(taskId, currentUserId, date)
    response.status(201).json(updatedTask)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/recurring-tasks/:taskId/complete
// Réservé aux admins (middleware requireAdmin dans les routes).
// Body validé par le middleware validateBody avant d'arriver ici.
export async function uncompleteRecurringTaskHandler(
  request: Request<{ taskId: string }, unknown, RecurringTaskDateInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = request.params
    const { date } = request.body

    await uncompleteRecurringTask(taskId, date)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

// ─── Endpoints admin ──────────────────────────────────────────────────────────

// GET /api/recurring-tasks/admin
export async function getAdminRecurringTasksHandler(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const tasks = await getAllRecurringTasksForAdmin()
    response.json(tasks)
  } catch (error) {
    next(error)
  }
}

// POST /api/recurring-tasks/admin
// Body : { title: string }
export async function createAdminRecurringTaskHandler(
  request: Request<Record<string, never>, unknown, CreateRecurringTaskInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { title } = request.body
    const newTask = await createNewRecurringTask(title)
    response.status(201).json(newTask)
  } catch (error) {
    next(error)
  }
}

// PATCH /api/recurring-tasks/admin/reorder
// Body : { orderedIds: string[] }
// IMPORTANT : cette route doit être enregistrée AVANT /admin/:taskId dans le router
// pour qu'Express ne confonde pas "reorder" avec un taskId.
export async function reorderAdminRecurringTasksHandler(
  request: Request<Record<string, never>, unknown, ReorderRecurringTasksInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { orderedIds } = request.body
    await reorderRecurringTasksForAdmin(orderedIds)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

// PATCH /api/recurring-tasks/admin/:taskId
// Body : { title?: string, isActive?: boolean }
export async function updateAdminRecurringTaskHandler(
  request: Request<{ taskId: string }, unknown, UpdateRecurringTaskInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = request.params
    const updatedTask = await updateRecurringTaskForAdmin(taskId, request.body)
    response.json(updatedTask)
  } catch (error) {
    next(error)
  }
}

// DELETE /api/recurring-tasks/admin/:taskId
export async function deleteAdminRecurringTaskHandler(
  request: Request<{ taskId: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { taskId } = request.params
    await deleteRecurringTaskForAdmin(taskId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
