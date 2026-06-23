import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { useAuthContext } from '../../context/AuthContext'

export default function PageWrapper() {
  const { currentUser } = useAuthContext()

  return (
    <div className="min-h-dvh">
      {/* Sidebar fixe — affichée uniquement sur desktop (md+) */}
      <Sidebar />

      {/* Chip utilisateur — visible uniquement sur mobile, caché sur desktop où la sidebar prend le relais */}
      {currentUser && (
        <div
          className="md:hidden"
          style={{
            position: 'fixed',
            top: 12,
            right: 14,
            zIndex: 40,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--color-border-soft)',
            borderRadius: 20,
            padding: '4px 10px 4px 6px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.07)',
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
        </div>
      )}

      {/* Zone de contenu — pousse de 240px sur desktop pour laisser place à la sidebar */}
      <div className="flex flex-col min-h-dvh md:ml-[240px]">
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <Outlet />
        </main>

        {/* Bottom navigation — cachée sur desktop, visible sur mobile */}
        <div className="md:hidden">
          <BottomNav />
        </div>
      </div>
    </div>
  )
}
