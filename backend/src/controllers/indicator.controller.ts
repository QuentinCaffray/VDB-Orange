import { Request, Response, NextFunction } from 'express'
import { CreateIndicatorInput, UpdateIndicatorInput } from '../types/indicator.types'
import * as indicatorService from '../services/indicator.service'

export async function getAllIndicatorsHandler(
  _request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const indicators = await indicatorService.getAllActiveIndicators()
    response.json(indicators)
  } catch (error) {
    next(error)
  }
}

export async function createIndicatorHandler(
  request: Request<{}, {}, CreateIndicatorInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { name, order } = request.body
    const newIndicator = await indicatorService.createIndicator(name, order)
    response.status(201).json(newIndicator)
  } catch (error) {
    next(error)
  }
}

export async function updateIndicatorHandler(
  request: Request<{ id: string }, {}, UpdateIndicatorInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const indicatorId = request.params.id
    const updatedIndicator = await indicatorService.updateIndicator(indicatorId, request.body)
    response.json(updatedIndicator)
  } catch (error) {
    next(error)
  }
}
