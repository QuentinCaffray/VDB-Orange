import api from '../../lib/axios'
import {
  Indicator,
  IndicatorType,
  DailySaleEntry,
  MonthlyProgressEntry,
  SetMonthlyTargetPayload,
} from '../../types/sales.types'

export async function fetchIndicators(includeInactive?: boolean): Promise<Indicator[]> {
  const params = includeInactive ? { includeInactive: 'true' } : undefined
  const response = await api.get<Indicator[]>('/indicators', { params })
  return response.data
}

export interface CreateIndicatorPayload {
  name: string
  type: IndicatorType
  order: number
}

export interface UpdateIndicatorPayload {
  name?: string
  type?: IndicatorType
  order?: number
  isActive?: boolean
}

export async function createIndicator(payload: CreateIndicatorPayload): Promise<Indicator> {
  const response = await api.post<Indicator>('/indicators', payload)
  return response.data
}

export async function updateIndicator(id: string, payload: UpdateIndicatorPayload): Promise<Indicator> {
  const response = await api.patch<Indicator>(`/indicators/${id}`, payload)
  return response.data
}

export async function deleteIndicator(id: string): Promise<void> {
  await api.delete(`/indicators/${id}`)
}

export async function fetchDailySales(dateString: string, signal?: AbortSignal): Promise<DailySaleEntry[]> {
  const response = await api.get<DailySaleEntry[]>('/sales/daily', { params: { date: dateString }, signal })
  return response.data
}

export async function recordSaleDelta(
  indicatorId: string,
  dateString: string,
  delta: 1 | -1,
  targetUserId?: string,
): Promise<DailySaleEntry> {
  const response = await api.patch<DailySaleEntry>('/sales/daily', { indicatorId, date: dateString, delta, userId: targetUserId })
  return response.data
}

export async function fetchMonthlyProgress(
  userId: string,
  month: number,
  year: number,
): Promise<MonthlyProgressEntry[]> {
  const response = await api.get<MonthlyProgressEntry[]>('/sales/monthly', {
    params: { userId, month, year },
  })
  return response.data
}

export async function setMonthlyTarget(payload: SetMonthlyTargetPayload): Promise<void> {
  await api.put('/sales/targets', payload)
}

export interface SetTargetForAllVendorsPayload {
  indicatorId: string
  month: number
  year: number
  target: number
}

export async function setTargetForAllVendors(payload: SetTargetForAllVendorsPayload): Promise<void> {
  await api.put('/sales/targets/all-vendors', payload)
}

export async function fetchTeamMonthlyProgress(
  month: number,
  year: number,
): Promise<MonthlyProgressEntry[]> {
  const response = await api.get<MonthlyProgressEntry[]>('/sales/monthly/team', {
    params: { month, year },
  })
  return response.data
}

export async function setDailySaleCount(
  indicatorId: string,
  dateString: string,
  count: number,
  targetUserId?: string,
): Promise<DailySaleEntry> {
  const response = await api.put<DailySaleEntry>('/sales/daily', { indicatorId, date: dateString, count, userId: targetUserId })
  return response.data
}

export async function setMonthlyAbsoluteTotal(
  indicatorId: string,
  month: number,
  year: number,
  total: number,
  preserveDailyHistory: boolean = false,
  targetUserId?: string,
): Promise<DailySaleEntry> {
  const response = await api.put<DailySaleEntry>('/sales/monthly-total', {
    indicatorId, month, year, total, preserveDailyHistory, userId: targetUserId,
  })
  return response.data
}
