import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as gameApi from '../features/game/api'
import {
  useActiveGame,
  useCreateGame,
  usePauseGame,
  useSubmitMoveRequest,
} from '../features/game/hooks/useGame'
import { ActiveGame } from '../types/game.types'

// ─── Mock des appels API ──────────────────────────────────────────────────────

vi.mock('../features/game/api')

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

const ACTIVE_GAME: ActiveGame = {
  id: 'game-001',
  floorCount: 5,
  objective: 'Atteindre l\'objectif',
  reward: 'Pizza en équipe',
  status: 'active',
  winnerId: null,
  winnerName: null,
  pawns: [],
  pendingRequestCount: 0,
}

const PAUSED_GAME: ActiveGame = { ...ACTIVE_GAME, status: 'paused' }

// ─── Tests useActiveGame ──────────────────────────────────────────────────────

describe('useActiveGame', () => {
  it('retourne la partie active', async () => {
    vi.mocked(gameApi.fetchActiveGame).mockResolvedValue(ACTIVE_GAME)

    const { result } = renderHook(() => useActiveGame(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.id).toBe('game-001')
    expect(result.current.data?.status).toBe('active')
  })

  it('retourne null s\'il n\'y a pas de partie active', async () => {
    vi.mocked(gameApi.fetchActiveGame).mockResolvedValue(null)

    const { result } = renderHook(() => useActiveGame(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })
})

// ─── Tests useCreateGame ──────────────────────────────────────────────────────

describe('useCreateGame', () => {
  it('invalide le cache de la partie active après création', async () => {
    // Avant : pas de partie
    vi.mocked(gameApi.fetchActiveGame).mockResolvedValueOnce(null)
    vi.mocked(gameApi.createGame).mockResolvedValue(ACTIVE_GAME)
    // Après invalidation : la nouvelle partie apparaît
    vi.mocked(gameApi.fetchActiveGame).mockResolvedValueOnce(ACTIVE_GAME)

    const { result } = renderHook(
      () => ({ query: useActiveGame(), mutation: useCreateGame() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data).toBeNull()

    await act(async () => {
      result.current.mutation.mutate({ floorCount: 5, objective: 'Test', reward: 'Cadeau' })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.query.data?.id).toBe('game-001'))
  })
})

// ─── Tests usePauseGame ───────────────────────────────────────────────────────

describe('usePauseGame', () => {
  it('invalide le cache après mise en pause, le GET reflète le statut paused', async () => {
    vi.mocked(gameApi.fetchActiveGame).mockResolvedValueOnce(ACTIVE_GAME)
    vi.mocked(gameApi.pauseGame).mockResolvedValue(undefined)
    vi.mocked(gameApi.fetchActiveGame).mockResolvedValueOnce(PAUSED_GAME)

    const { result } = renderHook(
      () => ({ query: useActiveGame(), mutation: usePauseGame() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data?.status).toBe('active')

    await act(async () => {
      result.current.mutation.mutate('game-001')
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.query.data?.status).toBe('paused'))
  })
})

// ─── Tests useSubmitMoveRequest ───────────────────────────────────────────────

describe('useSubmitMoveRequest', () => {
  it('soumet une demande avec la raison fournie', async () => {
    vi.mocked(gameApi.submitMoveRequest).mockResolvedValue(undefined)

    const { result } = renderHook(() => useSubmitMoveRequest('game-001'), {
      wrapper: createWrapper(),
    })

    await act(async () => {
      result.current.mutate('J\'ai atteint mes objectifs')
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(vi.mocked(gameApi.submitMoveRequest)).toHaveBeenCalledWith('game-001', {
      reason: 'J\'ai atteint mes objectifs',
    })
  })
})
