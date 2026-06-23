import { Request, Response, NextFunction } from 'express'
import { RecordSaleDeltaInput, SetMonthlyTargetInput, SetTargetForAllVendorsInput } from '../types/sales.types'
import * as salesService from '../services/sales.service'

export async function getDailySalesHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const date = (request.query.date as string) ?? new Date().toISOString().split('T')[0]
    const sales = await salesService.getDailySalesForDate(date)
    response.json(sales)
  } catch (error) {
    next(error)
  }
}

export async function recordSaleDeltaHandler(
  request: Request<{}, {}, RecordSaleDeltaInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { indicatorId, date, delta } = request.body
    const currentUserId = request.authenticatedUser!.userId

    const updatedSale = await salesService.recordSaleDelta(currentUserId, indicatorId, date, delta)
    response.json(updatedSale)
  } catch (error) {
    next(error)
  }
}

export async function getMonthlyProgressHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, month, year } = request.query

    const targetUserId = (userId as string) ?? request.authenticatedUser!.userId
    const targetMonth = parseInt(month as string) || new Date().getMonth() + 1
    const targetYear = parseInt(year as string) || new Date().getFullYear()

    const progress = await salesService.getMonthlyProgress(targetUserId, targetMonth, targetYear)
    response.json(progress)
  } catch (error) {
    next(error)
  }
}

export async function setTargetForAllVendorsHandler(
  request: Request<{}, {}, SetTargetForAllVendorsInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { indicatorId, month, year, target } = request.body
    await salesService.setTargetForAllVendors(indicatorId, month, year, target)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function setMonthlyTargetHandler(
  request: Request<{}, {}, SetMonthlyTargetInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, indicatorId, month, year, target } = request.body
    await salesService.setMonthlyTarget(userId, indicatorId, month, year, target)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
