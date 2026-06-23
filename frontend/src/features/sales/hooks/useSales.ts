import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchIndicators,
  fetchDailySales,
  recordSaleDelta,
  fetchMonthlyProgress,
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  })
}

export function useDeleteIndicator() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteIndicator(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['indicators'] }),
  })
}

export function useDailySales(dateString: string) {
  return useQuery({
    queryKey: ['sales', 'daily', dateString],
    queryFn: () => fetchDailySales(dateString),
  })
}

export function useRecordSaleDelta(dateString: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ indicatorId, delta }: { indicatorId: string; delta: 1 | -1 }) =>
      recordSaleDelta(indicatorId, dateString, delta),
    onSuccess: () => {
      // Invalide toutes les queries sales pour que le jour ET le mois se mettent à jour
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
