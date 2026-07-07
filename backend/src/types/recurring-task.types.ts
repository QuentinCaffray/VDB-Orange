import { z } from 'zod'

// ─── Schémas de validation Zod ────────────────────────────────────────────────

export const createRecurringTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Le titre est obligatoire')
    .max(200, 'Le titre ne doit pas dépasser 200 caractères'),
})

export type CreateRecurringTaskInput = z.infer<typeof createRecurringTaskSchema>

// Au moins un champ doit être fourni pour une mise à jour
export const updateRecurringTaskSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) => data.title !== undefined || data.isActive !== undefined,
    { message: 'Au moins un champ (title ou isActive) doit être fourni' },
  )

export type UpdateRecurringTaskInput = z.infer<typeof updateRecurringTaskSchema>

export const reorderRecurringTasksSchema = z.object({
  orderedIds: z
    .array(z.string().min(1))
    .min(1, 'La liste des identifiants ne peut pas être vide'),
})

export type ReorderRecurringTasksInput = z.infer<typeof reorderRecurringTasksSchema>

// ─── Types de réponse API ─────────────────────────────────────────────────────

// Réponse des endpoints admin — inclut isActive et createdAt
export interface RecurringTaskAdminResponse {
  id: string
  title: string
  order: number
  isActive: boolean
  createdAt: string  // ISO 8601
}
