import { NavLink } from 'react-router-dom'
import { useTasks } from '../../features/tasks/hooks/useTasks'
import { useActiveGame } from '../../features/game/hooks/useGame'
import { useAuthContext } from '../../context/AuthContext'

export default function BottomNav() {
  const { currentUser } = useAuthContext()
  const { data: allTasks = [] } = useTasks()
  const { data: activeGame } = useActiveGame()
  const todoCount = allTasks.filter((task) => task.status === 'todo').length
  const isAdmin = currentUser?.role === 'admin'
  const hasActiveGame = activeGame?.status === 'active' || activeGame?.status === 'paused'

  return (
    <nav
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white md:hidden"
      style={{
        borderTop: '1px solid var(--color-border-soft)',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex">
        <BottomNavTab to="/dashboard" label="Accueil" icon={HomeIcon} />
        <BottomNavTab to="/tasks" label="Tâches" icon={TasksIcon} badge={todoCount} />
        <BottomNavTab to="/objectives" label="Objectif" icon={ObjectivesIcon} />
        <BottomNavTab to="/team" label="Suivi" icon={TeamIcon} />
        {(isAdmin || hasActiveGame) && (
          <BottomNavTab to="/game" label="Jeu" icon={GameIcon} />
        )}
        <BottomNavTab to="/profile" label="Profil" icon={ProfileIcon} />
      </div>
    </nav>
  )
}

interface BottomNavTabProps {
  to: string
  label: string
  icon: (active: boolean) => React.ReactNode
  badge?: number
}

function BottomNavTab({ to, label, icon, badge }: BottomNavTabProps) {
  return (
    <NavLink
      to={to}
      className="flex-1 flex flex-col items-center gap-0.5 pt-2 pb-1.5 min-h-[56px] justify-center"
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            <div
              className="flex items-center justify-center rounded-full transition-all duration-200 ease-out"
              style={{
                width: 40,
                height: 28,
                background: isActive ? 'var(--color-brand-tint)' : 'transparent',
                transform: isActive ? 'scale(1)' : 'scale(0.85)',
              }}
            >
              {icon(isActive)}
            </div>
            {badge !== undefined && badge > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
                style={{ background: '#FF7900' }}
              >
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </div>
          <span
            className="text-xs font-semibold transition-all duration-200"
            style={{
              color: isActive ? '#FF7900' : '#B7AEA4',
              fontWeight: isActive ? 700 : 600,
            }}
          >
            {label}
          </span>
        </>
      )}
    </NavLink>
  )
}

function HomeIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#B7AEA4'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function TasksIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#B7AEA4'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  )
}

function ObjectivesIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#B7AEA4'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  )
}

function TeamIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#B7AEA4'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function ProfileIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#B7AEA4'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function GameIcon(active: boolean) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#B7AEA4'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  )
}
