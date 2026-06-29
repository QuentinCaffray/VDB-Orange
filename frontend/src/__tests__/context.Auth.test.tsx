import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { vi } from 'vitest'
import { AuthProvider, useAuthContext } from '../context/AuthContext'
import { AuthenticatedUser } from '../types/auth.types'

// ─── Mock de l'instance axios ─────────────────────────────────────────────────

vi.mock('../lib/axios', () => {
  const postMock = vi.fn()
  return {
    default: { post: postMock },
    setAccessToken: vi.fn(),
    clearAccessToken: vi.fn(),
    getAccessToken: vi.fn(() => null),
  }
})

import api, { setAccessToken, clearAccessToken } from '../lib/axios'

const mockedPost = api.post as ReturnType<typeof vi.fn>
const mockedSetAccessToken = setAccessToken as ReturnType<typeof vi.fn>
const mockedClearAccessToken = clearAccessToken as ReturnType<typeof vi.fn>

// ─── Données de test ──────────────────────────────────────────────────────────

const TEST_USER: AuthenticatedUser = {
  id: 'user-001',
  cuid: 'TST0001',
  name: 'Test Vendeur',
  role: 'vendeur',
  color: '#FF6B00',
  isFirstLogin: false,
}

// ─── Composant consommateur de test ──────────────────────────────────────────

function AuthTestConsumer() {
  const { currentUser, isLoadingAuth, handleLoginSuccess, handleLogout } = useAuthContext()

  if (isLoadingAuth) return <div>Loading…</div>

  return (
    <div>
      <span data-testid="user">{currentUser ? currentUser.name : 'null'}</span>
      <button
        onClick={() => handleLoginSuccess('fake-access-token', TEST_USER)}
        data-testid="btn-login"
      >
        Login
      </button>
      <button onClick={handleLogout} data-testid="btn-logout">
        Logout
      </button>
    </div>
  )
}

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
  // Par défaut le refresh échoue (pas de cookie)
  mockedPost.mockRejectedValue(new Error('No refresh token'))
})

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AuthContext', () => {
  it('currentUser est null et isLoadingAuth est false quand aucune session n\'est stockée', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null')
    })
  })

  it('restaure la session si localStorage contient un utilisateur et que le refresh réussit', async () => {
    localStorage.setItem('current_user', JSON.stringify(TEST_USER))
    mockedPost.mockResolvedValueOnce({ data: { accessToken: 'new-access-token' } })

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe(TEST_USER.name)
    })

    expect(mockedSetAccessToken).toHaveBeenCalledWith('new-access-token')
  })

  it('nettoie localStorage si le refresh échoue', async () => {
    localStorage.setItem('current_user', JSON.stringify(TEST_USER))
    mockedPost.mockRejectedValueOnce(new Error('Cookie expiré'))

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null')
    })

    expect(localStorage.getItem('current_user')).toBeNull()
  })

  it('handleLoginSuccess met à jour currentUser et stocke dans localStorage', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => screen.getByTestId('btn-login'))

    act(() => {
      fireEvent.click(screen.getByTestId('btn-login'))
    })

    expect(screen.getByTestId('user').textContent).toBe(TEST_USER.name)
    expect(mockedSetAccessToken).toHaveBeenCalledWith('fake-access-token')
    expect(localStorage.getItem('current_user')).toContain(TEST_USER.id)
  })

  it('handleLogout remet currentUser à null et efface le token', async () => {
    localStorage.setItem('current_user', JSON.stringify(TEST_USER))
    mockedPost.mockResolvedValueOnce({ data: { accessToken: 'token' } })

    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe(TEST_USER.name)
    })

    mockedPost.mockResolvedValueOnce({}) // logout POST

    act(() => {
      fireEvent.click(screen.getByTestId('btn-logout'))
    })

    expect(screen.getByTestId('user').textContent).toBe('null')
    expect(mockedClearAccessToken).toHaveBeenCalled()
    expect(localStorage.getItem('current_user')).toBeNull()
  })

  it('useAuthContext lance une erreur hors du AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    expect(() => render(<AuthTestConsumer />)).toThrow(
      'useAuthContext doit être utilisé dans un AuthProvider',
    )

    consoleError.mockRestore()
  })
})
