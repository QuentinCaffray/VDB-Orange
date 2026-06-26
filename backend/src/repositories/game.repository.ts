import { prisma } from '../lib/prisma'

const USER_SELECT = { id: true, name: true, color: true }

export async function findActiveGame() {
  return prisma.game.findFirst({
    where: { status: { not: 'finished' } },
    include: {
      pawns: { include: { user: { select: USER_SELECT } }, orderBy: { currentFloor: 'desc' } },
      winner: { select: USER_SELECT },
      _count: { select: { moveRequests: { where: { status: 'pending' } } } },
    },
  })
}

export async function findGameById(gameId: string) {
  return prisma.game.findUnique({
    where: { id: gameId },
    include: {
      pawns: { include: { user: { select: USER_SELECT } } },
      winner: { select: USER_SELECT },
    },
  })
}

export async function createGame(floorCount: number, reward: string, userIds: string[]) {
  return prisma.game.create({
    data: {
      floorCount,
      reward,
      pawns: {
        create: userIds.map((userId) => ({ userId, currentFloor: 0 })),
      },
    },
    include: {
      pawns: { include: { user: { select: USER_SELECT } } },
    },
  })
}

export async function updateGameStatus(
  gameId: string,
  status: 'active' | 'paused' | 'finished',
  winnerId?: string,
) {
  return prisma.game.update({
    where: { id: gameId },
    data: { status, winnerId: winnerId ?? null },
  })
}

export async function resetGamePawns(gameId: string) {
  return prisma.gamePawn.updateMany({
    where: { gameId },
    data: { currentFloor: 0 },
  })
}

export async function advancePawn(gameId: string, userId: string) {
  return prisma.gamePawn.update({
    where: { gameId_userId: { gameId, userId } },
    data: { currentFloor: { increment: 1 } },
    include: { user: { select: USER_SELECT } },
  })
}

export async function findPawn(gameId: string, userId: string) {
  return prisma.gamePawn.findUnique({
    where: { gameId_userId: { gameId, userId } },
  })
}

export async function createMoveRequest(gameId: string, userId: string, reason: string) {
  return prisma.moveRequest.create({
    data: { gameId, userId, reason },
    include: { user: { select: USER_SELECT } },
  })
}

export async function findPendingMoveRequests(gameId: string) {
  return prisma.moveRequest.findMany({
    where: { gameId, status: 'pending' },
    include: { user: { select: USER_SELECT } },
    orderBy: { createdAt: 'asc' },
  })
}

export async function findMoveRequestById(requestId: string) {
  return prisma.moveRequest.findUnique({
    where: { id: requestId },
    include: { user: { select: USER_SELECT } },
  })
}

export async function resolveMoveRequest(
  requestId: string,
  status: 'approved' | 'rejected',
  adminNote?: string,
) {
  return prisma.moveRequest.update({
    where: { id: requestId },
    data: { status, adminNote: adminNote ?? null },
  })
}

export async function hasPendingRequestForUser(gameId: string, userId: string) {
  const existing = await prisma.moveRequest.findFirst({
    where: { gameId, userId, status: 'pending' },
  })
  return existing !== null
}
