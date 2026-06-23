import { prisma } from '../lib/prisma'
import { IndicatorType } from '../types/indicator.types'

export async function findAllActiveIndicators() {
  return prisma.indicator.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  })
}

export async function findIndicatorById(indicatorId: string) {
  return prisma.indicator.findUnique({ where: { id: indicatorId } })
}

export async function createIndicator(name: string, type: IndicatorType, order: number) {
  return prisma.indicator.create({ data: { name, type, order } })
}

export async function updateIndicator(
  indicatorId: string,
  data: { name?: string; type?: IndicatorType; order?: number; isActive?: boolean },
) {
  return prisma.indicator.update({ where: { id: indicatorId }, data })
}

export async function softDeleteIndicator(indicatorId: string) {
  return prisma.indicator.update({
    where: { id: indicatorId },
    data: { isActive: false },
  })
}
