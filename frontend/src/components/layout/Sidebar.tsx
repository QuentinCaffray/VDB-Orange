import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useDarkModeContext } from '../../context/DarkModeContext'
import { useTasks } from '../../features/tasks/hooks/useTasks'
import { TeamColorLegend } from '../ui/TeamColorLegend'

const SIDEBAR_WIDTH = 240

export default function Sidebar() {
  const { currentUser } = useAuthContext()
  const { isDark, toggleDarkMode } = useDarkModeContext()
  const { data: allTasks = [] } = useTasks()
  const isAdmin = currentUser?.role === 'admin'
  const todoCount = allTasks.filter((task) => task.status === 'todo').length

  return (
    // hidden sur mobile, affiché en flex colonne sur desktop
    <aside
      className="hidden md:flex"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: SIDEBAR_WIDTH,
        height: '100dvh',
        flexDirection: 'column',
        background: 'var(--color-card)',
        borderRight: '1px solid var(--color-border-soft)',
        zIndex: 50,
      }}
    >
      {/* Logo / branding */}
      <div
        style={{
          padding: '28px 20px 20px',
          borderBottom: '1px solid var(--color-border-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#FF7900',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>O</span>
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, lineHeight: 1.2 }}>
            The Crew
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
            Sallanches
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <SidebarNavItem to="/dashboard" label="Tableau de bord" icon={SidebarHomeIcon} />
        <SidebarNavItem to="/tasks" label="Tâches" icon={SidebarTasksIcon} badge={todoCount} />
        <SidebarNavItem to="/objectives" label="Objectif" icon={SidebarObjectivesIcon} />
        <SidebarNavItem to="/team" label="Suivi équipe" icon={SidebarTeamIcon} />
        <SidebarNavItem to="/profile" label="Mon profil" icon={SidebarProfileIcon} />
      </nav>

      {/* Légende couleurs équipe */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--color-border-soft)' }}>
        <TeamColorLegend isAdmin={isAdmin} compact={true} />
      </div>

      {/* Toggle dark mode */}
      <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border-soft)' }}>
        <button
          onClick={toggleDarkMode}
          aria-label="Basculer le mode sombre"
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 8px',
            borderRadius: 10,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            transition: 'background 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SidebarDarkModeIcon isDark={isDark} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              {isDark ? 'Mode sombre' : 'Mode clair'}
            </span>
          </div>
          <SidebarToggle isOn={isDark} />
        </button>
      </div>

      {/* Utilisateur connecté */}
      {currentUser && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border-soft)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              background: currentUser.color ?? '#FF7900',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>
              {currentUser.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentUser.name}
              </p>
              <span style={{
                fontSize: 10,
                fontWeight: 700,
                color: currentUser.role === 'admin' ? '#FF7900' : 'var(--color-text-tertiary)',
                background: currentUser.role === 'admin' ? 'var(--color-brand-tint)' : 'var(--color-surface)',
                padding: '1px 6px',
                borderRadius: 6,
                flexShrink: 0,
                textTransform: 'capitalize',
              }}>
                {currentUser.role}
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', margin: 0 }}>
              {currentUser.cuid}
            </p>
          </div>
        </div>
      )}
    </aside>
  )
}

// ── Composants de navigation ──────────────────────────────────────────────────

interface SidebarNavItemProps {
  to: string
  label: string
  icon: (active: boolean) => React.ReactNode
  badge?: number
}

function SidebarNavItem({ to, label, icon, badge }: SidebarNavItemProps) {
  return (
    <NavLink to={to} style={{ textDecoration: 'none' }}>
      {({ isActive }) => (
        <div
          className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
          style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 12 }}
        >
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)', transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
              {icon(isActive)}
            </div>
            {badge !== undefined && badge > 0 && (
              <span style={{
                position: 'absolute',
                top: -4,
                right: -6,
                minWidth: 16,
                height: 16,
                borderRadius: 8,
                background: '#FF7900',
                color: 'white',
                fontSize: 10,
                fontWeight: 900,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 3px',
              }}>
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <span style={{ fontSize: 14, fontWeight: isActive ? 700 : 500, color: isActive ? '#FF7900' : 'var(--color-text-secondary)', transition: 'color 0.15s ease, font-weight 0.15s ease' }}>
            {label}
          </span>
        </div>
      )}
    </NavLink>
  )
}

function SidebarHomeIcon(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function SidebarTasksIcon(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

function SidebarObjectivesIcon(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function SidebarTeamIcon(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function SidebarProfileIcon(active: boolean) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

// ── Composants visuels internes ───────────────────────────────────────────────

interface SidebarDarkModeIconProps {
  isDark: boolean
}

function SidebarDarkModeIcon({ isDark }: SidebarDarkModeIconProps) {
  if (isDark) {
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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

interface SidebarToggleProps {
  isOn: boolean
}

function SidebarToggle({ isOn }: SidebarToggleProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: 32,
        height: 18,
        borderRadius: 9,
        background: isOn ? '#FF7900' : 'var(--color-border)',
        transition: 'background 0.2s ease',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          transform: isOn ? 'translateX(16px)' : 'translateX(2px)',
          transition: 'transform 0.2s ease',
        }}
      />
    </div>
  )
}
