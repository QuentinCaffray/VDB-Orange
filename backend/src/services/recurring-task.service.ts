import {
  findRecurringTaskById,
  findAllRecurringTasksForAdmin,
  findMaxRecurringTaskOrder,
  createRecurringTask as createRecurringTaskInDatabase,
  updateRecurringTaskById as updateRecurringTaskInDatabase,
  deleteRecurringTaskById as deleteRecurringTaskInDatabase,
  updateRecurringTaskOrders,
} from '../repositories/recurring-task.repository'
import { AppError } from '../types/error.types'
import { RecurringTaskAdminResponse, UpdateRecurringTaskInput } from '../types/recurring-task.types'

// ─── Types dérivés des résultats Prisma ───────────────────────────────────────

// Type commun pour les résultats admin (create, update, liste)
type RecurringTaskAdminQueryResult = Awaited<
  ReturnType<typeof findAllRecurringTasksForAdmin>
>[number]

// ─── Helpers de formatage ─────────────────────────────────────────────────────

function formatAdminQueryResultToResponse(
  task: RecurringTaskAdminQueryResult,
): RecurringTaskAdminResponse {
  return {
    id: task.id,
    title: task.title,
    order: task.order,
    isActive: task.isActive,
    createdAt: task.createdAt.toISOString(),
  }
}

// ─── Services admin ────────────────────────────────────────────────────────────

export async function getAllRecurringTasksForAdmin(): Promise<RecurringTaskAdminResponse[]> {
  const tasks = await findAllRecurringTasksForAdmin()
  return tasks.map(formatAdminQueryResultToResponse)
}

export async function createNewRecurringTask(title: string): Promise<RecurringTaskAdminResponse> {
  const maxOrder = await findMaxRecurringTaskOrder()
  // L'ordre de la nouvelle tâche est maxOrder + 1, ce qui la place en dernier
  const newTask = await createRecurringTaskInDatabase(title, maxOrder + 1)
  return formatAdminQueryResultToResponse(newTask)
}

export async function updateRecurringTaskForAdmin(
  recurringTaskId: string,
  updateData: UpdateRecurringTaskInput,
): Promise<RecurringTaskAdminResponse> {
  const existingTask = await findRecurringTaskById(recurringTaskId)
  if (!existingTask) {
    throw new AppError('Tâche récurrente introuvable', 404)
  }

  const updatedTask = await updateRecurringTaskInDatabase(recurringTaskId, updateData)
  return formatAdminQueryResultToResponse(updatedTask)
}

export async function deleteRecurringTaskForAdmin(recurringTaskId: string): Promise<void> {
  const existingTask = await findRecurringTaskById(recurringTaskId)
  if (!existingTask) {
    throw new AppError('Tâche récurrente introuvable', 404)
  }

  await deleteRecurringTaskInDatabase(recurringTaskId)
}

export async function reorderRecurringTasksForAdmin(orderedTaskIds: string[]): Promise<void> {
  await updateRecurringTaskOrders(orderedTaskIds)
}
