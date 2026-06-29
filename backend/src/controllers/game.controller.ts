import { Request, Response, NextFunction } from 'express'
import * as gameService from '../services/game.service'
import { CreateGameInput, CreateMoveRequestInput, ResolveMoveRequestInput } from '../types/game.types'

export async function getActiveGameHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const game = await gameService.getActiveGame()
    response.json(game)
  } catch (error) {
    next(error)
  }
}

export async function createGameHandler(
  request: Request<{}, {}, CreateGameInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { floorCount, objective, reward } = request.body
    const game = await gameService.createGame(floorCount, objective, reward)
    response.status(201).json(game)
  } catch (error) {
    next(error)
  }
}

export async function pauseGameHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await gameService.updateGameStatus(request.params.id, 'paused')
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function resumeGameHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await gameService.updateGameStatus(request.params.id, 'active')
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function resetGameHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await gameService.resetGame(request.params.id)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function adminAdvancePawnHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const gameId = request.params.id
    const adminUserId = request.authenticatedUser!.userId
    await gameService.adminAdvancePawn(gameId, adminUserId)
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function finishGameHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await gameService.updateGameStatus(request.params.id, 'finished')
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}

export async function submitMoveRequestHandler(
  request: Request<{ id: string }, {}, CreateMoveRequestInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const gameId = request.params.id
    const userId = request.authenticatedUser!.userId
    const { reason } = request.body

    await gameService.submitMoveRequest(gameId, userId, reason)
    response.status(201).send()
  } catch (error) {
    next(error)
  }
}

export async function getPendingMoveRequestsHandler(
  request: Request<{ id: string }>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const requests = await gameService.getPendingMoveRequests(request.params.id)
    response.json(requests)
  } catch (error) {
    next(error)
  }
}

export async function resolveMoveRequestHandler(
  request: Request<{ requestId: string }, {}, ResolveMoveRequestInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { requestId } = request.params
    const { approved, adminNote } = request.body

    await gameService.resolveMoveRequest(requestId, approved, adminNote)
    console.log(JSON.stringify({ event: 'admin.game.move_request_resolved', adminId: request.authenticatedUser!.userId, requestId, approved, timestamp: new Date().toISOString() }))
    response.status(204).send()
  } catch (error) {
    next(error)
  }
}
