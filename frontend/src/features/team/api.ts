import api from '../../lib/axios'
import { TeamNoteWithUser, OwnTeamNote, UpsertTeamNotePayload } from '../../types/team-note.types'

export async function fetchAllTeamNotes(): Promise<TeamNoteWithUser[]> {
  const response = await api.get<TeamNoteWithUser[]>('/team-notes')
  return response.data
}

export async function fetchOwnTeamNote(): Promise<OwnTeamNote> {
  const response = await api.get<OwnTeamNote>('/team-notes/me')
  return response.data
}

export async function updateOwnChallengeCurrent(
  challengeId: string,
  current: string,
): Promise<void> {
  await api.patch(`/team-notes/me/challenges/${challengeId}`, { current })
}

export async function saveTeamNote(userId: string, payload: UpsertTeamNotePayload): Promise<void> {
  await api.put(`/team-notes/${userId}`, payload)
}
