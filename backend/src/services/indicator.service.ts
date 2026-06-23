import {
  findAllActiveIndicators,
  findIndicatorById,
  createIndicator as createIndicatorInDatabase,
  updateIndicator as updateIndicatorInDatabase,
  softDeleteIndicator,
} from '../repositories/indicator.repository'
import { IndicatorType, IndicatorResponse, UpdateIndicatorInput } from '../types/indicator.types'
import { AppError } from '../types/error.types'

function formatIndicatorResponse(indicator: {
  id: string
  name: string
  type: string
  order: number
  isActive: boolean
}): IndicatorResponse {
  return {
    id: indicator.id,
    name: indicator.name,
    type: indicator.type as IndicatorType,
    order: indicator.order,
    isActive: indicator.isActive,
  }
}

export async function getAllActiveIndicators(): Promise<IndicatorResponse[]> {
  const indicators = await findAllActiveIndicators()
  return indicators.map(formatIndicatorResponse)
}

export async function createIndicator(
  name: string,
  type: IndicatorType,
  order: number,
): Promise<IndicatorResponse> {
  const newIndicator = await createIndicatorInDatabase(name, type, order)
  return formatIndicatorResponse(newIndicator)
}

export async function updateIndicator(
  indicatorId: string,
  data: UpdateIndicatorInput,
): Promise<IndicatorResponse> {
  const indicator = await findIndicatorById(indicatorId)

  if (!indicator) {
    throw new AppError('Indicateur introuvable', 404)
  }

  const updatedIndicator = await updateIndicatorInDatabase(indicatorId, data)
  return formatIndicatorResponse(updatedIndicator)
}

export async function deleteIndicator(indicatorId: string): Promise<void> {
  const indicator = await findIndicatorById(indicatorId)

  if (!indicator) {
    throw new AppError('Indicateur introuvable', 404)
  }

  await softDeleteIndicator(indicatorId)
}
