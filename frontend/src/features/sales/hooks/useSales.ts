import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { Indicator, DailySaleEntry } from '../../../types/sales.types'
import { useAuthContext } from '../../../context/AuthContext'
import {
  fetchIndicators,
  fetchDailySales,
  recordSaleDelta,
  setDailySaleCount,
  setMonthlyAbsoluteTotal,
  fetchMonthlyProgress,
  fetchTeamMonthlyProgress,
  fetchTeamMonthlyBreakdown,
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
    queryFn: () => fetchIndicators(),
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

export function useDailySales(dateString: string) {
  return useQuery({
    queryKey: ['sales', 'daily', dateString],
    queryFn: ({ signal }) => fetchDailySales(dateString, signal),
    refetchOnWindowFocus: false,
  })
}

export function useRecordSaleDelta(dateString: string, targetUserId?: string) {
  const queryClient = useQueryClient()
  const { currentUser } = useAuthContext()
  const queryKey = ['sales', 'daily', dateString]

  return useMutation({
    mutationFn: ({ indicatorId, delta }: { indicatorId: string; delta: 1 | -1 }) =>
      recordSaleDelta(indicatorId, dateString, delta, targetUserId),

    onMutate: async ({ indicatorId, delta }) => {
      const effectiveUserId = targetUserId ?? currentUser?.id
      if (!effectiveUserId) return

      await queryClient.cancelQueries({ queryKey })
      const previousSales = queryClient.getQueryData<DailySaleEntry[]>(queryKey)

      queryClient.setQueryData<DailySaleEntry[]>(queryKey, (previous = []) => {
        const existingEntry = previous.find(
          (sale) => sale.indicatorId === indicatorId && sale.userId === effectiveUserId,
        )

        if (existingEntry) {
          const newCount = Math.max(0, existingEntry.count + delta)
          return previous.map((sale) =>
            sale.indicatorId === indicatorId && sale.userId === effectiveUserId
              ? { ...sale, count: newCount }
              : sale,
          )
        }

        if (delta === 1) {
          return [
            ...previous,
            {
              id: `optimistic-${indicatorId}-${effectiveUserId}`,
              date: dateString,
              userId: effectiveUserId,
              userName: currentUser?.name ?? '',
              userColor: currentUser?.color ?? '',
              indicatorId,
              count: 1,
            },
          ]
        }

        return previous
      })

      return { previousSales }
    },

    onError: (_error, _variables, context) => {
      if (context?.previousSales !== undefined) {
        queryClient.setQueryData(queryKey, context.previousSales)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey })
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
  })
}

export function useTeamMonthlyProgress(month: number, year: number) {
  return useQuery({
    queryKey: ['sales', 'monthly', 'team', month, year],
    queryFn: () => fetchTeamMonthlyProgress(month, year),
    staleTime: 0,
  })
}

export function useTeamMonthlyBreakdown(month: number, year: number, enabled = true) {
  return useQuery({
    queryKey: ['sales', 'monthly', 'team-breakdown', month, year],
    queryFn: () => fetchTeamMonthlyBreakdown(month, year),
    staleTime: 0,
    placeholderData: keepPreviousData,
    enabled,
  })
}

export function useSetMonthlyTarget(_month: number, _year: number, _userId: string) {
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
