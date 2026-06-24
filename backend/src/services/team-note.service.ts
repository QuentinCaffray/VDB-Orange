import * as teamNoteRepository from '../repositories/team-note.repository'
import { UpsertTeamNoteInput, TeamNoteWithUser, OwnTeamNote } from '../types/team-note.types'

export async function getAllTeamNotes(): Promise<TeamNoteWithUser[]> {
  return teamNoteRepository.findAllVendorsWithTeamNotes()
}

export async function getOwnTeamNote(userId: string): Promise<OwnTeamNote> {
  const teamNote = await teamNoteRepository.findTeamNoteByUserId(userId)

  return {
    publicNote: teamNote?.publicNote ?? null,
    challenges: teamNote?.challenges ?? [],
  }
}

export async function saveTeamNote(userId: string, data: UpsertTeamNoteInput): Promise<void> {
  await teamNoteRepository.upsertTeamNote(userId, data)
}

export async function updateOwnChallengeCurrent(
  userId: string,
  challengeId: string,
  current: string,
): Promise<void> {
  await teamNoteRepository.updateChallengeCurrent(challengeId, current, userId)
}
