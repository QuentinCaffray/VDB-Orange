import { useState, useEffect } from 'react'
import { useAllUsers, useUpdateUserColor } from '../../features/users/hooks/useUsers'
import { UserSummary } from '../../features/users/api'

interface TeamColorLegendProps {
  isAdmin?: boolean
  compact?: boolean
}

export function TeamColorLegend({ isAdmin = false, compact = false }: TeamColorLegendProps) {
  const { data: users = [] } = useAllUsers()
  const { mutate: saveColor } = useUpdateUserColor()

  if (users.length === 0) return null

  function handleColorSave(userId: string, color: string): void {
    saveColor({ userId, color })
  }

  const circleSize = compact ? 22 : 28
  const fontSize = compact ? 10 : 12

  return (
    <div>
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--color-text-tertiary)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          margin: '0 0 8px 0',
        }}
      >
        Équipe
      </p>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: compact ? '6px 4px' : '8px 6px',
        }}
      >
        {users.map((member) => (
          <VendorColorBadge
            key={member.id}
            member={member}
            isAdmin={isAdmin}
            onColorSave={(color) => handleColorSave(member.id, color)}
            circleSize={circleSize}
            fontSize={fontSize}
          />
        ))}
      </div>
    </div>
  )
}

// ── Badge couleur d'un vendeur ────────────────────────────────────────────────

interface VendorColorBadgeProps {
  member: UserSummary
  isAdmin: boolean
  onColorSave: (color: string) => void
  circleSize: number
  fontSize: number
}

function VendorColorBadge({ member, isAdmin, onColorSave, circleSize, fontSize }: VendorColorBadgeProps) {
  const [localColor, setLocalColor] = useState(member.color)

  // Synchronise si la couleur change depuis le serveur
  useEffect(() => {
    setLocalColor(member.color)
  }, [member.color])

  function handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setLocalColor(event.target.value)
  }

  function handleSave(): void {
    if (localColor !== member.color) {
      onColorSave(localColor)
    }
  }

  const firstName = member.name.split(' ')[0]
  const initial = member.name.charAt(0).toUpperCase()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Cercle coloré avec initiale */}
        <div
          style={{
            width: circleSize,
            height: circleSize,
            borderRadius: '50%',
            background: localColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: isAdmin ? 'pointer' : 'default',
            boxShadow: `0 1px 4px ${localColor}55`,
          }}
        >
          <span
            style={{
              fontSize: fontSize,
              fontWeight: 800,
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.35)',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            {initial}
          </span>
        </div>

        {/* Indicateur "éditable" pour admin */}
        {isAdmin && (
          <div
            style={{
              position: 'absolute',
              bottom: -1,
              right: -1,
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: 'var(--color-canvas)',
              border: '1px solid var(--color-border-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
        )}

        {/* Input color invisible — déclenché par le clic sur le cercle */}
        {isAdmin && (
          <input
            type="color"
            value={localColor}
            onChange={handleChange}
            onBlur={handleSave}
            aria-label={`Couleur de ${member.name}`}
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0,
              width: circleSize,
              height: circleSize,
              cursor: 'pointer',
              border: 'none',
              padding: 0,
            }}
          />
        )}
      </div>

      <span
        style={{
          fontSize: fontSize + 1,
          fontWeight: 600,
          color: 'var(--color-text-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {firstName}
      </span>
    </div>
  )
}
