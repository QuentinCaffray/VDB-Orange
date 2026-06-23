import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthenticatedUser, AuthTokens } from '../types/auth.types'

interface AuthContextValue {
  currentUser: AuthenticatedUser | null
  isLoadingAuth: boolean
  handleLoginSuccess: (tokens: AuthTokens, user: AuthenticatedUser) => void
  handleLogout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY_ACCESS_TOKEN = 'access_token'
const STORAGE_KEY_REFRESH_TOKEN = 'refresh_token'
const STORAGE_KEY_CURRENT_USER = 'current_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // Restaure la session depuis le localStorage au démarrage
  useEffect(() => {
    const storedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
    if (storedUser) {
      try {
        setCurrentUser(JSON.parse(storedUser) as AuthenticatedUser)
      } catch {
        // Données corrompues — on repart d'une session vide
        localStorage.clear()
      }
    }
    setIsLoadingAuth(false)
  }, [])

  function handleLoginSuccess(tokens: AuthTokens, user: AuthenticatedUser): void {
    localStorage.setItem(STORAGE_KEY_ACCESS_TOKEN, tokens.accessToken)
    localStorage.setItem(STORAGE_KEY_REFRESH_TOKEN, tokens.refreshToken)
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
    setCurrentUser(user)
  }

  function handleLogout(): void {
    localStorage.removeItem(STORAGE_KEY_ACCESS_TOKEN)
    localStorage.removeItem(STORAGE_KEY_REFRESH_TOKEN)
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
    setCurrentUser(null)
  }

  return (
    <AuthContext.Provider value={{ currentUser, isLoadingAuth, handleLoginSuccess, handleLogout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuthContext doit être utilisé dans un AuthProvider')
  return context
}
