import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { useAuthContext } from '../../context/AuthContext'
import { useAppEventStream } from '../../hooks/useAppEventStream'

export default function PageWrapper() {
  const { currentUser } = useAuthContext()
  const isAuthenticated = currentUser !== null
  useAppEventStream(isAuthenticated)
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh">
      {/* Sidebar fixe — affichée uniquement sur desktop (md+) */}
      <Sidebar />

      {/* Chip utilisateur — visible uniquement sur mobile, caché sur desktop où la sidebar prend le relais */}
      {currentUser && (
        <button
          className="flex items-center md:hidden"
          onClick={() => navigate('/profile')}
          style={{
            position: 'fixed',
            top: 12,
            right: 14,
            zIndex: 40,
            gap: 6,
            background: 'var(--color-chip-bg)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 20,
            padding: '4px 10px 4px 6px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
            cursor: 'pointer',
          }}
        >
          <div style={{ width: 20, height: 20, borderRadius: '50%', background: currentUser.color ?? '#FF7900', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'white' }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            {currentUser.name}
          </span>
          <span style={{ fontSize: 10, fontWeight: 600, color: currentUser.role === 'admin' ? '#FF7900' : 'var(--color-text-tertiary)' }}>
            · {currentUser.role}
          </span>
        </button>
      )}

      {/* Zone de contenu — pousse de 240px sur desktop pour laisser place à la sidebar */}
      <div className="flex flex-col min-h-dvh md:ml-[240px]">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {/* key sur pathname déclenche l'animation à chaque changement de route */}
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* Bottom navigation — cachée sur desktop, visible sur mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
