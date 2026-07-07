import { Request, Response, NextFunction } from 'express'
import {
  getAllRecurringTasksForAdmin,
  createNewRecurringTask,
  updateRecurringTaskForAdmin,
  deleteRecurringTaskForAdmin,
  reorderRecurringTasksForAdmin,
} from '../services/recurring-task.service'
import { syncTaskInstancesWithRecurringTemplates } from '../services/task.service'
import { publishTaskSyncEvents } from './task.controller'
import {
  CreateRecurringTaskInput,
  UpdateRecurringTaskInput,
  ReorderRecurringTasksInput,
} from '../types/recurring-task.types'

// Répercute immédiatement une mutation admin (créer, renommer, activer/désactiver,
// réordonner) sur les instances du jour déjà générées, et notifie les clients connectés
// en temps réel — pour que le vendeur voie la liste des tâches changer sans recharger.
async function syncAndNotifyTaskInstances(): Promise<void> {
  const syncResult = await syncTaskInstancesWithRecurringTemplates()
  publishTaskSyncEvents(syncResult)
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
    await syncAndNotifyTaskInstances()
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
    await syncAndNotifyTaskInstances()
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
    await syncAndNotifyTaskInstances()
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
    await syncAndNotifyTaskInstances()
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
