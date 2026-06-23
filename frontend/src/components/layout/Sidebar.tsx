import { NavLink } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useAllUsers } from '../../features/users/hooks/useUsers'

const SIDEBAR_WIDTH = 240

const navItems = [
  {
    to: '/tasks',
    label: 'Tâches',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    to: '/objectives',
    label: 'Objectif',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  {
    to: '/team',
    label: 'Suivi équipe',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Mon profil',
    icon: (active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={active ? '#FF7900' : '#9A9088'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  const { currentUser } = useAuthContext()
  const { data: allUsers = [] } = useAllUsers()
  const vendors = allUsers.filter((user) => user.role === 'vendeur')

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
        background: 'white',
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
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: isActive ? '#FFF3E6' : 'transparent',
                  transition: 'background 0.15s ease',
                }}
              >
                {item.icon(isActive)}
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? '#FF7900' : 'var(--color-text-secondary)',
                  }}
                >
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Légende couleurs vendeurs */}
      {vendors.length > 0 && (
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--color-border-soft)',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px 0' }}>
            Équipe
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px 4px' }}>
            {vendors.map((vendor) => (
              <div key={vendor.id} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: vendor.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {vendor.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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
                background: currentUser.role === 'admin' ? '#FFF3E6' : 'var(--color-surface)',
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
