import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import {
  useDailySales,
  useIndicators,
  useMonthlyProgress,
  useTeamMonthlyProgress,
} from '../../features/sales/hooks/useSales'
import { useTasks } from '../../features/tasks/hooks/useTasks'
import { useCurrentDate } from '../../hooks/useCurrentDate'
import { Indicator, MonthlyProgressEntry } from '../../types/sales.types'

function formatTodayLong(): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function getFirstName(fullName: string): string {
  return fullName.split(' ')[0]
}

function computeCompletionRatio(entry: MonthlyProgressEntry): number {
  if (!entry.target || entry.target === 0) return 0
  return entry.totalSales / entry.target
}

// ── Sous-composants ───────────────────────────────────────────────────────────

interface SectionTitleProps {
  label: string
}

function SectionTitle({ label }: SectionTitleProps) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-tertiary)' }}>
      {label}
    </p>
  )
}

// Ligne boutique : total du jour pour un indicateur + progression mensuelle
interface BoutiqueIndicatorRowProps {
  indicatorName: string
  dailyTeamTotal: number
  monthlyTeamTotal: number
  monthlyTarget: number | null
}

function BoutiqueIndicatorRow({
  indicatorName,
  dailyTeamTotal,
  monthlyTeamTotal,
  monthlyTarget,
}: BoutiqueIndicatorRowProps) {
  const hasTarget = monthlyTarget !== null && monthlyTarget > 0
  const percentage = hasTarget
    ? Math.min(Math.round((monthlyTeamTotal / monthlyTarget) * 100), 100)
    : 0
  const isCompleted = percentage >= 100
  const progressColor = isCompleted ? '#22C55E' : '#FF7900'

  return (
    <div className="py-3.5">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          {indicatorName}
        </span>
        <span className="text-xl font-black" style={{ color: '#FF7900' }}>
          {dailyTeamTotal}
        </span>
      </div>
      {hasTarget ? (
        <>
          <div
            className="h-1.5 rounded-full overflow-hidden mb-1.5"
            style={{ background: 'var(--color-surface)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${percentage}%`, background: progressColor }}
            />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              {monthlyTeamTotal} / {monthlyTarget} ce mois
            </span>
            <span className="text-xs font-bold" style={{ color: progressColor }}>
              {percentage}%
            </span>
          </div>
        </>
      ) : (
        <p className="text-xs m-0" style={{ color: 'var(--color-text-tertiary)' }}>
          Pas d'objectif mensuel défini
        </p>
      )}
    </div>
  )
}

// Récap boutique : liste des indicateurs actifs avec totaux + progression
interface BoutiqueRecapCardProps {
  stats: Array<{
    indicator: Indicator
    dailyTeamTotal: number
    monthlyTeamTotal: number
    monthlyTarget: number | null
  }>
}

function BoutiqueRecapCard({ stats }: BoutiqueRecapCardProps) {
  if (stats.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Aucun indicateur journalier actif.
      </p>
    )
  }

  return (
    <div
      className="rounded-2xl px-4"
      style={{ background: 'var(--color-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
    >
      {stats.map(({ indicator, dailyTeamTotal, monthlyTeamTotal, monthlyTarget }, index) => (
        <div key={indicator.id}>
          <BoutiqueIndicatorRow
            indicatorName={indicator.name}
            dailyTeamTotal={dailyTeamTotal}
            monthlyTeamTotal={monthlyTeamTotal}
            monthlyTarget={monthlyTarget}
          />
          {index < stats.length - 1 && (
            <div className="h-px" style={{ background: 'var(--color-border)' }} />
          )}
        </div>
      ))}
    </div>
  )
}

// Ventes personnelles aujourd'hui (vue vendeur)
interface PersonalDailySalesCardProps {
  salesByIndicator: Array<{ indicator: Indicator; count: number }>
}

function PersonalDailySalesCard({ salesByIndicator }: PersonalDailySalesCardProps) {
  if (salesByIndicator.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        Aucun indicateur journalier actif.
      </p>
    )
  }
  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {salesByIndicator.map(({ indicator, count }) => (
        <div
          key={indicator.id}
          className="shrink-0 rounded-2xl px-4 py-3 min-w-[100px]"
          style={{ background: 'var(--color-surface)' }}
        >
          <p className="text-2xl font-black m-0" style={{ color: '#FF7900' }}>{count}</p>
          <p className="text-xs font-semibold mt-1 m-0" style={{ color: 'var(--color-text-secondary)' }}>
            {indicator.name}
          </p>
        </div>
      ))}
    </div>
  )
}

interface TasksCardProps {
  todoCount: number
  doingCount: number
  onNavigateToTasks: () => void
}

function TasksCard({ todoCount, doingCount, onNavigateToTasks }: TasksCardProps) {
  return (
    <div className="flex gap-3">
      <button
        onClick={onNavigateToTasks}
        className="flex-1 rounded-2xl px-4 py-3 text-left"
        style={{ background: 'var(--color-surface)' }}
      >
        <p className="text-2xl font-black m-0" style={{ color: 'var(--color-text-primary)' }}>
          {todoCount}
        </p>
        <p className="text-xs font-semibold mt-1 m-0" style={{ color: 'var(--color-text-tertiary)' }}>
          À faire
        </p>
      </button>

      <button
        onClick={onNavigateToTasks}
        className="flex-1 rounded-2xl px-4 py-3 text-left"
        style={{ background: 'var(--color-surface)' }}
      >
        <p className="text-2xl font-black m-0" style={{ color: '#FF7900' }}>
          {doingCount}
        </p>
        <p className="text-xs font-semibold mt-1 m-0" style={{ color: 'var(--color-text-tertiary)' }}>
          En cours
        </p>
      </button>
    </div>
  )
}

// Barres de progression mensuelle personnelle (vue vendeur)
interface MonthlyProgressBarsProps {
  entries: MonthlyProgressEntry[]
  emptyLabel: string
}

function MonthlyProgressBars({ entries, emptyLabel }: MonthlyProgressBarsProps) {
  const entriesWithTarget = entries.filter(
    (entry) => entry.target !== null && entry.target > 0,
  )

  if (entriesWithTarget.length === 0) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
        {emptyLabel}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {entriesWithTarget.map((entry) => {
        const ratio = computeCompletionRatio(entry)
        const percentage = Math.min(Math.round(ratio * 100), 100)
        const isCompleted = percentage >= 100

        return (
          <div key={entry.indicatorId}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {entry.indicatorName}
              </span>
              <span className="text-xs font-bold" style={{ color: isCompleted ? '#22C55E' : '#FF7900' }}>
                {percentage}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, background: isCompleted ? '#22C55E' : '#FF7900' }}
              />
            </div>
            <p className="text-xs mt-1 m-0" style={{ color: 'var(--color-text-tertiary)' }}>
              {entry.totalSales} / {entry.target}
            </p>
          </div>
        )
      })}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthContext()
  const { month, year, dateString: todayString } = useCurrentDate()

  const isAdmin = currentUser?.role === 'admin'

  const { data: dailySales = [] } = useDailySales(todayString)
  const { data: allTasks = [] } = useTasks()
  const { data: indicators = [] } = useIndicators()

  const { data: myMonthlyProgress = [] } = useMonthlyProgress(
    currentUser?.id ?? '',
    month,
    year,
  )

  const { data: teamMonthlyProgress = [] } = useTeamMonthlyProgress(
    month,
    year,
  )

  if (!currentUser) return null

  const dailyIndicators = indicators.filter((indicator) => indicator.type === 'daily')

  const todoCount = allTasks.filter((task) => task.status === 'todo').length
  const doingCount = allTasks.filter((task) => task.status === 'doing').length

  // Ventes personnelles du jour (vue vendeur)
  const myDailySales = dailyIndicators.map((indicator) => {
    const mySale = dailySales.find(
      (sale) => sale.indicatorId === indicator.id && sale.userId === currentUser.id,
    )
    return { indicator, count: mySale?.count ?? 0 }
  })

  // Totaux boutique du jour + progression mensuelle par indicateur (vue admin)
  const boutiqueIndicatorStats = dailyIndicators.map((indicator) => {
    const dailyTeamTotal = dailySales
      .filter((sale) => sale.indicatorId === indicator.id)
      .reduce((sum, sale) => sum + sale.count, 0)

    const monthlyEntry = teamMonthlyProgress.find((entry) => entry.indicatorId === indicator.id)

    return {
      indicator,
      dailyTeamTotal,
      monthlyTeamTotal: monthlyEntry?.totalSales ?? 0,
      monthlyTarget: monthlyEntry?.target ?? null,
    }
  })

  function handleNavigateToTasks(): void {
    navigate('/tasks')
  }

  return (
    <div className="min-h-full pb-6">

      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
          Bonjour, {getFirstName(currentUser.name)} 👋
        </h1>
        <p className="text-sm mt-0.5 m-0" style={{ color: 'var(--color-text-secondary)' }}>
          {formatTodayLong()}
        </p>
      </div>

      <div className="flex flex-col gap-5 px-5">

        {isAdmin ? (
          // ── Vue admin ────────────────────────────────────────────────────
          <>
            <section>
              <SectionTitle label="Boutique aujourd'hui" />
              <BoutiqueRecapCard stats={boutiqueIndicatorStats} />
            </section>

            <section>
              <SectionTitle label="Tâches actives" />
              <TasksCard
                todoCount={todoCount}
                doingCount={doingCount}
                onNavigateToTasks={handleNavigateToTasks}
              />
            </section>

            <section>
              <SectionTitle label="Mes ventes aujourd'hui" />
              <PersonalDailySalesCard salesByIndicator={myDailySales} />
            </section>

            <section>
              <SectionTitle label="Ma progression du mois" />
              <div
                className="rounded-2xl px-4 py-4"
                style={{ background: 'var(--color-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
              >
                <MonthlyProgressBars
                  entries={myMonthlyProgress}
                  emptyLabel="Aucun objectif fixé ce mois."
                />
              </div>
            </section>
          </>
        ) : (
          // ── Vue vendeur ───────────────────────────────────────────────────
          <>
            <section>
              <SectionTitle label="Mes ventes aujourd'hui" />
              <PersonalDailySalesCard salesByIndicator={myDailySales} />
            </section>

            <section>
              <SectionTitle label="Tâches actives" />
              <TasksCard
                todoCount={todoCount}
                doingCount={doingCount}
                onNavigateToTasks={handleNavigateToTasks}
              />
            </section>

            <section>
              <SectionTitle label="Ma progression du mois" />
              <div
                className="rounded-2xl px-4 py-4"
                style={{ background: 'var(--color-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
              >
                <MonthlyProgressBars
                  entries={myMonthlyProgress}
                  emptyLabel="Aucun objectif fixé ce mois."
                />
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  )
}
