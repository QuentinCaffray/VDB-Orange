import { z } from 'zod'

export const teamChallengeInputSchema = z.object({
  label: z.string().min(1, 'Le nom du challenge est requis'),
  current: z.string().default('0'),
  target: z.string().min(1, 'L\'objectif est requis'),
})

export const upsertTeamNoteSchema = z.object({
  publicNote: z.string().optional(),
  privateNote: z.string().optional(),
  challenges: z.array(teamChallengeInputSchema).optional(),
})

export const updateChallengeCurrentSchema = z.object({
  current: z.string().min(1, 'Valeur requise'),
})

export type UpsertTeamNoteInput = z.infer<typeof upsertTeamNoteSchema>
export type UpdateChallengeCurrentInput = z.infer<typeof updateChallengeCurrentSchema>

export interface TeamChallengeEntry {
  id: string
  label: string
  current: string
  target: string
  order: number
}

// Note complète avec données du vendeur — retournée à l'admin
export interface TeamNoteWithUser {
  userId: string
  userName: string
  userColor: string
  userCuid: string
  publicNote: string | null
  privateNote: string | null
  challenges: TeamChallengeEntry[]
}

// Note publique seulement — retournée au vendeur pour sa propre fiche
export interface OwnTeamNote {
  publicNote: string | null
  challenges: TeamChallengeEntry[]
}
