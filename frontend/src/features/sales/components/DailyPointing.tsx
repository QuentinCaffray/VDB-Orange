import { Indicator, DailySaleEntry } from '../../../types/sales.types'
import { useRecordSaleDelta } from '../hooks/useSales'

interface DailyPointingProps {
  indicators: Indicator[]
  dailySales: DailySaleEntry[]
  currentUserId: string
  currentUserColor: string
  dateString: string
  showTeamTotal?: boolean
  sectionTitle?: string
}

export default function DailyPointing({
  indicators,
  dailySales,
  currentUserId,
  currentUserColor,
  dateString,
  showTeamTotal = true,
  sectionTitle,
}: DailyPointingProps) {
  const { mutate: recordDelta, isPending } = useRecordSaleDelta(dateString)

  function getCurrentUserCount(indicatorId: string): number {
    const entry = dailySales.find(
      (sale) => sale.indicatorId === indicatorId && sale.userId === currentUserId,
    )
    return entry?.count ?? 0
  }

  function getTeamTotal(indicatorId: string): number {
    return dailySales
      .filter((sale) => sale.indicatorId === indicatorId)
      .reduce((total, sale) => total + sale.count, 0)
  }

  return (
    <div className="flex flex-col gap-3">
      {sectionTitle && (
        <p className="text-[11px] font-bold text-text-tertiary uppercase tracking-widest m-0">
          {sectionTitle}
        </p>
      )}
      {indicators.map((indicator) => {
        const myCount = getCurrentUserCount(indicator.id)
        const teamTotal = getTeamTotal(indicator.id)

        return (
          <div key={indicator.id} className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4">

              {/* Nom + total équipe (optionnel) */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary m-0">{indicator.name}</p>
                {showTeamTotal && (
                  <p className="text-xs text-text-tertiary m-0 mt-0.5">équipe : {teamTotal}</p>
                )}
              </div>

              {/* Stepper à la couleur du vendeur */}
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => recordDelta({ indicatorId: indicator.id, delta: -1 })}
                  disabled={isPending || myCount === 0}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-opacity disabled:opacity-30"
                  style={{ background: `${currentUserColor}20`, color: currentUserColor }}
                  aria-label={`Retirer une vente ${indicator.name}`}
                >
                  −
                </button>

                <span
                  className="font-display text-3xl font-semibold w-8 text-center leading-none"
                  style={{ color: currentUserColor }}
                >
                  {myCount}
                </span>

                <button
                  onClick={() => recordDelta({ indicatorId: indicator.id, delta: 1 })}
                  disabled={isPending}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold transition-opacity disabled:opacity-30"
                  style={{ background: currentUserColor, color: 'white' }}
                  aria-label={`Ajouter une vente ${indicator.name}`}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
