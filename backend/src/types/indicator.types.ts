import { z } from 'zod'

const indicatorTypeEnum = z.enum(['daily', 'monthly'])

export type IndicatorType = 'daily' | 'monthly'

export const createIndicatorSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(50, 'Nom trop long'),
  type: indicatorTypeEnum.default('daily'),
  order: z.number().int().min(0, "L'ordre doit être positif"),
})

export const updateIndicatorSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: indicatorTypeEnum.optional(),
  order: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
})

export const reorderIndicatorsSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1, 'Au moins un indicateur requis'),
})

export type CreateIndicatorInput = z.infer<typeof createIndicatorSchema>
export type UpdateIndicatorInput = z.infer<typeof updateIndicatorSchema>
export type ReorderIndicatorsInput = z.infer<typeof reorderIndicatorsSchema>

export interface IndicatorResponse {
  id: string
  name: string
  type: IndicatorType
  order: number
  isActive: boolean
}
