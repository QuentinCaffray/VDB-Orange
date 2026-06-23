import { z } from 'zod'

export const createIndicatorSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50, 'Nom trop long'),
  order: z.number().int().min(0, 'L\'ordre doit être positif'),
})

export const updateIndicatorSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>
export type UpdateIndicatorInput = z.infer<typeof updateIndicatorSchema>

export interface IndicatorResponse {
  id: string
  name: string
  order: number
  isActive: boolean
}
