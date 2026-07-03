import {
  findActiveRecurringTasksWithCompletionsForDate,
  findRecurringTaskById,
  findRecurringTaskCompletionByTaskAndDate,
  createRecurringTaskCompletion as createCompletionInDatabase,
  deleteRecurringTaskCompletion as deleteCompletionFromDatabase,
  findAllRecurringTasksForAdmin,
  findMaxRecurringTaskOrder,
  createRecurringTask as createRecurringTaskInDatabase,
  updateRecurringTaskById as updateRecurringTaskInDatabase,
  deleteRecurringTaskById as deleteRecurringTaskInDatabase,
  updateRecurringTaskOrders,
} from '../repositories/recurring-task.repository'
import { AppError } from '../types/error.types'
import {
  RecurringTaskResponse,
  RecurringTaskAdminResponse,
  UpdateRecurringTaskInput,
} from '../types/recurring-task.types'

// ─── Types dérivés des résultats Prisma ───────────────────────────────────────

// Type d'un élément renvoyé par la requête checklist quotidienne
type RecurringTaskQueryResult = Awaited<
  ReturnType<typeof findActiveRecurringTasksWithCompletionsForDate>
>[number]

// Type d'une completion renvoyée à la création
type CompletionCreationResult = Awaited<ReturnType<typeof createCompletionInDatabase>>

// Type commun pour les résultats admin (create, update, liste)
type RecurringTaskAdminQueryResult = Awaited<
  ReturnType<typeof findAllRecurringTasksForAdmin>
>[number]

// ─── Helpers de formatage ─────────────────────────────────────────────────────

function getLocalTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatQueryResultToResponse(task: RecurringTaskQueryResult): RecurringTaskResponse {
  const firstCompletion = task.completions[0] ?? null
  return {
    id: task.id,
    title: task.title,
    order: task.order,
    completion: firstCompletion ? buildCompletionInfo(firstCompletion) : null,
  }
}

function buildCompletionInfo(
  completion: CompletionCreationResult,
): RecurringTaskResponse['completion'] {
  return {
    completedAt: completion.completedAt.toISOString(),
    userId: completion.userId,
    userName: completion.user.name,
    userColor: completion.user.color,
  }
}

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

// ─── Services checklist quotidienne ───────────────────────────────────────────

export async function getRecurringTasksWithCompletions(
  dateString: string | undefined,
): Promise<RecurringTaskResponse[]> {
  const targetDateString = dateString ?? getLocalTodayDateString()
  const tasks = await findActiveRecurringTasksWithCompletionsForDate(targetDateString)
  return tasks.map(formatQueryResultToResponse)
}

export async function completeRecurringTask(
  recurringTaskId: string,
  userId: string,
  dateString: string,
): Promise<RecurringTaskResponse> {
  const task = await findRecurringTaskById(recurringTaskId)
  if (!task) {
    throw new AppError('Tâche récurrente introuvable', 404)
  }

  const existingCompletion = await findRecurringTaskCompletionByTaskAndDate(recurringTaskId, dateString)
  if (existingCompletion) {
    throw new AppError('Cette tâche est déjà cochée pour ce jour', 409)
  }

  const newCompletion = await createCompletionInDatabase(recurringTaskId, userId, dateString)

  return {
    id: task.id,
    title: task.title,
    order: task.order,
    completion: buildCompletionInfo(newCompletion),
  }
}

export async function uncompleteRecurringTask(
  recurringTaskId: string,
  dateString: string,
): Promise<void> {
  const task = await findRecurringTaskById(recurringTaskId)
  if (!task) {
    throw new AppError('Tâche récurrente introuvable', 404)
  }

  const existingCompletion = await findRecurringTaskCompletionByTaskAndDate(recurringTaskId, dateString)
  if (!existingCompletion) {
    throw new AppError("Cette tâche n'est pas cochée pour ce jour", 404)
  }

  await deleteCompletionFromDatabase(recurringTaskId, dateString)
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
