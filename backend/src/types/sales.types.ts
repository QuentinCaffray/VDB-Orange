import { z } from 'zod'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export const recordSaleDeltaSchema = z.object({
  indicatorId: z.string().min(1, 'Indicateur requis'),
  date: z.string().regex(DATE_REGEX, 'Format de date invalide (YYYY-MM-DD)'),
  // +1 pour pointer une vente, -1 pour corriger une erreur de saisie
  delta: z.union([z.literal(1), z.literal(-1)]),
  // Admin uniquement — agir sur un vendeur spécifique
  userId: z.string().optional(),
})

export const setMonthlyTargetSchema = z.object({
  userId: z.string().min(1, 'Utilisateur requis'),
  indicatorId: z.string().min(1, 'Indicateur requis'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  target: z.number().min(0, 'L\'objectif doit être positif'),
})

export const setTargetForAllVendorsSchema = z.object({
  indicatorId: z.string().min(1, 'Indicateur requis'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  target: z.number().min(0, "L'objectif doit être positif"),
})

export const setDailyCountSchema = z.object({
  indicatorId: z.string().min(1, 'Indicateur requis'),
  date: z.string().regex(DATE_REGEX, 'Format de date invalide (YYYY-MM-DD)'),
  count: z.number().min(0, 'Le nombre de ventes doit être positif ou nul'),
  // Admin uniquement — agir sur un vendeur spécifique
  userId: z.string().optional(),
})

export const setMonthlyAbsoluteTotalSchema = z.object({
  indicatorId: z.string().min(1, 'Indicateur requis'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2024),
  total: z.number().min(0, 'Le total doit être positif ou nul'),
  // Si true : seule l'entrée du 1er du mois (buffer de correction) est modifiée,
  // les saisies journalières des autres jours sont préservées.
  preserveDailyHistory: z.boolean().optional().default(false),
  // Admin uniquement — agir sur un vendeur spécifique
  userId: z.string().optional(),
})

export type RecordSaleDeltaInput = z.infer<typeof recordSaleDeltaSchema>
export type SetMonthlyTargetInput = z.infer<typeof setMonthlyTargetSchema>
export type SetTargetForAllVendorsInput = z.infer<typeof setTargetForAllVendorsSchema>
export type SetDailyCountInput = z.infer<typeof setDailyCountSchema>
export type SetMonthlyAbsoluteTotalInput = z.infer<typeof setMonthlyAbsoluteTotalSchema>

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
