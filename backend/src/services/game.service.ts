import * as gameRepository from '../repositories/game.repository'
import { findAllUsers } from '../repositories/user.repository'
import { eventBus } from '../lib/event-bus'
import { ActiveGameResponse, GamePawnWithUser } from '../types/game.types'

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
    reward: game.reward,
    status: game.status as 'active' | 'paused' | 'finished',
    winnerId: game.winnerId,
    winnerName: game.winner?.name ?? null,
    pawns: game.pawns.map(buildPawnWithUser),
    pendingRequestCount: game._count.moveRequests,
  }
}

export async function createGame(floorCount: number, reward: string): Promise<ActiveGameResponse> {
  const existingGame = await gameRepository.findActiveGame()
  if (existingGame) {
    throw Object.assign(new Error('Une partie est déjà en cours'), { statusCode: 409 })
  }

  const allUsers = await findAllUsers()
  const userIds = allUsers.map((user) => user.id)

  const game = await gameRepository.createGame(floorCount, reward, userIds)

  const response: ActiveGameResponse = {
    id: game.id,
    floorCount: game.floorCount,
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
  if (!game) throw Object.assign(new Error('Partie introuvable'), { statusCode: 404 })

  await gameRepository.updateGameStatus(gameId, status)
  eventBus.publishEvent({ type: 'game.status.changed', payload: { gameId, status } })
}

export async function resetGame(gameId: string): Promise<void> {
  const game = await gameRepository.findGameById(gameId)
  if (!game) throw Object.assign(new Error('Partie introuvable'), { statusCode: 404 })

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
  if (!game) throw Object.assign(new Error('Partie introuvable'), { statusCode: 404 })
  if (game.status !== 'active') {
    throw Object.assign(new Error('La partie n\'est pas active'), { statusCode: 400 })
  }

  const alreadyPending = await gameRepository.hasPendingRequestForUser(gameId, userId)
  if (alreadyPending) {
    throw Object.assign(new Error('Tu as déjà une demande en attente'), { statusCode: 409 })
  }

  const request = await gameRepository.createMoveRequest(gameId, userId, reason)
  eventBus.publishEvent({
    type: 'game.move_request.created',
    payload: { gameId, requestId: request.id },
  })
}

export async function getPendingMoveRequests(gameId: string) {
  return gameRepository.findPendingMoveRequests(gameId)
}

export async function resolveMoveRequest(
  requestId: string,
  approved: boolean,
  adminNote?: string,
): Promise<void> {
  const request = await gameRepository.findMoveRequestById(requestId)
  if (!request) throw Object.assign(new Error('Demande introuvable'), { statusCode: 404 })
  if (request.status !== 'pending') {
    throw Object.assign(new Error('Cette demande a déjà été traitée'), { statusCode: 409 })
  }

  const status = approved ? 'approved' : 'rejected'
  await gameRepository.resolveMoveRequest(requestId, status, adminNote)

  if (!approved) return

  const updatedPawn = await gameRepository.advancePawn(request.gameId, request.userId)
  const game = await gameRepository.findGameById(request.gameId)
  if (!game) return

  const hasWon = updatedPawn.currentFloor >= game.floorCount
  if (hasWon) {
    await gameRepository.updateGameStatus(request.gameId, 'finished', request.userId)
    eventBus.publishEvent({
      type: 'game.finished',
      payload: {
        gameId: game.id,
        winnerId: request.userId,
        winnerName: request.user.name,
        winnerColor: request.user.color,
      },
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
