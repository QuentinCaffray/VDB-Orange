import api from '../../lib/axios'
import {
  ActiveGame,
  MoveRequest,
  CreateGamePayload,
  SubmitMoveRequestPayload,
  ResolveMoveRequestPayload,
} from '../../types/game.types'

export async function fetchActiveGame(): Promise<ActiveGame | null> {
  const response = await api.get<ActiveGame | null>('/game')
  return response.data
}

export async function createGame(payload: CreateGamePayload): Promise<ActiveGame> {
  const response = await api.post<ActiveGame>('/game', payload)
  return response.data
}

export async function pauseGame(gameId: string): Promise<void> {
  await api.patch(`/game/${gameId}/pause`)
}

export async function resumeGame(gameId: string): Promise<void> {
  await api.patch(`/game/${gameId}/resume`)
}

export async function resetGame(gameId: string): Promise<void> {
  await api.patch(`/game/${gameId}/reset`)
}

export async function submitMoveRequest(
  gameId: string,
  payload: SubmitMoveRequestPayload,
): Promise<void> {
  await api.post(`/game/${gameId}/move-request`, payload)
}

export async function fetchPendingMoveRequests(gameId: string): Promise<MoveRequest[]> {
  const response = await api.get<MoveRequest[]>(`/game/${gameId}/move-requests`)
  return response.data
}

export async function resolveMoveRequest(
  requestId: string,
  payload: ResolveMoveRequestPayload,
): Promise<void> {
  await api.patch(`/game/move-requests/${requestId}/resolve`, payload)
}
