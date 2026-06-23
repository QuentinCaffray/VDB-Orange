import {
  findAllActiveIndicators,
  findIndicatorById,
  createIndicator as createIndicatorInDatabase,
  updateIndicator as updateIndicatorInDatabase,
} from '../repositories/indicator.repository'
import { IndicatorResponse, UpdateIndicatorInput } from '../types/indicator.types'
import { AppError } from '../types/error.types'

function formatIndicatorResponse(indicator: {
  id: string
  name: string
  order: number
  isActive: boolean
}): IndicatorResponse {
  return {
    id: indicator.id,
    name: indicator.name,
    order: indicator.order,
    isActive: indicator.isActive,
  }
}

export async function getAllActiveIndicators(): Promise<IndicatorResponse[]> {
  const indicators = await findAllActiveIndicators()
  return indicators.map(formatIndicatorResponse)
}

export async function createIndicator(name: string, order: number): Promise<IndicatorResponse> {
  const newIndicator = await createIndicatorInDatabase(name, order)
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
