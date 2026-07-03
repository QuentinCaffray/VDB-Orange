import { prisma } from '../lib/prisma'

const USER_SELECT = { id: true, name: true, color: true }

// Convertit une chaîne YYYY-MM-DD en objet Date sans décalage horaire
function parseDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (isNaN(date.getTime())) {
    throw new Error(`Date invalide : "${dateString}"`)
  }
  return date
}

export async function findDailySalesByDate(date: Date) {
  return prisma.dailySale.findMany({
    where: { date, isCorrection: false, user: { isHidden: false } },
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
    where: { date_userId_indicatorId_isCorrection: { date, userId, indicatorId, isCorrection: false } },
  })

  const currentCount = existingRecord?.count ?? 0
  const newCount = Math.max(0, currentCount + delta)

  return prisma.dailySale.upsert({
    where: { date_userId_indicatorId_isCorrection: { date, userId, indicatorId, isCorrection: false } },
    create: { userId, indicatorId, date, count: newCount, isCorrection: false },
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
    where: { role: 'vendeur', isHidden: false },
    select: { id: true },
  })
  return vendors.map((vendor) => vendor.id)
}

export async function setDailySaleAbsoluteCount(
  userId: string,
  indicatorId: string,
  dateString: string,
  count: number,
) {
  const date = parseDateString(dateString)
  return prisma.dailySale.upsert({
    where: { date_userId_indicatorId_isCorrection: { date, userId, indicatorId, isCorrection: false } },
    create: { userId, indicatorId, date, count, isCorrection: false },
    update: { count },
    include: { user: { select: USER_SELECT } },
  })
}

export async function replaceMonthlyAbsoluteTotal(
  userId: string,
  indicatorId: string,
  month: number,
  year: number,
  total: number,
  preserveDailyHistory: boolean = false,
) {
  const startOfMonth = new Date(year, month - 1, 1)
  const startOfNextMonth = new Date(year, month, 1)

  return prisma.$transaction(async (tx) => {
    if (preserveDailyHistory) {
      // Mode correction journalier : supprime les éventuelles corrections existantes du mois,
      // recalcule l'ajustement par rapport aux vraies saisies, crée une nouvelle entrée de correction.
      await tx.dailySale.deleteMany({
        where: { userId, indicatorId, date: { gte: startOfMonth, lt: startOfNextMonth }, isCorrection: true },
      })

      const realEntriesSum = await tx.dailySale.aggregate({
        where: { userId, indicatorId, date: { gte: startOfMonth, lt: startOfNextMonth }, isCorrection: false },
        _sum: { count: true },
      })
      const naturalTotal = realEntriesSum._sum.count ?? 0
      const correctionAmount = total - naturalTotal

      return tx.dailySale.create({
        data: { userId, indicatorId, date: startOfMonth, count: correctionAmount, isCorrection: true },
        include: { user: { select: USER_SELECT } },
      })
    }

    // Mode remplacement complet (indicateurs mensuels) : supprime tout et crée une seule entrée de correction
    await tx.dailySale.deleteMany({
      where: { userId, indicatorId, date: { gte: startOfMonth, lt: startOfNextMonth } },
    })
    return tx.dailySale.create({
      data: { userId, indicatorId, date: startOfMonth, count: total, isCorrection: true },
      include: { user: { select: USER_SELECT } },
    })
  })
}

export async function findMonthlySalesForAllUsers(month: number, year: number) {
  const startOfMonth = new Date(year, month - 1, 1)
  const startOfNextMonth = new Date(year, month, 1)

  return prisma.dailySale.groupBy({
    by: ['indicatorId'],
    where: { date: { gte: startOfMonth, lt: startOfNextMonth } },
    _sum: { count: true },
  })
}

export async function findMonthlyTargetsForAllUsers(month: number, year: number) {
  return prisma.monthlyTarget.groupBy({
    by: ['indicatorId'],
    where: { month, year },
    _sum: { target: true },
  })
}

export async function findMonthlySalesPerUserAndIndicator(month: number, year: number) {
  const startOfMonth = new Date(year, month - 1, 1)
  const startOfNextMonth = new Date(year, month, 1)

  return prisma.dailySale.groupBy({
    by: ['userId', 'indicatorId'],
    where: { date: { gte: startOfMonth, lt: startOfNextMonth }, user: { isHidden: false } },
    _sum: { count: true },
  })
}

export async function findAllMonthlyTargetsForMonth(month: number, year: number) {
  return prisma.monthlyTarget.findMany({ where: { month, year } })
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

export async function findMonthlyWorkingDays(
  userId: string,
  month: number,
  year: number,
): Promise<number | null> {
  const record = await prisma.monthlyWorkingDays.findUnique({
    where: { month_year_userId: { month, year, userId } },
  })
  return record?.workingDays ?? null
}

export async function upsertMonthlyWorkingDays(
  userId: string,
  month: number,
  year: number,
  workingDays: number,
): Promise<void> {
  await prisma.monthlyWorkingDays.upsert({
    where: { month_year_userId: { month, year, userId } },
    update: { workingDays },
    create: { userId, month, year, workingDays },
  })
}
