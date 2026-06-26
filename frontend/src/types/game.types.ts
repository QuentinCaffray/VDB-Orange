export interface GamePawn {
  id: string
  userId: string
  userName: string
  userColor: string
  currentFloor: number
}

export interface ActiveGame {
  id: string
  floorCount: number
  reward: string
  status: 'active' | 'paused' | 'finished'
  winnerId: string | null
  winnerName: string | null
  pawns: GamePawn[]
  pendingRequestCount: number
}

export interface MoveRequest {
  id: string
  userId: string
  userName: string
  userColor: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  adminNote: string | null
  createdAt: string
}

export interface CreateGamePayload {
  floorCount: number
  reward: string
}

export interface SubmitMoveRequestPayload {
  reason: string
}

export interface ResolveMoveRequestPayload {
  approved: boolean
  adminNote?: string
}
