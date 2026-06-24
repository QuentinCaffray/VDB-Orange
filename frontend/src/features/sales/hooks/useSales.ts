import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Indicator, DailySaleEntry } from '../../../types/sales.types'
import {
  fetchIndicators,
  fetchDailySales,
  recordSaleDelta,
  setDailySaleCount,
  setMonthlyAbsoluteTotal,
  fetchMonthlyProgress,
  fetchTeamMonthlyProgress,
  setMonthlyTarget,
  createIndicator,
  updateIndicator,
  deleteIndicator,
  setTargetForAllVendors,
  CreateIndicatorPayload,
  UpdateIndicatorPayload,
  SetTargetForAllVendorsPayload,
} from '../api'
import { SetMonthlyTargetPayload } from '../../../types/sales.types'

export function useIndicators() {
  return useQuery({
    queryKey: ['indicators'],
    queryFn: fetchIndicators,
    // Évite un refetch immédiat après setQueryData optimiste qui écraserait la mise à jour
    // avant que le serveur ait confirmé le delete/update
    staleTime: 5_000,
  })
}


export function useCreateIndicator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateIndicatorPayload) => createIndicator(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  })
}

export function useUpdateIndicator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateIndicatorPayload }) =>
      updateIndicator(id, payload),
    // Préfixe ['indicators'] invalide toutes les queries indicateurs (['indicators'] et ['indicators', 'all'])
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  })
}

export function useDeleteIndicator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIndicator(id),
    onMutate: async (deletedId) => {
      // Annule tous les refetchs en cours pour éviter qu'ils écrasent l'update optimiste
      await queryClient.cancelQueries({ queryKey: ['indicators'] })
      queryClient.setQueryData<Indicator[]>(
        ['indicators'],
        (previous) => previous?.filter((indicator) => indicator.id !== deletedId) ?? [],
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  })
}

const POLLING_INTERVAL_MS = 20_000
const DAILY_SALES_FALLBACK_POLL_MS = 5 * 60_000 // 5 min — WebSocket gère le temps réel

export function useDailySales(dateString: string) {
  return useQuery({
    queryKey: ['sales', 'daily', dateString],
    queryFn: ({ signal }) => fetchDailySales(dateString, signal),
    // Fallback si la connexion WebSocket est perdue
    refetchInterval: DAILY_SALES_FALLBACK_POLL_MS,
    refetchOnWindowFocus: false,
  })
}

export function useRecordSaleDelta(dateString: string, targetUserId?: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ indicatorId, delta }: { indicatorId: string; delta: 1 | -1 }) =>
      recordSaleDelta(indicatorId, dateString, delta, targetUserId),

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', 'daily', dateString] })
    },
  })
}

export function useSetDailyCount(dateString: string, targetUserId?: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ indicatorId, count }: { indicatorId: string; count: number }) =>
      setDailySaleCount(indicatorId, dateString, count, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useSetMonthlyAbsoluteTotal(
  month: number,
  year: number,
  preserveDailyHistory: boolean = false,
  targetUserId?: string,
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ indicatorId, total }: { indicatorId: string; total: number }) =>
      setMonthlyAbsoluteTotal(indicatorId, month, year, total, preserveDailyHistory, targetUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
    },
  })
}

export function useMonthlyProgress(userId: string, month: number, year: number) {
  return useQuery({
    queryKey: ['sales', 'monthly', userId, month, year],
    queryFn: () => fetchMonthlyProgress(userId, month, year),
    enabled: userId.length > 0,
    staleTime: 0,
    refetchInterval: POLLING_INTERVAL_MS,
  })
}

export function useTeamMonthlyProgress(month: number, year: number) {
  return useQuery({
    queryKey: ['sales', 'monthly', 'team', month, year],
    queryFn: () => fetchTeamMonthlyProgress(month, year),
    staleTime: 0,
    refetchInterval: POLLING_INTERVAL_MS,
  })
}

export function useSetMonthlyTarget(month: number, year: number, userId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetMonthlyTargetPayload) => setMonthlyTarget(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  })
}

export function useSetTargetForAllVendors() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SetTargetForAllVendorsPayload) => setTargetForAllVendors(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sales'] }),
  })
}
