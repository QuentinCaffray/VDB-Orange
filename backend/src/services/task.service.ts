import {
  findAllTasks,
  findTaskById,
  createTask as createTaskInDatabase,
  assignTaskToUser,
  markTaskAsDone as markTaskAsDoneInDatabase,
  assignAndMarkTaskDone,
  createAndMarkTaskDone,
  releaseTask as releaseTaskInDatabase,
  findTasksDoneOnDate,
  findDoneTaskDatesInMonth,
  deleteTask as deleteTaskFromDatabase,
  createMissingTaskInstancesForActiveRecurringTasks,
  deleteUnfinishedRecurringTaskInstancesBefore,
  findTodayUnclaimedRecurringTaskInstances,
  updateTaskTitleAndOrder,
} from '../repositories/task.repository'
import { findActiveRecurringTasksForGeneration } from '../repositories/recurring-task.repository'
import { TaskResponse, RecurringTaskInstanceSyncResult } from '../types/task.types'
import { AppError } from '../types/error.types'
import { Role, TaskStatus } from '@prisma/client'

// Convertit un objet Prisma en TaskResponse (dates en string ISO)
function formatTaskResponse(task: {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee: { id: string; name: string; color: string } | null
  dueDate: Date | null
  doneAt: Date | null
  createdAt: Date
  order: number | null
}): TaskResponse {
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    assignee: task.assignee,
    dueDate: task.dueDate?.toISOString().split('T')[0] ?? null,
    doneAt: task.doneAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    order: task.order,
  }
}

// Retourne la date du jour au format YYYY-MM-DD en heure locale.
// On évite toISOString(), qui donne une date UTC et décalerait d'un jour
// en heure locale UTC+1/+2 une fois passé minuit.
function getLocalTodayDateString(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Aligne les instances Task du jour sur l'état courant des templates récurrents :
// - repart de zéro sur les instances non terminées des jours précédents (comme l'ancienne
//   checklist, qui réinitialisait chaque case à cocher le matin) ;
// - supprime l'instance du jour d'un template désactivé entre-temps (disparaît de la liste) ;
// - corrige le titre/ordre d'une instance déjà générée si le template a été modifié depuis
//   (renommage, réordonnancement) — pour que ce soit visible immédiatement, sans attendre
//   le prochain reset du lendemain ;
// - matérialise l'instance du jour d'un template actif qui n'en a pas encore (nouveau
//   template, ou réactivation).
// N'agit que sur les instances non réclamées (todo, sans assigné) : une tâche déjà prise ou
// terminée reste la responsabilité du vendeur qui s'en occupe, elle n'est jamais modifiée
// ou supprimée sous ses pieds par une action admin.
// Appelée à la fois par getAllTasksHandler (génération paresseuse) et par chaque mutation
// admin sur les tâches récurrentes (le controller publie ensuite les événements temps réel
// correspondants à partir du résultat renvoyé — voir publishTaskSyncEvents).
export async function syncTaskInstancesWithRecurringTemplates(): Promise<RecurringTaskInstanceSyncResult> {
  const todayDueDate = new Date(getLocalTodayDateString() + 'T12:00:00')
  await deleteUnfinishedRecurringTaskInstancesBefore(todayDueDate)

  const unclaimedInstances = await findTodayUnclaimedRecurringTaskInstances(todayDueDate)
  const deletedTaskIds: string[] = []
  const updatedTasks: TaskResponse[] = []

  for (const instance of unclaimedInstances) {
    if (!instance.recurringTask) continue

    if (!instance.recurringTask.isActive) {
      await deleteTaskFromDatabase(instance.id)
      deletedTaskIds.push(instance.id)
      continue
    }

    const hasTitleDrifted = instance.title !== instance.recurringTask.title
    const hasOrderDrifted = instance.order !== instance.recurringTask.order
    if (hasTitleDrifted || hasOrderDrifted) {
      const updatedInstance = await updateTaskTitleAndOrder(instance.id, {
        title: instance.recurringTask.title,
        order: instance.recurringTask.order,
      })
      updatedTasks.push(formatTaskResponse(updatedInstance))
    }
  }

  const activeRecurringTasks = await findActiveRecurringTasksForGeneration()
  const createdInstances = await createMissingTaskInstancesForActiveRecurringTasks(activeRecurringTasks, todayDueDate)
  const createdTasks = createdInstances.map((instance) => formatTaskResponse({ ...instance, assignee: null }))

  return { createdTasks, updatedTasks, deletedTaskIds }
}

export async function getAllTasks(): Promise<TaskResponse[]> {
  const tasks = await findAllTasks()
  return tasks.map(formatTaskResponse)
}

export async function createTask(
  title: string,
  description: string | undefined,
  createdById: string,
  dueDateString?: string,
): Promise<TaskResponse> {
  const dueDate = dueDateString ? new Date(dueDateString + 'T12:00:00') : undefined
  const newTask = await createTaskInDatabase(title, description, createdById, dueDate)
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

export async function adminCompleteTaskForUser(
  taskId: string,
  targetUserId: string,
  doneAtString: string,
): Promise<TaskResponse> {
  const task = await findTaskById(taskId)

  if (!task) {
    throw new AppError('Tâche introuvable', 404)
  }

  const isAlreadyDone = task.status === TaskStatus.done
  if (isAlreadyDone) {
    throw new AppError('Cette tâche est déjà terminée', 409)
  }

  const [year, month, day] = doneAtString.split('-').map(Number)
  const doneAt = new Date(year, month - 1, day, 12, 0, 0)

  const updatedTask = await assignAndMarkTaskDone(taskId, targetUserId, doneAt)
  return formatTaskResponse(updatedTask)
}

export async function adminCreateCompletedTask(
  title: string,
  description: string | undefined,
  createdById: string,
  targetUserId: string,
  doneAtString: string,
): Promise<TaskResponse> {
  const [year, month, day] = doneAtString.split('-').map(Number)
  const doneAt = new Date(year, month - 1, day, 12, 0, 0)
  const newTask = await createAndMarkTaskDone(title, description, createdById, targetUserId, doneAt)
  return formatTaskResponse(newTask)
}

export async function deleteTask(taskId: string): Promise<void> {
  const task = await findTaskById(taskId)

  if (!task) {
    throw new AppError('Tâche introuvable', 404)
  }

  await deleteTaskFromDatabase(taskId)
}
