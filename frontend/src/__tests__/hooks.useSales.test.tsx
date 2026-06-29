import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as salesApi from '../features/sales/api'
import {
  useIndicators,
  useDeleteIndicator,
  useDailySales,
  useRecordSaleDelta,
} from '../features/sales/hooks/useSales'
import { DailySaleEntry, Indicator } from '../types/sales.types'

// ─── Mock des modules ─────────────────────────────────────────────────────────

vi.mock('../features/sales/api')

// useRecordSaleDelta dépend de useAuthContext pour l'userId courant
vi.mock('../context/AuthContext', () => ({
  useAuthContext: vi.fn(() => ({
    currentUser: { id: 'user-001', name: 'Alice', color: '#FF6B00', role: 'vendeur', isFirstLogin: false },
  })),
}))

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

const INDICATOR_A: Indicator = { id: 'ind-001', name: 'HD', type: 'daily', order: 1, isActive: true }
const INDICATOR_B: Indicator = { id: 'ind-002', name: 'ABO', type: 'daily', order: 2, isActive: true }

const SALE_ENTRY: DailySaleEntry = {
  id: 'sale-001',
  date: '2026-06-01',
  userId: 'user-001',
  userName: 'Alice',
  userColor: '#FF6B00',
  indicatorId: 'ind-001',
  count: 3,
}

// ─── Tests useIndicators ──────────────────────────────────────────────────────

describe('useIndicators', () => {
  it('retourne les indicateurs depuis l\'API', async () => {
    vi.mocked(salesApi.fetchIndicators).mockResolvedValue([INDICATOR_A, INDICATOR_B])

    const { result } = renderHook(() => useIndicators(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].name).toBe('HD')
  })
})

// ─── Tests useDeleteIndicator ─────────────────────────────────────────────────

describe('useDeleteIndicator', () => {
  it('retire l\'indicateur du cache de manière optimiste (avant confirmation serveur)', async () => {
    vi.mocked(salesApi.fetchIndicators).mockResolvedValue([INDICATOR_A, INDICATOR_B])
    // Résolution lente pour que l'optimistic update soit visible
    vi.mocked(salesApi.deleteIndicator).mockReturnValue(
      new Promise((resolve) => setTimeout(resolve, 200)),
    )

    const { result } = renderHook(
      () => ({ query: useIndicators(), mutation: useDeleteIndicator() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data).toHaveLength(2)

    act(() => {
      result.current.mutation.mutate('ind-001')
    })

    // L'indicateur est retiré de manière optimiste (avant que le serveur réponde)
    await waitFor(() => {
      expect(result.current.query.data?.find((i) => i.id === 'ind-001')).toBeUndefined()
    })
    expect(result.current.query.data?.find((i) => i.id === 'ind-002')).toBeDefined()
  })
})

// ─── Tests useDailySales ──────────────────────────────────────────────────────

describe('useDailySales', () => {
  it('retourne les ventes du jour passé en paramètre', async () => {
    vi.mocked(salesApi.fetchDailySales).mockResolvedValue([SALE_ENTRY])

    const { result } = renderHook(() => useDailySales('2026-06-01'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data![0].count).toBe(3)
  })
})

// ─── Tests useRecordSaleDelta (optimistic update) ────────────────────────────

describe('useRecordSaleDelta', () => {
  it('met à jour le compteur après confirmation serveur (+1)', async () => {
    const confirmedEntry: DailySaleEntry = { ...SALE_ENTRY, count: 4 }
    // Premier appel : état initial ; second appel : après invalidation du cache post-mutation
    vi.mocked(salesApi.fetchDailySales)
      .mockResolvedValueOnce([SALE_ENTRY])
      .mockResolvedValueOnce([confirmedEntry])
    vi.mocked(salesApi.recordSaleDelta).mockResolvedValue(confirmedEntry)

    const { result } = renderHook(
      () => ({
        query: useDailySales('2026-06-01'),
        mutation: useRecordSaleDelta('2026-06-01'),
      }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data![0].count).toBe(3)

    await act(async () => {
      result.current.mutation.mutate({ indicatorId: 'ind-001', delta: 1 })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    // Après confirmation, le cache est invalidé et refetché → count = 4
    await waitFor(() => {
      const count = result.current.query.data?.find(
        (s) => s.indicatorId === 'ind-001' && s.userId === 'user-001',
      )?.count
      expect(count).toBe(4)
    })
  })

  it('ne descend pas en dessous de 0 lors d\'un décrément optimiste', async () => {
    const zeroEntry: DailySaleEntry = { ...SALE_ENTRY, count: 0 }
    vi.mocked(salesApi.fetchDailySales).mockResolvedValue([zeroEntry])
    vi.mocked(salesApi.recordSaleDelta).mockReturnValue(new Promise(() => undefined))

    const { result } = renderHook(
      () => ({
        query: useDailySales('2026-06-01'),
        mutation: useRecordSaleDelta('2026-06-01'),
      }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(async () => {
      result.current.mutation.mutate({ indicatorId: 'ind-001', delta: -1 })
    })

    const count = result.current.query.data?.find(
      (s) => s.indicatorId === 'ind-001' && s.userId === 'user-001',
    )?.count
    // Math.max(0, 0 + (-1)) = 0
    expect(count).toBe(0)
  })

  it('restaure les données précédentes en cas d\'erreur API', async () => {
    vi.mocked(salesApi.fetchDailySales).mockResolvedValue([SALE_ENTRY])
    vi.mocked(salesApi.recordSaleDelta).mockRejectedValue(new Error('Erreur réseau'))

    const { result } = renderHook(
      () => ({
        query: useDailySales('2026-06-01'),
        mutation: useRecordSaleDelta('2026-06-01'),
      }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    const originalCount = result.current.query.data![0].count

    await act(async () => {
      result.current.mutation.mutate({ indicatorId: 'ind-001', delta: 1 })
    })

    await waitFor(() => expect(result.current.mutation.isError).toBe(true))

    // Après erreur, le cache doit être restauré à la valeur d'avant
    const countAfterError = result.current.query.data?.find(
      (s) => s.indicatorId === 'ind-001' && s.userId === 'user-001',
    )?.count
    expect(countAfterError).toBe(originalCount)
  })
})
