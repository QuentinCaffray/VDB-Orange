import { prisma } from '../lib/prisma'

// Champs utilisateur inclus dans chaque completion pour l'affichage
const COMPLETION_USER_SELECT = { id: true, name: true, color: true }

// Sélection commune aux réponses admin (sans les completions)
const ADMIN_TASK_SELECT = {
  id: true,
  title: true,
  order: true,
  isActive: true,
  createdAt: true,
}

// Convertit une chaîne YYYY-MM-DD en objet Date local.
// Même logique que parseDateString dans sales.repository.ts — on évite toISOString()
// qui donnerait une date UTC et décalerait d'un jour en heure locale UTC+1/+2.
function parseDateStringToLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const localDate = new Date(year, month - 1, day)
  if (isNaN(localDate.getTime())) {
    throw new Error(`Date invalide : "${dateString}"`)
  }
  return localDate
}

// ─── Requêtes utilisateur (checklist quotidienne) ─────────────────────────────

export async function findActiveRecurringTasksWithCompletionsForDate(dateString: string) {
  const date = parseDateStringToLocalDate(dateString)

  return prisma.recurringTask.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
    include: {
      completions: {
        where: { date },
        include: { user: { select: COMPLETION_USER_SELECT } },
      },
    },
  })
}

export async function findRecurringTaskById(recurringTaskId: string) {
  return prisma.recurringTask.findUnique({ where: { id: recurringTaskId } })
}

export async function findRecurringTaskCompletionByTaskAndDate(
  recurringTaskId: string,
  dateString: string,
) {
  const date = parseDateStringToLocalDate(dateString)
  return prisma.recurringTaskCompletion.findUnique({
    where: { recurringTaskId_date: { recurringTaskId, date } },
  })
}

export async function createRecurringTaskCompletion(
  recurringTaskId: string,
  userId: string,
  dateString: string,
) {
  const date = parseDateStringToLocalDate(dateString)
  return prisma.recurringTaskCompletion.create({
    data: { recurringTaskId, userId, date },
    include: { user: { select: COMPLETION_USER_SELECT } },
  })
}

export async function deleteRecurringTaskCompletion(
  recurringTaskId: string,
  dateString: string,
): Promise<void> {
  const date = parseDateStringToLocalDate(dateString)
  await prisma.recurringTaskCompletion.delete({
    where: { recurringTaskId_date: { recurringTaskId, date } },
  })
}

// ─── Requêtes admin (gestion des tâches récurrentes) ─────────────────────────

// Retourne toutes les tâches (actives et inactives), triées par ordre croissant
export async function findAllRecurringTasksForAdmin() {
  return prisma.recurringTask.findMany({
    orderBy: { order: 'asc' },
    select: ADMIN_TASK_SELECT,
  })
}

// Retourne la valeur maximale du champ order pour calculer le prochain ordre
export async function findMaxRecurringTaskOrder(): Promise<number> {
  const aggregation = await prisma.recurringTask.aggregate({ _max: { order: true } })
  return aggregation._max.order ?? 0
}

export async function createRecurringTask(title: string, nextOrder: number) {
  return prisma.recurringTask.create({
    data: { title, order: nextOrder },
    select: ADMIN_TASK_SELECT,
  })
}

export async function updateRecurringTaskById(
  recurringTaskId: string,
  data: { title?: string; isActive?: boolean },
) {
  return prisma.recurringTask.update({
    where: { id: recurringTaskId },
    data,
    select: ADMIN_TASK_SELECT,
  })
}

export async function deleteRecurringTaskById(recurringTaskId: string): Promise<void> {
  // Les completions associées sont supprimées en cascade (onDelete: Cascade dans le schéma)
  await prisma.recurringTask.delete({ where: { id: recurringTaskId } })
}

// Met à jour le champ order de chaque tâche selon sa position dans orderedTaskIds.
// Exécuté dans une transaction pour garantir la cohérence de l'ordre.
export async function updateRecurringTaskOrders(orderedTaskIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedTaskIds.map((taskId, positionIndex) =>
      prisma.recurringTask.update({
        where: { id: taskId },
        data: { order: positionIndex },
      }),
    ),
  )
}
