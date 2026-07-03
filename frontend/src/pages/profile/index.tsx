import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useDarkModeContext } from '../../context/DarkModeContext'

export default function ProfilePage() {
  const { currentUser, handleLogout } = useAuthContext()
  const navigate = useNavigate()
  const { isDark, toggleDarkMode } = useDarkModeContext()
  const isAdmin = currentUser?.role === 'admin'

  function handleLogoutClick(): void {
    handleLogout()
    navigate('/login', { replace: true })
  }

  function handleManageAccountsClick(): void {
    navigate('/admin/users')
  }

  function handleManageRecurringTasksClick(): void {
    navigate('/admin/recurring-tasks')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', color: 'var(--color-text-primary)' }}>
        Profil
      </h1>

      {/* Infos utilisateur */}
      <div className="bg-white rounded-2xl px-5 py-5 flex items-center gap-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover-lift">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: currentUser?.color ?? '#FF7900' }}
        >
          <span className="text-lg font-black text-white">
            {currentUser?.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-bold text-text-primary m-0">{currentUser?.name}</p>
          <p className="text-xs text-text-secondary m-0">{currentUser?.role} · {currentUser?.cuid}</p>
        </div>
      </div>

      {/* Compte */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest uppercase text-text-tertiary px-1 m-0">
          Compte
        </p>
        <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] overflow-hidden">
          {/* Changer le mot de passe */}
          <button
            onClick={() => navigate('/profile/change-password')}
            className="w-full flex items-center justify-between px-4 py-4 border-b border-border-soft"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'var(--color-brand-tint)' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF7900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-text-primary">Changer mon mot de passe</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Ma couleur */}
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full shrink-0"
                style={{ background: currentUser?.color ?? '#FF7900' }}
              />
              <span className="text-sm font-semibold text-text-primary">Ma couleur</span>
            </div>
            <span className="text-xs text-text-tertiary">
              {isAdmin ? 'Via Gestion des comptes' : 'Modifiable par admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Section admin */}
      {isAdmin && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-widest uppercase px-1 m-0" style={{ color: '#FF7900' }}>
            Administration · Direction
          </p>
          <button
            onClick={handleManageAccountsClick}
            className="w-full bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex items-center gap-3 text-left hover-lift"
            style={{ border: '1px solid var(--color-brand-tint)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-brand-tint)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF7900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-text-primary m-0">Gestion des comptes</p>
              <p className="text-xs text-text-secondary m-0 mt-0.5">Créer un vendeur · réinitialiser un mdp</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          <button
            onClick={handleManageRecurringTasksClick}
            className="w-full bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex items-center gap-3 text-left hover-lift"
            style={{ border: '1px solid var(--color-brand-tint)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--color-brand-tint)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF7900" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-text-primary m-0">Tâches récurrentes</p>
              <p className="text-xs text-text-secondary m-0 mt-0.5">Gérer la checklist quotidienne</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>
      )}

      {/* Apparence — uniquement sur mobile, le toggle est déjà dans la sidebar sur desktop */}
      <div className="md:hidden flex flex-col gap-2">
        <p className="text-xs font-bold tracking-widest uppercase text-text-tertiary px-1 m-0">
          Apparence
        </p>
        <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between"
            aria-label="Basculer le mode sombre"
          >
            <div className="flex items-center gap-3">
              <DarkModeIcon isDark={isDark} />
              <span className="text-sm font-semibold text-text-primary">
                {isDark ? 'Mode sombre' : 'Mode clair'}
              </span>
            </div>
            <ToggleSwitch isOn={isDark} />
          </button>
        </div>
      </div>

      {/* Déconnexion */}
      <button
        onClick={handleLogoutClick}
        className="w-full py-4 rounded-2xl font-bold text-sm"
        style={{ color: 'var(--color-danger)', background: 'var(--color-danger-tint)' }}
      >
        Se déconnecter
      </button>
    </div>
  )
}

// ── Composants visuels du toggle ─────────────────────────────────────────────

interface DarkModeIconProps {
  isDark: boolean
}

function DarkModeIcon({ isDark }: DarkModeIconProps) {
  if (isDark) {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  )
}

interface ToggleSwitchProps {
  isOn: boolean
}

function ToggleSwitch({ isOn }: ToggleSwitchProps) {
  return (
    <div
      className="relative w-11 h-6 rounded-full transition-colors duration-200"
      style={{ background: isOn ? '#FF7900' : 'var(--color-border)' }}
    >
      <div
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: isOn ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </div>
  )
}
