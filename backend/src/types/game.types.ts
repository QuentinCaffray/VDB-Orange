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

export interface CreateGameInput {
  floorCount: number
  objective: string
  reward: string
}

export interface CreateMoveRequestInput {
  reason: string
}

export interface ResolveMoveRequestInput {
  approved: boolean
  adminNote?: string
}
