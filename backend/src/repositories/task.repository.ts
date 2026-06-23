import { prisma } from '../lib/prisma'
import { TaskStatus } from '@prisma/client'

// Champs de l'assignee inclus dans toutes les réponses tâches
const ASSIGNEE_SELECT = {
  id: true,
  name: true,
  color: true,
}

export async function findAllTasks() {
  return prisma.task.findMany({
    include: { assignee: { select: ASSIGNEE_SELECT } },
    orderBy: { createdAt: 'desc' },
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
) {
  return prisma.task.create({
    data: { title, description, createdById },
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

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } })
}
