import {
  findAllTasks,
  findTaskById,
  createTask as createTaskInDatabase,
  assignTaskToUser,
  markTaskAsDone as markTaskAsDoneInDatabase,
  releaseTask as releaseTaskInDatabase,
  findTasksDoneOnDate,
  findDoneTaskDatesInMonth,
  deleteTask as deleteTaskFromDatabase,
} from '../repositories/task.repository'
import { TaskResponse } from '../types/task.types'
import { AppError } from '../types/error.types'
import { Role, TaskStatus } from '@prisma/client'

// Convertit un objet Prisma en TaskResponse (dates en string ISO)
function formatTaskResponse(task: {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee: { id: string; name: string; color: string } | null
  doneAt: Date | null
  createdAt: Date
}): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assignee: task.assignee,
    doneAt: task.doneAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
  }
}

export async function getAllTasks(): Promise<TaskResponse[]> {
  const tasks = await findAllTasks()
  return tasks.map(formatTaskResponse)
}

export async function createTask(
  title: string,
  description: string | undefined,
  createdById: string,
): Promise<TaskResponse> {
  const newTask = await createTaskInDatabase(title, description, createdById)
  return formatTaskResponse(newTask)
}

export async function takeTask(
  taskId: string,
  currentUserId: string,
): Promise<TaskResponse> {
  const task = await findTaskById(taskId)

  if (!task) {
    throw new AppError('Tâche introuvable', 404)
  }

  const isTaskAvailable = task.status === TaskStatus.todo && task.assigneeId === null
  if (!isTaskAvailable) {
    throw new AppError('Cette tâche n\'est pas disponible', 409)
  }

  const updatedTask = await assignTaskToUser(taskId, currentUserId)
  return formatTaskResponse(updatedTask)
}

export async function completeTask(
  taskId: string,
  currentUserId: string,
  currentUserRole: Role,
): Promise<TaskResponse> {
  const task = await findTaskById(taskId)

  if (!task) {
    throw new AppError('Tâche introuvable', 404)
  }

  if (task.status !== TaskStatus.doing) {
    throw new AppError('Seule une tâche en cours peut être terminée', 409)
  }

  const isAssignee = task.assigneeId === currentUserId
  const isAdmin = currentUserRole === Role.admin
  const isAllowedToComplete = isAssignee || isAdmin

  if (!isAllowedToComplete) {
    throw new AppError('Seul l\'assigné ou un admin peut terminer cette tâche', 403)
  }

  const updatedTask = await markTaskAsDoneInDatabase(taskId)
  return formatTaskResponse(updatedTask)
}

export async function releaseTask(
  taskId: string,
  currentUserId: string,
  currentUserRole: Role,
): Promise<TaskResponse> {
  const task = await findTaskById(taskId)

  if (!task) {
    throw new AppError('Tâche introuvable', 404)
  }

  if (task.status !== TaskStatus.doing) {
    throw new AppError('Seule une tâche en cours peut être remise à disposition', 409)
  }

  const isAssignee = task.assigneeId === currentUserId
  const isAdmin = currentUserRole === Role.admin
  const isAllowedToRelease = isAssignee || isAdmin

  if (!isAllowedToRelease) {
    throw new AppError('Seul l\'assigné ou un admin peut remettre cette tâche à disposition', 403)
  }

  const updatedTask = await releaseTaskInDatabase(taskId)
  return formatTaskResponse(updatedTask)
}

export async function getTaskHistoryForDate(dateString: string): Promise<TaskResponse[]> {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const tasks = await findTasksDoneOnDate(date)
  return tasks.map(formatTaskResponse)
}

export async function getActiveDatesForMonth(month: number, year: number): Promise<string[]> {
  const tasks = await findDoneTaskDatesInMonth(month, year)

  const uniqueDateStrings = new Set(
    tasks
      .filter((task) => task.doneAt !== null)
      .map((task) => task.doneAt!.toISOString().split('T')[0]),
  )

  return Array.from(uniqueDateStrings).sort()
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await findTaskById(taskId)

  if (!task) {
    throw new AppError('Tâche introuvable', 404)
  }

  await deleteTaskFromDatabase(taskId)
}
