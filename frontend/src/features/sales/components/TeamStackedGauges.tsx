import { Indicator, DailySaleEntry } from '../../../types/sales.types'

interface VendorSegment {
  userId: string
  userName: string
  userColor: string
  count: number
}

interface TeamStackedGaugesProps {
  indicators: Indicator[]
  dailySales: DailySaleEntry[]
  currentUserId: string
}

export default function TeamStackedGauges({
  indicators,
  dailySales,
  currentUserId,
}: TeamStackedGaugesProps) {
  // Construit les segments triés par userId pour chaque indicateur
  function buildSegmentsForIndicator(indicatorId: string): VendorSegment[] {
    return dailySales
      .filter((sale) => sale.indicatorId === indicatorId && sale.count > 0)
      .map((sale) => ({
        userId: sale.userId,
        userName: sale.userName,
        userColor: sale.userColor,
        count: sale.count,
      }))
  }

  // Extrait les vendeurs uniques ayant des ventes (pour la légende)
  const vendorsWithSales = dailySales
    .filter((sale) => sale.count > 0)
    .reduce<VendorSegment[]>((unique, sale) => {
      const alreadyAdded = unique.some((v) => v.userId === sale.userId)
      if (alreadyAdded) return unique
      return [...unique, { userId: sale.userId, userName: sale.userName, userColor: sale.userColor, count: 0 }]
    }, [])

  return (
    <div className="flex flex-col gap-3">
      {indicators.map((indicator) => {
        const segments = buildSegmentsForIndicator(indicator.id)
        const total = segments.reduce((sum, s) => sum + s.count, 0)

        return (
          <div key={indicator.id} className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-text-primary m-0">{indicator.name}</p>
              <span className="text-sm font-bold text-text-primary">{total}</span>
            </div>

            {total === 0 ? (
              <div className="h-5 rounded-full bg-surface flex items-center justify-center">
                <span className="text-xs text-text-tertiary">Aucune vente</span>
              </div>
            ) : (
              <div className="flex h-5 rounded-full overflow-hidden">
                {segments.map((segment) => {
                  const isCurrentUser = segment.userId === currentUserId
                  return (
                    <div
                      key={segment.userId}
                      className="flex items-center justify-center relative transition-all"
                      style={{
                        flex: segment.count,
                        background: segment.userColor,
                        // Contour foncé sur le segment du vendeur connecté
                        boxShadow: isCurrentUser ? 'inset 0 0 0 2px rgba(0,0,0,0.32)' : undefined,
                      }}
                      title={`${segment.userName} : ${segment.count}`}
                    >
                      {segment.count > 0 && (
                        <span className="text-[11px] font-bold text-white drop-shadow-sm">
                          {segment.count}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Légende vendeurs */}
      {vendorsWithSales.length > 0 && (
        <div className="bg-white rounded-2xl px-4 py-3 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
          <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-2 m-0">Qui :</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {vendorsWithSales.map((vendor) => (
              <div key={vendor.userId} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: vendor.userColor }} />
                <span className="text-xs font-semibold text-text-secondary">{vendor.userName}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
