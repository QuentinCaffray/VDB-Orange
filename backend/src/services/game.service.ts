import * as gameRepository from '../repositories/game.repository'
import { findAllUsers } from '../repositories/user.repository'
import { eventBus } from '../lib/event-bus'
import { ActiveGameResponse, GamePawnWithUser } from '../types/game.types'
import { AppError } from '../types/error.types'

function buildPawnWithUser(pawn: {
  userId: string
  currentFloor: number
  user: { name: string; color: string }
  id: string
}): GamePawnWithUser {
  return {
    id: pawn.id,
    userId: pawn.userId,
    userName: pawn.user.name,
    userColor: pawn.user.color,
    currentFloor: pawn.currentFloor,
  }
}

export async function getActiveGame(): Promise<ActiveGameResponse | null> {
  const game = await gameRepository.findActiveGame()
  if (!game) return null

  return {
    id: game.id,
    floorCount: game.floorCount,
    objective: game.objective,
    reward: game.reward,
    status: game.status as 'active' | 'paused' | 'finished',
    winnerId: game.winnerId,
    winnerName: game.winner?.name ?? null,
    pawns: game.pawns.map(buildPawnWithUser),
    pendingRequestCount: game._count.moveRequests,
  }
}

export async function createGame(floorCount: number, objective: string, reward: string): Promise<ActiveGameResponse> {
  const existingGame = await gameRepository.findActiveGame()
  const isExistingGameOngoing = existingGame && existingGame.status !== 'finished'
  if (isExistingGameOngoing) {
    throw new AppError('Une partie est déjà en cours', 409)
  }

  const allUsers = await findAllUsers()
  const userIds = allUsers.map((user) => user.id)

  const game = await gameRepository.createGame(floorCount, objective, reward, userIds)

  const response: ActiveGameResponse = {
    id: game.id,
    floorCount: game.floorCount,
    objective: game.objective,
    reward: game.reward,
    status: 'active',
    winnerId: null,
    winnerName: null,
    pawns: game.pawns.map(buildPawnWithUser),
    pendingRequestCount: 0,
  }

  eventBus.publishEvent({ type: 'game.started', payload: response })
  return response
}

export async function updateGameStatus(
  gameId: string,
  status: 'active' | 'paused' | 'finished',
): Promise<void> {
  const game = await gameRepository.findGameById(gameId)
  if (!game) throw new AppError('Partie introuvable', 404)

  await gameRepository.updateGameStatus(gameId, status)
  eventBus.publishEvent({ type: 'game.status.changed', payload: { gameId, status } })
}

export async function resetGame(gameId: string): Promise<void> {
  const game = await gameRepository.findGameById(gameId)
  if (!game) throw new AppError('Partie introuvable', 404)

  await gameRepository.resetGamePawns(gameId)
  await gameRepository.updateGameStatus(gameId, 'active')
  eventBus.publishEvent({ type: 'game.reset', payload: { gameId } })
}

export async function submitMoveRequest(
  gameId: string,
  userId: string,
  reason: string,
): Promise<void> {
  const game = await gameRepository.findGameById(gameId)
  if (!game) throw new AppError('Partie introuvable', 404)
  if (game.status !== 'active') {
    throw new AppError('La partie n\'est pas active', 400)
  }

  const hasPendingRequest = await gameRepository.hasPendingRequestForUser(gameId, userId)
  if (hasPendingRequest) {
    throw new AppError('Une demande d\'avancement est déjà en attente', 409)
  }

  const request = await gameRepository.createMoveRequest(gameId, userId, reason)
  eventBus.publishEvent({
    type: 'game.move_request.created',
    payload: { gameId, requestId: request.id },
  })
}

export async function getPendingMoveRequests(gameId: string): Promise<import('../types/game.types').MoveRequestWithUser[]> {
  const requests = await gameRepository.findPendingMoveRequests(gameId)
  return requests.map((request) => ({
    id: request.id,
    userId: request.userId,
    userName: request.user.name,
    userColor: request.user.color,
    reason: request.reason,
    status: request.status as 'pending' | 'approved' | 'rejected',
    adminNote: request.adminNote,
    createdAt: request.createdAt.toISOString(),
  }))
}

export async function adminAdvancePawn(gameId: string, adminUserId: string): Promise<void> {
  const game = await gameRepository.findGameById(gameId)
  if (!game) throw new AppError('Partie introuvable', 404)
  if (game.status !== 'active') {
    throw new AppError('La partie n\'est pas active', 400)
  }

  const updatedPawn = await gameRepository.advancePawn(gameId, adminUserId)
  const hasReachedTop = updatedPawn.currentFloor >= game.floorCount

  if (hasReachedTop) {
    await gameRepository.updateGameStatus(gameId, 'paused', adminUserId)
    eventBus.publishEvent({
      type: 'game.status.changed',
      payload: { gameId, status: 'paused' },
    })
    return
  }

  eventBus.publishEvent({
    type: 'game.pawn.moved',
    payload: {
      gameId,
      userId: adminUserId,
      userName: updatedPawn.user.name,
      userColor: updatedPawn.user.color,
      newFloor: updatedPawn.currentFloor,
    },
  })
}

export async function resolveMoveRequest(
  requestId: string,
  approved: boolean,
  adminNote?: string,
): Promise<void> {
  const request = await gameRepository.findMoveRequestById(requestId)
  if (!request) throw new AppError('Demande introuvable', 404)
  if (request.status !== 'pending') {
    throw new AppError('Cette demande a déjà été traitée', 409)
  }

  const status = approved ? 'approved' : 'rejected'
  await gameRepository.resolveMoveRequest(requestId, status, adminNote)

  if (!approved) return

  const updatedPawn = await gameRepository.advancePawn(request.gameId, request.userId)
  const game = await gameRepository.findGameById(request.gameId)
  if (!game) return

  const hasReachedTop = updatedPawn.currentFloor >= game.floorCount
  if (hasReachedTop) {
    await gameRepository.updateGameStatus(request.gameId, 'paused', request.userId)
    eventBus.publishEvent({
      type: 'game.status.changed',
      payload: { gameId: request.gameId, status: 'paused' },
    })
    return
  }

  eventBus.publishEvent({
    type: 'game.pawn.moved',
    payload: {
      gameId: request.gameId,
      userId: request.userId,
      userName: request.user.name,
      userColor: request.user.color,
      newFloor: updatedPawn.currentFloor,
    },
  })
}
