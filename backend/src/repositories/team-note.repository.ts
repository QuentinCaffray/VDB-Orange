import { prisma } from '../lib/prisma'
import { UpsertTeamNoteInput } from '../types/team-note.types'

const CHALLENGES_ORDER_BY = { order: 'asc' as const }

export async function findAllVendorsWithTeamNotes() {
  const vendors = await prisma.user.findMany({
    where: { isHidden: false },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
      cuid: true,
      role: true,
      teamNote: {
        include: { challenges: { orderBy: CHALLENGES_ORDER_BY } },
      },
    },
  })

  return vendors.map((vendor) => ({
    userId: vendor.id,
    userName: vendor.name,
    userColor: vendor.color,
    userCuid: vendor.cuid,
    userRole: vendor.role as string,
    publicNote: vendor.teamNote?.publicNote ?? null,
    privateNote: vendor.teamNote?.privateNote ?? null,
    challenges: vendor.teamNote?.challenges ?? [],
  }))
}

export async function findTeamNoteByUserId(userId: string) {
  return prisma.teamNote.findUnique({
    where: { userId },
    include: { challenges: { orderBy: CHALLENGES_ORDER_BY } },
  })
}

export async function upsertTeamNote(userId: string, data: UpsertTeamNoteInput) {
  const { challenges = [], ...noteData } = data

  const note = await prisma.teamNote.upsert({
    where: { userId },
    create: { userId, ...noteData },
    update: noteData,
  })

  // Remplace tous les challenges existants
  await prisma.teamChallenge.deleteMany({ where: { noteId: note.id } })

  if (challenges.length > 0) {
    await prisma.teamChallenge.createMany({
      data: challenges.map((challenge, index) => ({
        noteId: note.id,
        label: challenge.label,
        current: challenge.current,
        target: challenge.target,
        order: index,
      })),
    })
  }
}

export async function updateChallengeCurrent(
  challengeId: string,
  current: string,
  userId: string,
) {
  // Vérifie que le challenge appartient bien à cet utilisateur
  const challenge = await prisma.teamChallenge.findFirst({
    where: { id: challengeId, teamNote: { userId } },
  })

  if (!challenge) {
    throw new Error('Challenge introuvable ou accès non autorisé')
  }

  return prisma.teamChallenge.update({
    where: { id: challengeId },
    data: { current },
  })
}
