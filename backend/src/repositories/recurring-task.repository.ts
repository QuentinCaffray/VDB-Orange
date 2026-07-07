import { prisma } from '../lib/prisma'

// Sélection commune aux réponses admin
const ADMIN_TASK_SELECT = {
  id: true,
  title: true,
  order: true,
  isActive: true,
  createdAt: true,
}

// Sélection minimale utilisée pour générer les instances quotidiennes de tâches.
// order est repris tel quel sur l'instance générée pour que le tri configuré par
// l'admin (page /admin/recurring-tasks) s'applique dans la liste des tâches des vendeurs.
const ACTIVE_RECURRING_TASK_FOR_GENERATION_SELECT = {
  id: true,
  title: true,
  order: true,
}

export async function findRecurringTaskById(recurringTaskId: string) {
  return prisma.recurringTask.findUnique({ where: { id: recurringTaskId } })
}

// Retourne les templates actifs, seulement les champs nécessaires à la génération
// quotidienne des instances Task (voir task.service.ts)
export async function findActiveRecurringTasksForGeneration() {
  return prisma.recurringTask.findMany({
    where: { isActive: true },
    select: ACTIVE_RECURRING_TASK_FOR_GENERATION_SELECT,
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
  // Les tâches déjà générées à partir de ce template survivent, juste détachées
  // (onDelete: SetNull sur Task.recurringTaskId dans le schéma)
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
