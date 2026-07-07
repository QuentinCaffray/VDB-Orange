import { prisma } from '../lib/prisma'
import { TaskStatus } from '@prisma/client'

// Champs de l'assignee inclus dans toutes les réponses tâches
const ASSIGNEE_SELECT = {
  id: true,
  name: true,
  color: true,
}

// Les tâches générées depuis un template récurrent (order défini) apparaissent d'abord,
// triées selon l'ordre configuré par l'admin dans /admin/recurring-tasks ; les tâches
// manuelles (order null) suivent, triées par date de création la plus récente.
export async function findAllTasks() {
  return prisma.task.findMany({
    include: { assignee: { select: ASSIGNEE_SELECT } },
    orderBy: [{ order: { sort: 'asc', nulls: 'last' } }, { createdAt: 'desc' }],
  })
}

export async function findTaskById(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function createTask(
  title: string,
  description: string | undefined,
  createdById: string,
  dueDate?: Date,
) {
  return prisma.task.create({
    data: { title, description, createdById, dueDate },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function assignTaskToUser(taskId: string, assigneeId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: { assigneeId, status: TaskStatus.doing },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function markTaskAsDone(taskId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: { status: TaskStatus.done, doneAt: new Date() },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function releaseTask(taskId: string) {
  return prisma.task.update({
    where: { id: taskId },
    data: { assigneeId: null, status: TaskStatus.todo },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function findTasksDoneOnDate(date: Date) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0)
  const startOfNextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0)

  return prisma.task.findMany({
    where: { status: TaskStatus.done, doneAt: { gte: startOfDay, lt: startOfNextDay } },
    include: { assignee: { select: ASSIGNEE_SELECT } },
    orderBy: { doneAt: 'asc' },
  })
}

export async function findDoneTaskDatesInMonth(month: number, year: number) {
  const startOfMonth = new Date(year, month - 1, 1)
  const startOfNextMonth = new Date(year, month, 1)

  return prisma.task.findMany({
    where: { status: TaskStatus.done, doneAt: { gte: startOfMonth, lt: startOfNextMonth } },
    select: { doneAt: true },
  })
}

export async function assignAndMarkTaskDone(taskId: string, assigneeId: string, doneAt: Date) {
  return prisma.task.update({
    where: { id: taskId },
    data: { assigneeId, status: TaskStatus.done, doneAt },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function createAndMarkTaskDone(
  title: string,
  description: string | undefined,
  createdById: string,
  assigneeId: string,
  doneAt: Date,
) {
  return prisma.task.create({
    data: { title, description, createdById, assigneeId, status: TaskStatus.done, doneAt },
    include: { assignee: { select: ASSIGNEE_SELECT } },
  })
}

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } })
}

// Représente le sous-ensemble de champs d'un template récurrent nécessaire pour
// générer son instance du jour (voir ensureTodayRecurringTaskInstancesExist dans task.service.ts)
interface ActiveRecurringTaskForGeneration {
  id: string
  title: string
  order: number
}

// Crée une instance Task (statut todo) pour chaque template récurrent actif qui n'en a pas
// encore pour la date donnée. skipDuplicates + la contrainte unique (recurringTaskId, dueDate)
// gèrent nativement la concurrence : si plusieurs vendeurs ouvrent l'app en même temps le matin,
// aucun doublon n'est créé même en cas d'appels simultanés.
export async function createMissingTaskInstancesForActiveRecurringTasks(
  activeRecurringTasks: ActiveRecurringTaskForGeneration[],
  instanceDueDate: Date,
): Promise<void> {
  if (activeRecurringTasks.length === 0) return

  await prisma.task.createMany({
    data: activeRecurringTasks.map((recurringTask) => ({
      title: recurringTask.title,
      status: TaskStatus.todo,
      recurringTaskId: recurringTask.id,
      order: recurringTask.order,
      dueDate: instanceDueDate,
    })),
    skipDuplicates: true,
  })
}

// Supprime les instances de tâches récurrentes des jours précédents qui n'ont pas été terminées
// (todo ou doing), pour reproduire le comportement de l'ancienne checklist : chaque matin, une
// tâche non cochée la veille repart de zéro plutôt que de s'accumuler dans le Kanban. Les instances
// déjà terminées (status done) sont préservées pour l'historique, tout comme les tâches manuelles
// (recurringTaskId null), qui ne sont jamais concernées par ce nettoyage.
export async function deleteUnfinishedRecurringTaskInstancesBefore(cutoffDueDate: Date): Promise<void> {
  await prisma.task.deleteMany({
    where: {
      recurringTaskId: { not: null },
      status: { not: TaskStatus.done },
      dueDate: { lt: cutoffDueDate },
    },
  })
}
