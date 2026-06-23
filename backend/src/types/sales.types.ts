import { z } from 'zod'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const recordSaleDeltaSchema = z.object({
  indicatorId: z.string().min(1, 'Indicateur requis'),
  date: z.string().regex(DATE_REGEX, 'Format de date invalide (YYYY-MM-DD)'),
  // +1 pour pointer une vente, -1 pour corriger une erreur de saisie
  delta: z.union([z.literal(1), z.literal(-1)]),
})

export const setMonthlyTargetSchema = z.object({
  userId: z.string().min(1, 'Utilisateur requis'),
  indicatorId: z.string().min(1, 'Indicateur requis'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  target: z.number().int().min(0, 'L\'objectif doit être positif'),
})

export const setTargetForAllVendorsSchema = z.object({
  indicatorId: z.string().min(1, 'Indicateur requis'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  target: z.number().int().min(0, "L'objectif doit être positif"),
})

export type RecordSaleDeltaInput = z.infer<typeof recordSaleDeltaSchema>
export type SetMonthlyTargetInput = z.infer<typeof setMonthlyTargetSchema>
export type SetTargetForAllVendorsInput = z.infer<typeof setTargetForAllVendorsSchema>

// Une vente journalière d'un vendeur pour un indicateur
export interface DailySaleEntry {
  id: string
  date: string
  userId: string
  userName: string
  userColor: string
  indicatorId: string
  count: number
}

// Progression mensuelle d'un vendeur pour un indicateur
export interface MonthlyProgressEntry {
  indicatorId: string
  indicatorName: string
  indicatorOrder: number
  totalSales: number
  target: number | null
}
