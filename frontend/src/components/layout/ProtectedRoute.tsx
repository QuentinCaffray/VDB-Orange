import { Navigate, Outlet } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function ProtectedRoute() {
  const { currentUser, isLoadingAuth } = useAuthContext()

  // On attend que le localStorage soit lu avant de décider de la redirection
  if (isLoadingAuth) {
    return (
      <div
        className="min-h-dvh flex items-center justify-center"
        style={{ background: 'var(--color-app-bg)' }}
      >
        <div
          className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: '#FF7900', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  if (currentUser.isFirstLogin) {
    return <Navigate to="/activate" replace />
  }

  return <Outlet />
}
