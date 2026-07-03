import { Request, Response, NextFunction } from 'express'
import {
  RecordSaleDeltaInput,
  SetMonthlyTargetInput,
  SetTargetForAllVendorsInput,
  SetDailyCountInput,
  SetMonthlyAbsoluteTotalInput,
  SetMonthlyWorkingDaysInput,
} from '../types/sales.types'
import * as salesService from '../services/sales.service'
import { eventBus } from '../lib/event-bus'

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

export async function getDailySalesHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const rawDate = request.query.date as string | undefined
    // P3-03: rawDate === '' (chaîne vide depuis ?date=) n'est pas capturé par la garde `rawDate &&`
    if (rawDate !== undefined && !DATE_REGEX.test(rawDate)) {
      response.status(400).json({ error: 'Paramètre date invalide — format attendu : YYYY-MM-DD' })
      return
    }
    const date = rawDate ?? new Date().toISOString().split('T')[0]
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

    eventBus.publishEvent({ type: 'sale.updated', sale: updatedSale })

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

    eventBus.publishEvent({ type: 'sale.updated', sale: updatedSale })

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
    eventBus.publishEvent({ type: 'sale.monthly.corrected', userId: effectiveUserId, month, year })
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
    const requester = request.authenticatedUser!
    const requestedUserId = userId as string | undefined

    if (requestedUserId && requestedUserId !== requester.userId && requester.role !== 'admin') {
      response.status(403).json({ error: 'Accès refusé' })
      return
    }

    const targetUserId = requestedUserId ?? requester.userId
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

export async function getTeamMonthlyBreakdownHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const month = parseInt(request.query.month as string) || new Date().getMonth() + 1
    const year = parseInt(request.query.year as string) || new Date().getFullYear()
    const breakdown = await salesService.getTeamMonthlyBreakdown(month, year)
    response.json(breakdown)
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
    eventBus.publishEvent({ type: 'monthly.target.updated', userId, month, year })
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function getMonthlyWorkingDaysHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, month, year } = request.query as { userId: string; month: string; year: string }
    const workingDays = await salesService.getMonthlyWorkingDays(
      userId,
      Number(month),
      Number(year),
    )
    response.json({ workingDays })
  } catch (error) {
    next(error)
  }
}

export async function setMonthlyWorkingDaysHandler(
  request: Request<{}, {}, SetMonthlyWorkingDaysInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId, month, year, workingDays } = request.body
    await salesService.setMonthlyWorkingDays(userId, month, year, workingDays)
    response.status(204).end()
  } catch (error) {
    next(error)
  }
}
