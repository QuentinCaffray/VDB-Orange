import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchAllTeamNotes, fetchOwnTeamNote, updateOwnChallengeCurrent, saveTeamNote } from '../api'
import { UpsertTeamNotePayload } from '../../../types/team-note.types'

export function useAllTeamNotes() {
  return useQuery({
    queryKey: ['team-notes'],
    queryFn: fetchAllTeamNotes,
  })
}

export function useOwnTeamNote() {
  return useQuery({
    queryKey: ['team-notes', 'me'],
    queryFn: fetchOwnTeamNote,
  })
}

export function useUpdateOwnChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ challengeId, current }: { challengeId: string; current: string }) =>
      updateOwnChallengeCurrent(challengeId, current),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-notes', 'me'] })
    },
  })
}

export function useSaveTeamNote() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ userId, payload }: { userId: string; payload: UpsertTeamNotePayload }) =>
      saveTeamNote(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-notes'] })
    },
  })
}
