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

export async function deleteTask(taskId: string) {
  return prisma.task.delete({ where: { id: taskId } })
}
