import { prisma } from '../lib/prisma'

const USER_SELECT = { id: true, name: true, color: true }

// Convertit une chaîne YYYY-MM-DD en objet Date sans décalage horaire
function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export async function findDailySalesByDate(date: Date) {
  return prisma.dailySale.findMany({
    where: { date },
    include: { user: { select: USER_SELECT } },
    orderBy: [{ indicatorId: 'asc' }, { userId: 'asc' }],
  })
}

export async function upsertDailySale(
  userId: string,
  indicatorId: string,
  dateString: string,
  delta: number,
) {
  const date = parseDateString(dateString)

  const existingRecord = await prisma.dailySale.findUnique({
    where: { date_userId_indicatorId: { date, userId, indicatorId } },
  })

  const currentCount = existingRecord?.count ?? 0
  const newCount = Math.max(0, currentCount + delta)

  return prisma.dailySale.upsert({
    where: { date_userId_indicatorId: { date, userId, indicatorId } },
    create: { userId, indicatorId, date, count: newCount },
    update: { count: newCount },
    include: { user: { select: USER_SELECT } },
  })
}

export async function findMonthlySalesByUser(userId: string, month: number, year: number) {
  const startOfMonth = new Date(year, month - 1, 1)
  const startOfNextMonth = new Date(year, month, 1)

  return prisma.dailySale.groupBy({
    by: ['indicatorId'],
    where: {
      userId,
      date: { gte: startOfMonth, lt: startOfNextMonth },
    },
    _sum: { count: true },
  })
}

export async function findMonthlyTargetsByUser(userId: string, month: number, year: number) {
  return prisma.monthlyTarget.findMany({
    where: { userId, month, year },
  })
}

export async function findAllVendorIds(): Promise<string[]> {
  const vendors = await prisma.user.findMany({
    where: { role: 'vendeur' },
    select: { id: true },
  })
  return vendors.map((vendor) => vendor.id)
}

export async function upsertMonthlyTarget(
  userId: string,
  indicatorId: string,
  month: number,
  year: number,
  target: number,
) {
  return prisma.monthlyTarget.upsert({
    where: { month_year_userId_indicatorId: { month, year, userId, indicatorId } },
    create: { userId, indicatorId, month, year, target },
    update: { target },
  })
}
