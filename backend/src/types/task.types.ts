import { z } from 'zod'
import { TaskStatus } from '@prisma/client'

// ─── Schémas de validation Zod ────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100, 'Titre trop long (100 caractères max)'),
  description: z.string().max(500, 'Description trop longue (500 caractères max)').optional(),
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
  doneAt: string | null
  createdAt: string
}
