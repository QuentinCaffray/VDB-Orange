import { prisma } from '../lib/prisma'

export async function findAllActiveIndicators() {
  return prisma.indicator.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}

export async function findIndicatorById(indicatorId: string) {
  return prisma.indicator.findUnique({ where: { id: indicatorId } })
}

export async function createIndicator(name: string, order: number) {
  return prisma.indicator.create({ data: { name, order } })
}

export async function updateIndicator(
  indicatorId: string,
  data: { name?: string; order?: number; isActive?: boolean },
) {
  return prisma.indicator.update({ where: { id: indicatorId }, data })
}
