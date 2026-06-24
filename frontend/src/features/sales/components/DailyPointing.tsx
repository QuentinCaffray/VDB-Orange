import { Indicator } from '../../../types/sales.types'
import { useDailySales, useRecordSaleDelta } from '../hooks/useSales'
import { useDailySalesSocket } from '../hooks/useSalesSocket'
import { useAuthContext } from '../../../context/AuthContext'

interface DailyPointingProps {
  indicators: Indicator[]
  currentUserColor: string
  dateString: string
  showTeamTotal?: boolean
  sectionTitle?: string
}

export default function DailyPointing({
  indicators,
  currentUserColor,
  dateString,
  showTeamTotal = true,
  sectionTitle,
}: DailyPointingProps) {
  const { currentUser } = useAuthContext()
  const { data: dailySales = [] } = useDailySales(dateString)
  const { mutate: recordDelta } = useRecordSaleDelta(dateString)

  // Met à jour le cache React Query en temps réel via WebSocket
  useDailySalesSocket(dateString)

  if (!currentUser) return null

  function getCount(indicatorId: string): number {
    const entry = dailySales.find(
      (sale) => sale.indicatorId === indicatorId && sale.userId === currentUser!.id,
    )
    return entry?.count ?? 0
  }

  function getTeamTotal(indicatorId: string): number {
    return dailySales
      .filter((sale) => sale.indicatorId === indicatorId)
      .reduce((total, sale) => total + sale.count, 0)
  }

  function handleDelta(indicatorId: string, delta: 1 | -1): void {
    if (delta === -1 && getCount(indicatorId) === 0) return
    recordDelta({ indicatorId, delta })
  }

  return (
    <div className="flex flex-col gap-3">
      {sectionTitle && (
        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest m-0">
          {sectionTitle}
        </p>
      )}
      {indicators.map((indicator) => {
        const count = getCount(indicator.id)
        const teamTotal = getTeamTotal(indicator.id)

        return (
          <div key={indicator.id} className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between gap-4">

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-primary m-0">{indicator.name}</p>
                {showTeamTotal && (
                  <p className="text-xs text-text-tertiary m-0 mt-0.5">équipe : {teamTotal}</p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => handleDelta(indicator.id, -1)}
                  disabled={count === 0}
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
                  {count}
                </span>

                <button
                  onClick={() => handleDelta(indicator.id, 1)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold"
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
