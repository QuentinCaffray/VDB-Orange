import api from '../../lib/axios'
import {
  Indicator,
  IndicatorType,
  DailySaleEntry,
  MonthlyProgressEntry,
  SetMonthlyTargetPayload,
} from '../../types/sales.types'

export async function fetchIndicators(): Promise<Indicator[]> {
  const response = await api.get<Indicator[]>('/indicators')
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

export async function fetchDailySales(dateString: string): Promise<DailySaleEntry[]> {
  const response = await api.get<DailySaleEntry[]>('/sales/daily', { params: { date: dateString } })
  return response.data
}

export async function recordSaleDelta(
  indicatorId: string,
  dateString: string,
  delta: 1 | -1,
): Promise<DailySaleEntry> {
  const response = await api.patch<DailySaleEntry>('/sales/daily', { indicatorId, date: dateString, delta })
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
