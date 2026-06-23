import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

// Accessible uniquement aux utilisateurs connectés dont c'est la première connexion
export default function ActivateRoute() {
  const { currentUser, isLoadingAuth } = useAuthContext()

  if (isLoadingAuth) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'var(--color-app-bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 animate-spin"
          style={{ borderColor: '#FF7900', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (!currentUser.isFirstLogin) {
    return <Navigate to="/tasks" replace />
  }

  return <Outlet />
}
