import {
  findDailySalesByDate,
  upsertDailySale,
  setDailySaleAbsoluteCount,
  replaceMonthlyAbsoluteTotal,
  findMonthlySalesByUser,
  findMonthlyTargetsByUser,
  upsertMonthlyTarget,
  findAllVendorIds,
  findMonthlySalesForAllUsers,
  findMonthlyTargetsForAllUsers,
} from '../repositories/sales.repository'
import { findAllActiveIndicators } from '../repositories/indicator.repository'
import { DailySaleEntry, MonthlyProgressEntry } from '../types/sales.types'

function formatDailySaleEntry(sale: {
  id: string
  date: Date
  userId: string
  indicatorId: string
  count: number
  user: { id: string; name: string; color: string }
}): DailySaleEntry {
  return {
    id: sale.id,
    date: sale.date.toISOString().split('T')[0],
    userId: sale.userId,
    userName: sale.user.name,
    userColor: sale.user.color,
    indicatorId: sale.indicatorId,
    count: sale.count,
  }
}

export async function getDailySalesForDate(dateString: string): Promise<DailySaleEntry[]> {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const sales = await findDailySalesByDate(date)
  return sales.map(formatDailySaleEntry)
}

export async function recordSaleDelta(
  userId: string,
  indicatorId: string,
  dateString: string,
  delta: number,
): Promise<DailySaleEntry> {
  const updatedSale = await upsertDailySale(userId, indicatorId, dateString, delta)
  return formatDailySaleEntry(updatedSale)
}

export async function setDailySaleCount(
  userId: string,
  indicatorId: string,
  dateString: string,
  count: number,
): Promise<DailySaleEntry> {
  const updatedSale = await setDailySaleAbsoluteCount(userId, indicatorId, dateString, count)
  return formatDailySaleEntry(updatedSale)
}

export async function setMonthlyAbsoluteTotal(
  userId: string,
  indicatorId: string,
  month: number,
  year: number,
  total: number,
  preserveDailyHistory: boolean = false,
): Promise<DailySaleEntry> {
  const updatedSale = await replaceMonthlyAbsoluteTotal(userId, indicatorId, month, year, total, preserveDailyHistory)
  return formatDailySaleEntry(updatedSale)
}

export async function getMonthlyProgress(
  userId: string,
  month: number,
  year: number,
): Promise<MonthlyProgressEntry[]> {
  const [activeIndicators, monthlySales, monthlyTargets] = await Promise.all([
    findAllActiveIndicators(),
    findMonthlySalesByUser(userId, month, year),
    findMonthlyTargetsByUser(userId, month, year),
  ])

  const salesByIndicatorId = new Map(
    monthlySales.map((sale) => [sale.indicatorId, sale._sum.count ?? 0]),
  )

  const targetByIndicatorId = new Map(
    monthlyTargets.map((target) => [target.indicatorId, target.target]),
  )

  return activeIndicators.map((indicator) => ({
    indicatorId: indicator.id,
    indicatorName: indicator.name,
    indicatorOrder: indicator.order,
    totalSales: salesByIndicatorId.get(indicator.id) ?? 0,
    target: targetByIndicatorId.get(indicator.id) ?? null,
  }))
}

export async function getTeamMonthlyProgress(
  month: number,
  year: number,
): Promise<MonthlyProgressEntry[]> {
  const [activeIndicators, monthlySales, monthlyTargets] = await Promise.all([
    findAllActiveIndicators(),
    findMonthlySalesForAllUsers(month, year),
    findMonthlyTargetsForAllUsers(month, year),
  ])

  const salesByIndicatorId = new Map(
    monthlySales.map((sale) => [sale.indicatorId, sale._sum.count ?? 0]),
  )
  const targetSumByIndicatorId = new Map(
    monthlyTargets.map((entry) => [entry.indicatorId, entry._sum.target ?? 0]),
  )

  return activeIndicators.map((indicator) => ({
    indicatorId: indicator.id,
    indicatorName: indicator.name,
    indicatorOrder: indicator.order,
    totalSales: salesByIndicatorId.get(indicator.id) ?? 0,
    target: targetSumByIndicatorId.get(indicator.id) ?? null,
  }))
}

export async function setTargetForAllVendors(
  indicatorId: string,
  month: number,
  year: number,
  target: number,
): Promise<void> {
  const vendorIds = await findAllVendorIds()
  await Promise.all(
    vendorIds.map((vendorId) => upsertMonthlyTarget(vendorId, indicatorId, month, year, target)),
  )
}

export async function setMonthlyTarget(
  userId: string,
  indicatorId: string,
  month: number,
  year: number,
  target: number,
): Promise<void> {
  await upsertMonthlyTarget(userId, indicatorId, month, year, target)
}
