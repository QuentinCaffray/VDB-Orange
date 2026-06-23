interface PasswordStrengthGaugeProps {
  password: string
}

interface StrengthRule {
  label: string
  isSatisfied: (password: string) => boolean
}

const STRENGTH_RULES: StrengthRule[] = [
  { label: '8 caractères minimum', isSatisfied: (pwd) => pwd.length >= 8 },
  { label: 'Une majuscule',         isSatisfied: (pwd) => /[A-Z]/.test(pwd) },
  { label: 'Un chiffre',            isSatisfied: (pwd) => /[0-9]/.test(pwd) },
  { label: 'Un caractère spécial',  isSatisfied: (pwd) => /[^A-Za-z0-9]/.test(pwd) },
]

const SEGMENT_COLORS_BY_STRENGTH: Record<number, string> = {
  0: 'var(--color-border)',
  1: 'var(--color-danger)',
  2: '#F2B14B',
  3: '#F2B14B',
  4: 'var(--color-success)',
}

export default function PasswordStrengthGauge({ password }: PasswordStrengthGaugeProps) {
  const satisfiedRulesCount = STRENGTH_RULES.filter((rule) => rule.isSatisfied(password)).length
  const activeColor = SEGMENT_COLORS_BY_STRENGTH[satisfiedRulesCount]

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1.5">
        {STRENGTH_RULES.map((rule, segmentIndex) => {
          const isSegmentActive = segmentIndex < satisfiedRulesCount
          return (
            <div
              key={rule.label}
              className="flex-1 h-1.5 rounded-full transition-all duration-300"
              style={{ background: isSegmentActive ? activeColor : 'var(--color-border)' }}
            />
          )
        })}
      </div>
      {satisfiedRulesCount > 0 && satisfiedRulesCount < 4 && (
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {STRENGTH_RULES.find((rule) => !rule.isSatisfied(password))?.label}
        </p>
      )}
      {satisfiedRulesCount === 4 && (
        <p className="text-xs font-semibold" style={{ color: 'var(--color-success)' }}>
          Mot de passe robuste
        </p>
      )}
    </div>
  )
}
