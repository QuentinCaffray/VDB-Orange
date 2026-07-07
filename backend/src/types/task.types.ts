import { z } from 'zod'
import { TaskStatus } from '@prisma/client'

// ─── Schémas de validation Zod ────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Titre trop long (100 caractères max)'),
  description: z.string().max(500, 'Description trop longue (500 caractères max)').optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)').optional(),
})

export type CreateTaskInput = z.infer<typeof createTaskSchema>

// ─── Types de réponse API ─────────────────────────────────────────────────────

export interface TaskAssignee {
  id: string
  name: string
  color: string
}

export interface TaskResponse {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee: TaskAssignee | null
  dueDate: string | null
  doneAt: string | null
  createdAt: string
  // Ordre configuré sur le template récurrent d'origine — null pour une tâche manuelle
  order: number | null
}

// Résultat de la synchronisation des instances du jour avec l'état courant des templates
// récurrents (voir syncTaskInstancesWithRecurringTemplates dans task.service.ts) — permet
// au controller de notifier les clients connectés (SSE) des changements en temps réel.
export interface RecurringTaskInstanceSyncResult {
  createdTasks: TaskResponse[]
  updatedTasks: TaskResponse[]
  deletedTaskIds: string[]
}
