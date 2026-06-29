import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as teamApi from '../features/team/api'
import {
  useAllTeamNotes,
  useOwnTeamNote,
  useUpdateOwnChallenge,
  useSaveTeamNote,
} from '../features/team/hooks/useTeamNotes'
import { OwnTeamNote, TeamNoteWithUser } from '../types/team-note.types'

// ─── Mock des appels API ──────────────────────────────────────────────────────

vi.mock('../features/team/api')

// ─── Helper : wrapper QueryClientProvider ────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ─── Données de test ──────────────────────────────────────────────────────────

const VENDOR_NOTE: TeamNoteWithUser = {
  userId: 'user-001',
  userName: 'Alice',
  userColor: '#FF6B00',
  userCuid: 'TST0001',
  userRole: 'vendeur',
  publicNote: 'Bonne semaine',
  privateNote: 'Attention aux retards',
  challenges: [
    { id: 'ch-001', label: 'Challenge A', current: '2', target: '5', order: 0 },
  ],
}

const OWN_NOTE: OwnTeamNote = {
  publicNote: 'Continue comme ça',
  challenges: [
    { id: 'ch-001', label: 'Challenge A', current: '2', target: '5', order: 0 },
  ],
}

// ─── Tests useAllTeamNotes ────────────────────────────────────────────────────

describe('useAllTeamNotes', () => {
  it('retourne toutes les notes de l\'équipe', async () => {
    vi.mocked(teamApi.fetchAllTeamNotes).mockResolvedValue([VENDOR_NOTE])

    const { result } = renderHook(() => useAllTeamNotes(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].userName).toBe('Alice')
  })
})

// ─── Tests useOwnTeamNote ─────────────────────────────────────────────────────

describe('useOwnTeamNote', () => {
  it('retourne la note publique et les challenges du vendeur connecté', async () => {
    vi.mocked(teamApi.fetchOwnTeamNote).mockResolvedValue(OWN_NOTE)

    const { result } = renderHook(() => useOwnTeamNote(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.publicNote).toBe('Continue comme ça')
    expect(result.current.data?.challenges).toHaveLength(1)
  })
})

// ─── Tests useUpdateOwnChallenge ──────────────────────────────────────────────

describe('useUpdateOwnChallenge', () => {
  it('invalide le cache après mise à jour du challenge', async () => {
    const updatedNote: OwnTeamNote = {
      ...OWN_NOTE,
      challenges: [{ ...OWN_NOTE.challenges[0], current: '5' }],
    }
    vi.mocked(teamApi.fetchOwnTeamNote).mockResolvedValueOnce(OWN_NOTE)
    vi.mocked(teamApi.updateOwnChallengeCurrent).mockResolvedValue(undefined)
    vi.mocked(teamApi.fetchOwnTeamNote).mockResolvedValueOnce(updatedNote)

    const { result } = renderHook(
      () => ({ query: useOwnTeamNote(), mutation: useUpdateOwnChallenge() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data?.challenges[0].current).toBe('2')

    await act(async () => {
      result.current.mutation.mutate({ challengeId: 'ch-001', current: '5' })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    expect(vi.mocked(teamApi.updateOwnChallengeCurrent)).toHaveBeenCalledWith('ch-001', '5')

    // Après invalidation, le cache est mis à jour
    await waitFor(() => {
      expect(result.current.query.data?.challenges[0].current).toBe('5')
    })
  })
})

// ─── Tests useSaveTeamNote ────────────────────────────────────────────────────

describe('useSaveTeamNote', () => {
  it('invalide le cache des team-notes après sauvegarde', async () => {
    const savedNote: TeamNoteWithUser = { ...VENDOR_NOTE, publicNote: 'Excellente semaine !' }
    vi.mocked(teamApi.fetchAllTeamNotes).mockResolvedValueOnce([VENDOR_NOTE])
    vi.mocked(teamApi.saveTeamNote).mockResolvedValue(undefined)
    vi.mocked(teamApi.fetchAllTeamNotes).mockResolvedValueOnce([savedNote])

    const { result } = renderHook(
      () => ({ query: useAllTeamNotes(), mutation: useSaveTeamNote() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data![0].publicNote).toBe('Bonne semaine')

    await act(async () => {
      result.current.mutation.mutate({
        userId: 'user-001',
        payload: { publicNote: 'Excellente semaine !' },
      })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => {
      expect(result.current.query.data![0].publicNote).toBe('Excellente semaine !')
    })
  })
})
