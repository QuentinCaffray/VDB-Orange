import {
  findAllActiveIndicators,
  findAllIndicators,
  findIndicatorById,
  findActiveIndicatorByOrder,
  createIndicator as createIndicatorInDatabase,
  updateIndicator as updateIndicatorInDatabase,
  hardDeleteIndicator,
  reorderIndicators as reorderIndicatorsInDatabase,
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

export async function getAllIndicators(): Promise<IndicatorResponse[]> {
  const indicators = await findAllIndicators()
  return indicators.map(formatIndicatorResponse)
}

export async function createIndicator(
  name: string,
  type: IndicatorType,
  order: number,
): Promise<IndicatorResponse> {
  // P3-05: rejeter un order déjà utilisé par un indicateur actif
  const conflictingIndicator = await findActiveIndicatorByOrder(order)
  if (conflictingIndicator) {
    throw new AppError(`Un indicateur actif avec l'ordre ${order} existe déjà`, 409)
  }

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

  // P3-05: si l'order change, vérifier qu'il n'est pas déjà pris par un autre indicateur actif
  if (data.order !== undefined && data.order !== indicator.order) {
    const conflictingIndicator = await findActiveIndicatorByOrder(data.order)
    if (conflictingIndicator && conflictingIndicator.id !== indicatorId) {
      throw new AppError(`Un indicateur actif avec l'ordre ${data.order} existe déjà`, 409)
    }
  }

  const updatedIndicator = await updateIndicatorInDatabase(indicatorId, data)
  return formatIndicatorResponse(updatedIndicator)
}

export async function reorderIndicators(orderedIds: string[]): Promise<void> {
  await reorderIndicatorsInDatabase(orderedIds)
}

export async function deleteIndicator(indicatorId: string): Promise<void> {
  const indicator = await findIndicatorById(indicatorId)

  if (!indicator) {
    throw new AppError('Indicateur introuvable', 404)
  }

  await hardDeleteIndicator(indicatorId)
}
