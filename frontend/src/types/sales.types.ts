export type IndicatorType = 'daily' | 'monthly'

export interface Indicator {
  id: string
  name: string
  type: IndicatorType
  order: number
  isActive: boolean
}

export interface DailySaleEntry {
  id: string
  date: string
  userId: string
  userName: string
  userColor: string
  indicatorId: string
  count: number
}

export interface MonthlyProgressEntry {
  indicatorId: string
  indicatorName: string
  indicatorOrder: number
  totalSales: number
  target: number | null
}

export interface VendorIndicatorProgress {
  userId: string
  userName: string
  userColor: string
  totalSales: number
  target: number | null
  rank: number
}

export interface IndicatorTeamBreakdown {
  indicatorId: string
  indicatorName: string
  indicatorOrder: number
  vendors: VendorIndicatorProgress[]
}

export interface SetMonthlyTargetPayload {
  userId: string
  indicatorId: string
  month: number
  year: number
  target: number
}

export interface MonthlyWorkingDaysResponse {
  workingDays: number | null
}

export interface SetMonthlyWorkingDaysPayload {
  userId: string
  month: number
  year: number
  workingDays: number
}
