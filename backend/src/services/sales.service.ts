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
  findMonthlySalesPerUserAndIndicator,
  findAllMonthlyTargetsForMonth,
  findMonthlyWorkingDays,
  upsertMonthlyWorkingDays,
} from '../repositories/sales.repository'
import { AppError } from '../types/error.types'
import { findAllActiveIndicators } from '../repositories/indicator.repository'
import { findAllUsers } from '../repositories/user.repository'
import {
  DailySaleEntry,
  MonthlyProgressEntry,
  VendorIndicatorProgress,
  IndicatorTeamBreakdown,
} from '../types/sales.types'

// Formate la date en YYYY-MM-DD en heure locale — toISOString() donnerait la date UTC,
// ce qui décale d'un jour si le serveur est en UTC+2 (ex: minuit local = 22h UTC la veille).
function formatLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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
    date: formatLocalDateString(sale.date),
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

  if (isNaN(date.getTime())) {
    throw new AppError('Format de date invalide', 400)
  }

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

export async function getTeamMonthlyBreakdown(
  month: number,
  year: number,
): Promise<IndicatorTeamBreakdown[]> {
  const [activeIndicators, salesPerUserAndIndicator, allTargets, allUsers] = await Promise.all([
    findAllActiveIndicators(),
    findMonthlySalesPerUserAndIndicator(month, year),
    findAllMonthlyTargetsForMonth(month, year),
    findAllUsers(),
  ])

  return activeIndicators.map((indicator) => {
    const vendorEntries: Omit<VendorIndicatorProgress, 'rank'>[] = allUsers.map((user) => {
      const salesEntry = salesPerUserAndIndicator.find(
        (sale) => sale.userId === user.id && sale.indicatorId === indicator.id,
      )
      const targetEntry = allTargets.find(
        (target) => target.userId === user.id && target.indicatorId === indicator.id,
      )
      return {
        userId: user.id,
        userName: user.name,
        userColor: user.color ?? '#FF7900',
        totalSales: salesEntry?._sum.count ?? 0,
        target: targetEntry?.target ?? null,
      }
    })

    const sortedVendors = [...vendorEntries].sort((a, b) => b.totalSales - a.totalSales)
    const vendorsWithRank: VendorIndicatorProgress[] = sortedVendors.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }))

    return {
      indicatorId: indicator.id,
      indicatorName: indicator.name,
      indicatorOrder: indicator.order,
      vendors: vendorsWithRank,
    }
  })
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

export async function getMonthlyWorkingDays(
  userId: string,
  month: number,
  year: number,
): Promise<number | null> {
  return findMonthlyWorkingDays(userId, month, year)
}

export async function setMonthlyWorkingDays(
  userId: string,
  month: number,
  year: number,
  workingDays: number,
): Promise<void> {
  await upsertMonthlyWorkingDays(userId, month, year, workingDays)
}
