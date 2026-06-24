import { Request, Response, NextFunction } from 'express'
import {
  RecordSaleDeltaInput,
  SetMonthlyTargetInput,
  SetTargetForAllVendorsInput,
  SetDailyCountInput,
  SetMonthlyAbsoluteTotalInput,
} from '../types/sales.types'
import * as salesService from '../services/sales.service'
import { getSocketIO } from '../lib/socket'

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
    const { indicatorId, date, delta, userId: targetUserId } = request.body
    const requester = request.authenticatedUser!

    if (targetUserId && requester.role !== 'admin') {
      response.status(403).json({ error: 'Accès refusé' })
      return
    }

    const effectiveUserId = targetUserId ?? requester.userId
    const updatedSale = await salesService.recordSaleDelta(effectiveUserId, indicatorId, date, delta)

    getSocketIO().emit('sales:daily:updated', updatedSale)

    response.json(updatedSale)
  } catch (error) {
    next(error)
  }
}

export async function setDailySaleCountHandler(
  request: Request<{}, {}, SetDailyCountInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { indicatorId, date, count, userId: targetUserId } = request.body
    const requester = request.authenticatedUser!

    if (targetUserId && requester.role !== 'admin') {
      response.status(403).json({ error: 'Accès refusé' })
      return
    }

    const effectiveUserId = targetUserId ?? requester.userId
    const updatedSale = await salesService.setDailySaleCount(effectiveUserId, indicatorId, date, count)

    getSocketIO().emit('sales:daily:updated', updatedSale)

    response.json(updatedSale)
  } catch (error) {
    next(error)
  }
}

export async function setMonthlyAbsoluteTotalHandler(
  request: Request<{}, {}, SetMonthlyAbsoluteTotalInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { indicatorId, month, year, total, preserveDailyHistory, userId: targetUserId } = request.body
    const requester = request.authenticatedUser!

    if (targetUserId && requester.role !== 'admin') {
      response.status(403).json({ error: 'Accès refusé' })
      return
    }

    const effectiveUserId = targetUserId ?? requester.userId
    const updatedSale = await salesService.setMonthlyAbsoluteTotal(
      effectiveUserId, indicatorId, month, year, total, preserveDailyHistory ?? false,
    )
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

export async function getTeamMonthlyProgressHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const month = parseInt(request.query.month as string) || new Date().getMonth() + 1
    const year = parseInt(request.query.year as string) || new Date().getFullYear()
    const progress = await salesService.getTeamMonthlyProgress(month, year)
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
