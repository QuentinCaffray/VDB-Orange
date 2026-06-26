import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import {
  useDailySales,
  useIndicators,
  useMonthlyProgress,
  useTeamMonthlyBreakdown,
} from '../../features/sales/hooks/useSales'
import { useTasks } from '../../features/tasks/hooks/useTasks'
import { useCurrentDate } from '../../hooks/useCurrentDate'
import { Skeleton } from '../../components/ui/Skeleton'
import { Indicator, MonthlyProgressEntry, IndicatorTeamBreakdown, VendorIndicatorProgress } from '../../types/sales.types'

function formatTodayLong(): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  const formatted = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
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

// ── Classement mensuel (admin) ────────────────────────────────────────────────

const RANK_MEDALS = ['🥇', '🥈', '🥉']

interface VendorRankRowProps {
  vendor: VendorIndicatorProgress
  maxSales: number
}

function VendorRankRow({ vendor, maxSales }: VendorRankRowProps) {
  const barWidthPercentage = maxSales > 0 ? (vendor.totalSales / maxSales) * 100 : 0
  const medal = RANK_MEDALS[vendor.rank - 1] ?? null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="w-5 text-center text-sm leading-none">
        {medal ?? (
          <span className="text-xs font-bold" style={{ color: 'var(--color-text-tertiary)' }}>
            {vendor.rank}
          </span>
        )}
      </span>
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ background: vendor.userColor }}
      />
      <span className="text-sm font-semibold flex-1 truncate" style={{ color: 'var(--color-text-primary)' }}>
        {vendor.userName}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-20 h-1.5 rounded-full overflow-hidden"
          style={{ background: 'var(--color-surface)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barWidthPercentage}%`, background: vendor.userColor }}
          />
        </div>
        <span className="text-sm font-black w-6 text-right" style={{ color: 'var(--color-text-primary)' }}>
          {vendor.totalSales}
        </span>
      </div>
    </div>
  )
}

const LEADERBOARD_TOP_COUNT = 3

interface IndicatorLeaderboardCardProps {
  indicator: IndicatorTeamBreakdown
}

function IndicatorLeaderboardCard({ indicator }: IndicatorLeaderboardCardProps) {
  const [showAll, setShowAll] = useState(false)

  const teamTotal = indicator.vendors.reduce((sum, vendor) => sum + vendor.totalSales, 0)
  const maxSales = Math.max(...indicator.vendors.map((vendor) => vendor.totalSales), 1)
  const hiddenCount = indicator.vendors.length - LEADERBOARD_TOP_COUNT
  const visibleVendors = showAll ? indicator.vendors : indicator.vendors.slice(0, LEADERBOARD_TOP_COUNT)

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--color-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
    >
      <div
        className="flex justify-between items-center px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border-soft)' }}
      >
        <span className="text-sm font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {indicator.indicatorName}
        </span>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          <span className="font-black text-base" style={{ color: '#FF7900' }}>{teamTotal}</span>
          {' '}ce mois
        </span>
      </div>
      <div>
        {visibleVendors.map((vendor, index) => (
          <div key={vendor.userId}>
            <VendorRankRow vendor={vendor} maxSales={maxSales} />
            {index < visibleVendors.length - 1 && (
              <div className="mx-4 h-px" style={{ background: 'var(--color-border-soft)' }} />
            )}
          </div>
        ))}
      </div>
      {hiddenCount > 0 && (
        <button
          onClick={() => setShowAll((prev) => !prev)}
          className="w-full py-2.5 text-xs font-bold border-t"
          style={{
            borderColor: 'var(--color-border-soft)',
            color: 'var(--color-text-tertiary)',
            background: 'transparent',
          }}
        >
          {showAll ? 'Réduire ▲' : `Voir les ${hiddenCount} autres ▾`}
        </button>
      )}
    </div>
  )
}

interface MonthlyLeaderboardProps {
  breakdown: IndicatorTeamBreakdown[]
  month: number
  year: number
  isViewingCurrentMonth: boolean
  onPreviousMonth: () => void
  onNextMonth: () => void
}

function MonthlyLeaderboard({ breakdown, month, year, isViewingCurrentMonth, onPreviousMonth, onNextMonth }: MonthlyLeaderboardProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={onPreviousMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full"
          style={{ background: 'var(--color-surface)' }}
          aria-label="Mois précédent"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-xs font-bold min-w-[120px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
          {formatMonthLabel(month, year)}
        </span>
        <button
          onClick={onNextMonth}
          disabled={isViewingCurrentMonth}
          className="w-7 h-7 flex items-center justify-center rounded-full disabled:opacity-30"
          style={{ background: 'var(--color-surface)' }}
          aria-label="Mois suivant"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {breakdown.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          Aucun indicateur actif ce mois.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {breakdown.map((indicator) => (
            <IndicatorLeaderboardCard key={indicator.indicatorId} indicator={indicator} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Skeletons de chargement ───────────────────────────────────────────────────

function DashboardChipsSkeleton() {
  return (
    <div className="flex gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-[68px] w-[100px] shrink-0" />
      ))}
    </div>
  )
}

function DashboardProgressSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

function DashboardLeaderboardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--color-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
        >
          <div
            className="flex justify-between items-center px-4 py-3 border-b"
            style={{ borderColor: 'var(--color-border-soft)' }}
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-14" />
          </div>
          <div className="flex flex-col px-4 py-2 gap-3">
            {[1, 2, 3].map((j) => (
              <Skeleton key={j} className="h-8 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthContext()
  const { month: currentMonth, year: currentYear, dateString: todayString } = useCurrentDate()

  const isAdmin = currentUser?.role === 'admin'

  const [viewMonth, setViewMonth] = useState<number>(currentMonth)
  const [viewYear, setViewYear] = useState<number>(currentYear)
  const isViewingCurrentMonth = viewMonth === currentMonth && viewYear === currentYear

  function handlePreviousMonth(): void {
    if (viewMonth === 1) {
      setViewMonth(12)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  function handleNextMonth(): void {
    if (isViewingCurrentMonth) return
    if (viewMonth === 12) {
      setViewMonth(1)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const { data: dailySales = [], isLoading: isDailySalesLoading } = useDailySales(todayString)
  const { data: allTasks = [] } = useTasks()
  const { data: indicators = [], isLoading: isIndicatorsLoading } = useIndicators()

  const { data: myMonthlyProgress = [], isLoading: isMonthlyProgressLoading } = useMonthlyProgress(
    currentUser?.id ?? '',
    currentMonth,
    currentYear,
  )

  const { data: teamBreakdown = [], isLoading: isTeamBreakdownLoading } = useTeamMonthlyBreakdown(viewMonth, viewYear, isAdmin)

  const isPersonalSalesLoading = isDailySalesLoading || isIndicatorsLoading

  if (!currentUser) return null

  const dailyIndicators = indicators.filter((indicator) => indicator.type === 'daily')

  const todoCount = allTasks.filter((task) => task.status === 'todo').length
  const doingCount = allTasks.filter((task) => task.status === 'doing').length

  const myDailySales = dailyIndicators.map((indicator) => {
    const mySale = dailySales.find(
      (sale) => sale.indicatorId === indicator.id && sale.userId === currentUser.id,
    )
    return { indicator, count: mySale?.count ?? 0 }
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
              <SectionTitle label="Classement du mois" />
              {isTeamBreakdownLoading ? (
                <DashboardLeaderboardSkeleton />
              ) : (
                <MonthlyLeaderboard
                  breakdown={teamBreakdown}
                  month={viewMonth}
                  year={viewYear}
                  isViewingCurrentMonth={isViewingCurrentMonth}
                  onPreviousMonth={handlePreviousMonth}
                  onNextMonth={handleNextMonth}
                />
              )}
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
              {isPersonalSalesLoading ? (
                <DashboardChipsSkeleton />
              ) : (
                <PersonalDailySalesCard salesByIndicator={myDailySales} />
              )}
            </section>

            <section>
              <SectionTitle label="Ma progression du mois" />
              <div
                className="rounded-2xl px-4 py-4"
                style={{ background: 'var(--color-card)', boxShadow: '0 4px 14px rgba(0,0,0,0.05)' }}
              >
                {isMonthlyProgressLoading ? (
                  <DashboardProgressSkeleton />
                ) : (
                  <MonthlyProgressBars
                    entries={myMonthlyProgress}
                    emptyLabel="Aucun objectif fixé ce mois."
                  />
                )}
              </div>
            </section>
          </>
        ) : (
          // ── Vue vendeur ───────────────────────────────────────────────────
          <>
            <section>
              <SectionTitle label="Mes ventes aujourd'hui" />
              {isPersonalSalesLoading ? (
                <DashboardChipsSkeleton />
              ) : (
                <PersonalDailySalesCard salesByIndicator={myDailySales} />
              )}
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
                {isMonthlyProgressLoading ? (
                  <DashboardProgressSkeleton />
                ) : (
                  <MonthlyProgressBars
                    entries={myMonthlyProgress}
                    emptyLabel="Aucun objectif fixé ce mois."
                  />
                )}
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  )
}
