import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ActiveGame, MoveRequest } from '../../../types/game.types'
import * as gameApi from '../api'

export const ACTIVE_GAME_QUERY_KEY = ['game', 'active']

export function useActiveGame() {
  return useQuery<ActiveGame | null>({
    queryKey: ACTIVE_GAME_QUERY_KEY,
    queryFn: gameApi.fetchActiveGame,
  })
}

export function usePendingMoveRequests(gameId: string | undefined) {
  return useQuery<MoveRequest[]>({
    queryKey: ['game', 'move-requests', gameId],
    queryFn: () => gameApi.fetchPendingMoveRequests(gameId!),
    enabled: gameId !== undefined,
  })
}

export function useCreateGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gameApi.createGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY }),
  })
}

export function usePauseGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gameApi.pauseGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY }),
  })
}

export function useResumeGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gameApi.resumeGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY }),
  })
}

export function useFinishGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gameApi.finishGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY }),
  })
}

export function useAdminAdvancePawn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gameApi.adminAdvancePawn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY }),
  })
}

export function useResetGame() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: gameApi.resetGame,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY }),
  })
}

export function useSubmitMoveRequest(gameId: string) {
  return useMutation({
    mutationFn: (reason: string) => gameApi.submitMoveRequest(gameId, { reason }),
  })
}

export function useResolveMoveRequest(gameId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ requestId, approved, adminNote }: { requestId: string; approved: boolean; adminNote?: string }) =>
      gameApi.resolveMoveRequest(requestId, { approved, adminNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['game', 'move-requests', gameId] })
    },
  })
}
