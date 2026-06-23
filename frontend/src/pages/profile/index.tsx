import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'

export default function ProfilePage() {
  const { currentUser, handleLogout } = useAuthContext()
  const navigate = useNavigate()

  function handleLogoutClick(): void {
    handleLogout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-text-primary)' }}>
        Profil
      </h1>
      <p style={{ color: 'var(--color-text-secondary)' }}>
        Connecté en tant que <strong>{currentUser?.name}</strong> ({currentUser?.cuid})
      </p>
      <button
        onClick={handleLogoutClick}
        className="w-full py-4 rounded-2xl text-white font-bold"
        style={{ background: 'var(--color-danger)' }}
      >
        Se déconnecter
      </button>
    </div>
  )
}
