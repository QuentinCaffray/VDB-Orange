export interface GamePawnWithUser {
  id: string
  userId: string
  userName: string
  userColor: string
  currentFloor: number
}

export interface ActiveGameResponse {
  id: string
  floorCount: number
  objective: string
  reward: string
  status: 'active' | 'paused' | 'finished'
  winnerId: string | null
  winnerName: string | null
  pawns: GamePawnWithUser[]
  pendingRequestCount: number
}

export interface MoveRequestWithUser {
  id: string
  userId: string
  userName: string
  userColor: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  createdAt: string
}

import { z } from 'zod'

export const createGameSchema = z.object({
  floorCount: z.number().int().min(2, 'Minimum 2 étages').max(50, 'Maximum 50 étages'),
  objective: z.string().min(1, 'Objectif requis').max(200),
  reward: z.string().min(1, 'Récompense requise').max(200),
})

export const createMoveRequestSchema = z.object({
  reason: z.string().min(1, 'Raison requise').max(500),
})

export const resolveMoveRequestSchema = z.object({
  approved: z.boolean(),
  adminNote: z.string().max(300).optional(),
})

export type CreateGameInput = z.infer<typeof createGameSchema>
export type CreateMoveRequestInput = z.infer<typeof createMoveRequestSchema>
export type ResolveMoveRequestInput = z.infer<typeof resolveMoveRequestSchema>
