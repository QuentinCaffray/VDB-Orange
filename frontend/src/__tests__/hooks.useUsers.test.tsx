import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as usersApi from '../features/users/api'
import {
  useAllUsers,
  useCreateVendor,
  useDeleteUser,
  useUpdateUserRole,
} from '../features/users/hooks/useUsers'
import { UserSummary } from '../features/users/api'

// ─── Mock des appels API ──────────────────────────────────────────────────────

vi.mock('../features/users/api')

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

const USER_ALICE: UserSummary = {
  id: 'user-001',
  cuid: 'ALC0001',
  name: 'Alice',
  role: 'vendeur',
  color: '#FF6B00',
  isFirstLogin: false,
  lastLoginAt: '2026-06-01T10:00:00Z',
}

const USER_BOB: UserSummary = {
  id: 'user-002',
  cuid: 'BOB0001',
  name: 'Bob',
  role: 'admin',
  color: '#4A90D9',
  isFirstLogin: false,
  lastLoginAt: null,
}

// ─── Tests useAllUsers ────────────────────────────────────────────────────────

describe('useAllUsers', () => {
  it('retourne la liste de tous les utilisateurs', async () => {
    vi.mocked(usersApi.fetchAllUsers).mockResolvedValue([USER_ALICE, USER_BOB])

    const { result } = renderHook(() => useAllUsers(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].name).toBe('Alice')
  })
})

// ─── Tests useCreateVendor ────────────────────────────────────────────────────

describe('useCreateVendor', () => {
  it('invalide le cache users après création d\'un vendeur', async () => {
    const newUser: UserSummary = {
      id: 'user-003', cuid: 'CAR0001', name: 'Carol',
      role: 'vendeur', color: '#27AE60', isFirstLogin: true, lastLoginAt: null,
    }
    vi.mocked(usersApi.fetchAllUsers)
      .mockResolvedValueOnce([USER_ALICE, USER_BOB])
      .mockResolvedValueOnce([USER_ALICE, USER_BOB, newUser])
    vi.mocked(usersApi.createVendor).mockResolvedValue(newUser)

    const { result } = renderHook(
      () => ({ query: useAllUsers(), mutation: useCreateVendor() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data).toHaveLength(2)

    await act(async () => {
      result.current.mutation.mutate({
        name: 'Carol', cuid: 'CAR0001', password: 'MotDePasse123!', color: '#27AE60',
      })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.query.data).toHaveLength(3))
  })
})

// ─── Tests useDeleteUser ──────────────────────────────────────────────────────

describe('useDeleteUser', () => {
  it('invalide le cache users après suppression', async () => {
    vi.mocked(usersApi.fetchAllUsers)
      .mockResolvedValueOnce([USER_ALICE, USER_BOB])
      .mockResolvedValueOnce([USER_BOB])
    vi.mocked(usersApi.deleteUser).mockResolvedValue(undefined)

    const { result } = renderHook(
      () => ({ query: useAllUsers(), mutation: useDeleteUser() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))
    expect(result.current.query.data).toHaveLength(2)

    await act(async () => {
      result.current.mutation.mutate('user-001')
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))
    await waitFor(() => expect(result.current.query.data).toHaveLength(1))
  })
})

// ─── Tests useUpdateUserRole ──────────────────────────────────────────────────

describe('useUpdateUserRole', () => {
  it('appelle l\'API avec le bon userId et rôle', async () => {
    vi.mocked(usersApi.updateUserRole).mockResolvedValue(undefined)
    vi.mocked(usersApi.fetchAllUsers).mockResolvedValue([USER_ALICE, USER_BOB])

    const { result } = renderHook(() => useUpdateUserRole(), { wrapper: createWrapper() })

    await act(async () => {
      result.current.mutate({ userId: 'user-001', role: 'admin' })
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(vi.mocked(usersApi.updateUserRole)).toHaveBeenCalledWith('user-001', 'admin')
  })
})
