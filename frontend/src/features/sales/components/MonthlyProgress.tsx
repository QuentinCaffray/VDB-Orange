import { MonthlyProgressEntry } from '../../../types/sales.types'

interface MonthlyProgressProps {
  progressEntries: MonthlyProgressEntry[]
  month: number
  year: number
  vendorName?: string
  isEditMode?: boolean
  editableTargets?: Record<string, number | null>
  onTargetChange?: (indicatorId: string, value: number | null) => void
}

export default function MonthlyProgress({
  progressEntries,
  month,
  year,
  vendorName,
  isEditMode = false,
  editableTargets = {},
  onTargetChange,
}: MonthlyProgressProps) {
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1))

  const heroTitle = vendorName ?? 'Ma progression'

  return (
    <div className="flex flex-col gap-4">
      {/* Hero mois */}
      <div
        className="rounded-2xl px-5 py-6 flex flex-col gap-1"
        style={{ background: 'linear-gradient(160deg, #1A1A1A, #3A3A3A)' }}
      >
        <p className="text-xs font-bold text-white/50 uppercase tracking-widest m-0">
          Ce mois-ci · {monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}
        </p>
        <p className="font-display text-4xl font-semibold text-white m-0">
          {heroTitle}
        </p>
        {isEditMode && (
          <p className="text-xs text-white/50 m-0 mt-1">
            Modifiez les cibles pour ce vendeur
          </p>
        )}
      </div>

      {/* Barres de progression */}
      <div className="flex flex-col gap-3">
        {progressEntries.map((entry) => {
          const displayTarget = isEditMode
            ? (editableTargets[entry.indicatorId] ?? entry.target)
            : entry.target

          const isValidated = displayTarget !== null && entry.totalSales >= displayTarget
          const progressRatio =
            displayTarget && displayTarget > 0
              ? Math.min(entry.totalSales / displayTarget, 1)
              : 0

          return (
            <div key={entry.indicatorId} className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-2">

                {/* Nom + badge */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-text-primary truncate">
                    {entry.indicatorName}
                  </span>
                  {!isEditMode && isValidated && (
                    <span className="text-[10px] font-bold text-success bg-success-tint px-2 py-0.5 rounded-full shrink-0">
                      ✓ Validé
                    </span>
                  )}
                </div>

                {/* Valeur actuelle / objectif */}
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-sm font-bold"
                    style={{ color: isValidated ? '#22A650' : '#57C77E' }}
                  >
                    {entry.totalSales}
                  </span>

                  {isEditMode ? (
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-text-tertiary font-semibold">/</span>
                      <input
                        type="number"
                        min={0}
                        value={
                          editableTargets[entry.indicatorId] !== undefined
                            ? (editableTargets[entry.indicatorId] ?? '')
                            : (entry.target ?? '')
                        }
                        onChange={(event) => {
                          const parsed = parseInt(event.target.value, 10)
                          onTargetChange?.(
                            entry.indicatorId,
                            isNaN(parsed) ? null : Math.max(0, parsed),
                          )
                        }}
                        placeholder="—"
                        className="w-14 text-sm font-bold text-center rounded-xl px-2 py-1 outline-none border-2 border-brand"
                        style={{ color: '#FF7900' }}
                      />
                    </div>
                  ) : (
                    displayTarget !== null && (
                      <span className="text-sm text-text-tertiary font-semibold">
                        / {displayTarget}
                      </span>
                    )
                  )}
                </div>
              </div>

              {/* Barre de progression */}
              {displayTarget !== null && displayTarget > 0 && (
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progressRatio * 100}%`,
                      background: isValidated ? '#22A650' : '#57C77E',
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!isEditMode && (
        <p className="text-xs text-center text-text-tertiary m-0">
          🔒 Objectifs fixés par la direction
        </p>
      )}
    </div>
  )
}
