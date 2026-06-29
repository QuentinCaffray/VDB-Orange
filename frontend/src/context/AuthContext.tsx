import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { AuthenticatedUser } from '../types/auth.types'
import api, { setAccessToken, clearAccessToken } from '../lib/axios'

interface AuthContextValue {
  currentUser: AuthenticatedUser | null
  isLoadingAuth: boolean
  handleLoginSuccess: (accessToken: string, user: AuthenticatedUser) => void
  handleLogout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY_CURRENT_USER = 'current_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null)
  const [isLoadingAuth, setIsLoadingAuth] = useState(true)

  // Au démarrage : tente de restaurer la session via le cookie httpOnly
  useEffect(() => {
    async function restoreSession(): Promise<void> {
      const storedUser = localStorage.getItem(STORAGE_KEY_CURRENT_USER)
      if (!storedUser) {
        setIsLoadingAuth(false)
        return
      }

      try {
        const parsedUser = JSON.parse(storedUser) as AuthenticatedUser
        // Le cookie httpOnly est envoyé automatiquement — pas besoin de token dans le body
        const { data } = await api.post<{ accessToken: string }>('/auth/refresh')
        setAccessToken(data.accessToken)
        setCurrentUser(parsedUser)
      } catch {
        // Cookie expiré ou invalide — on nettoie et on renvoie au login
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER)
      } finally {
        setIsLoadingAuth(false)
      }
    }

    restoreSession()
  }, [])

  function handleLoginSuccess(accessToken: string, user: AuthenticatedUser): void {
    setAccessToken(accessToken)
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user))
    setCurrentUser(user)
  }

  function handleLogout(): void {
    // Efface le cookie httpOnly côté serveur
    api.post('/auth/logout').catch(() => undefined)
    clearAccessToken()
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
