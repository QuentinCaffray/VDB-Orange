import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import {
  useIndicators,
  useDailySales,
  useMonthlyProgress,
  useSetMonthlyTarget,
  useReorderIndicators,
  useMonthlyWorkingDays,
  useSetMonthlyWorkingDays,
} from '../../features/sales/hooks/useSales'
import { MonthlyProgressEntry } from '../../types/sales.types'
import { useAllUsers } from '../../features/users/hooks/useUsers'
import { useCurrentDate } from '../../hooks/useCurrentDate'
import { getLocalDateString } from '../../lib/date'
import { Skeleton } from '../../components/ui/Skeleton'
import DailyPointing from '../../features/sales/components/DailyPointing'
import TeamStackedGauges from '../../features/sales/components/TeamStackedGauges'
import MonthlyProgress from '../../features/sales/components/MonthlyProgress'
import { VendorSelector } from '../../components/ui/VendorSelector'

type MainTab = 'day' | 'month'
type DaySubTab = 'pointing' | 'team'

const MAX_DAYS_IN_PAST = 30

function getTodayString(): string {
  return getLocalDateString()
}

function getPreviousDateString(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00')
  date.setDate(date.getDate() - 1)
  return getLocalDateString(date)
}

function getNextDateString(dateString: string): string {
  const date = new Date(dateString + 'T12:00:00')
  date.setDate(date.getDate() + 1)
  return getLocalDateString(date)
}

function formatViewMonthLabel(month: number, year: number): string {
  const date = new Date(year, month - 1, 1)
  const formatted = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatSelectedDateLabel(dateString: string): string {
  const todayString = getTodayString()
  const yesterdayString = getPreviousDateString(todayString)
  if (dateString === todayString) return "Aujourd'hui"
  if (dateString === yesterdayString) return 'Hier'
  const date = new Date(dateString + 'T12:00:00')
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }).format(date)
}

function isMoreThanMaxDaysInPast(dateString: string): boolean {
  const todayString = getTodayString()
  const today = new Date(todayString + 'T12:00:00')
  const date = new Date(dateString + 'T12:00:00')
  const diffInDays = Math.round((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
  return diffInDays >= MAX_DAYS_IN_PAST
}

function formatTodayDate(): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date())
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function ObjectivesSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  )
}

const MIN_WORKING_DAYS = 1
const MAX_WORKING_DAYS = 31

interface WorkingDaysStepperProps {
  value: number | null
  onChange: (newValue: number) => void
  vendorName: string
}

function WorkingDaysStepper({ value, onChange, vendorName }: WorkingDaysStepperProps) {
  function handleDecrement(): void {
    const current = value ?? MIN_WORKING_DAYS
    if (current > MIN_WORKING_DAYS) onChange(current - 1)
  }

  function handleIncrement(): void {
    const current = value ?? MIN_WORKING_DAYS
    if (current < MAX_WORKING_DAYS) onChange(current + 1)
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>): void {
    const parsed = parseInt(event.target.value, 10)
    if (!isNaN(parsed) && parsed >= MIN_WORKING_DAYS && parsed <= MAX_WORKING_DAYS) {
      onChange(parsed)
    }
  }

  return (
    <div className="mt-3 rounded-2xl px-4 py-3 flex items-center justify-between gap-3" style={{ background: 'var(--color-surface)' }}>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold text-text-primary">Jours travaillés ce mois</span>
        <span className="text-[11px] text-text-tertiary">
          Pour {vendorName} — sert au calcul du rythme journalier
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDecrement}
          disabled={value !== null && value <= MIN_WORKING_DAYS}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary disabled:opacity-30 transition-opacity"
          style={{ background: 'var(--color-canvas)' }}
          aria-label="Réduire les jours travaillés"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <input
          type="number"
          min={MIN_WORKING_DAYS}
          max={MAX_WORKING_DAYS}
          value={value ?? ''}
          placeholder="—"
          onChange={handleInputChange}
          className="w-10 text-center text-sm font-bold text-text-primary bg-transparent outline-none tabular-nums"
          aria-label="Nombre de jours travaillés"
        />
        <button
          onClick={handleIncrement}
          disabled={value !== null && value >= MAX_WORKING_DAYS}
          className="w-8 h-8 flex items-center justify-center rounded-xl text-text-secondary disabled:opacity-30 transition-opacity"
          style={{ background: 'var(--color-canvas)' }}
          aria-label="Augmenter les jours travaillés"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

export default function ObjectivesPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthContext()
  const [searchParams] = useSearchParams()
  const vendorIdFromUrl = searchParams.get('vendorId')
  const { month: currentMonth, year: currentYear, dateString: todayString } = useCurrentDate()

  const [mainTab, setMainTab] = useState<MainTab>(() => vendorIdFromUrl ? 'month' : 'day')
  const [daySubTab, setDaySubTab] = useState<DaySubTab>('pointing')
  const [selectedDate, setSelectedDate] = useState<string>(() => getTodayString())
  const [selectedVendorId, setSelectedVendorId] = useState<string>(() => vendorIdFromUrl ?? '')
  const [isEditingTargets, setIsEditingTargets] = useState(false)
  const [targetEdits, setTargetEdits] = useState<Record<string, number | null>>({})
  const [viewMonth, setViewMonth] = useState<number>(currentMonth)
  const [viewYear, setViewYear] = useState<number>(currentYear)
  const [reorderedEntryIds, setReorderedEntryIds] = useState<string[]>([])
  // Nombre de jours travaillés en cours d'édition — null tant que l'admin n'a pas touché au stepper
  const [editableWorkingDays, setEditableWorkingDays] = useState<number | null>(null)

  const isTodaySelected = selectedDate === todayString
  const isViewingCurrentMonth = viewMonth === currentMonth && viewYear === currentYear
  const isAdmin = currentUser?.role === 'admin'

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

  const { data: allUsers = [] } = useAllUsers()
  const resolvedVendorId = selectedVendorId || currentUser?.id || ''

  const { data: indicators = [], isLoading: isIndicatorsLoading } = useIndicators()
  const dailyIndicators = indicators.filter((indicator) => indicator.type === 'daily')
  const monthlyIndicators = indicators.filter((indicator) => indicator.type === 'monthly')

  const { data: dailySales = [], isLoading: isDailySalesLoading } = useDailySales(selectedDate)
  const { data: monthlyProgress = [], isLoading: isMonthlyProgressLoading } = useMonthlyProgress(
    isAdmin ? resolvedVendorId : (currentUser?.id ?? ''),
    viewMonth,
    viewYear,
  )

  const { mutateAsync: saveTarget, isPending: isSavingTargets } = useSetMonthlyTarget(
    viewMonth,
    viewYear,
    resolvedVendorId,
  )
  const { mutateAsync: saveIndicatorOrder } = useReorderIndicators()

  const workingDaysQuery = useMonthlyWorkingDays(resolvedVendorId, viewMonth, viewYear)
  const { mutateAsync: saveWorkingDays } = useSetMonthlyWorkingDays()

  const selectedVendor = allUsers.find((user) => user.id === resolvedVendorId)

  // Réinitialiser l'édition quand on change de vendeur ou de mois
  useEffect(() => {
    setIsEditingTargets(false)
    setTargetEdits({})
    setReorderedEntryIds([])
    setEditableWorkingDays(null)
  }, [selectedVendorId, viewMonth, viewYear])

  // Initialise l'ordre local à l'entrée en mode édition
  useEffect(() => {
    if (isEditingTargets && monthlyProgress.length > 0) {
      setReorderedEntryIds(monthlyProgress.map((entry) => entry.indicatorId))
    } else if (!isEditingTargets) {
      setReorderedEntryIds([])
    }
  }, [isEditingTargets]) // eslint-disable-line react-hooks/exhaustive-deps

  const displayedProgressEntries: MonthlyProgressEntry[] = reorderedEntryIds.length > 0
    ? reorderedEntryIds
        .map((id) => monthlyProgress.find((entry) => entry.indicatorId === id))
        .filter((entry): entry is MonthlyProgressEntry => entry !== undefined)
    : monthlyProgress

  function handleVendorSelect(vendorId: string): void {
    setSelectedVendorId(vendorId)
  }

  function handleTargetChange(indicatorId: string, value: number | null): void {
    setTargetEdits((previous) => ({ ...previous, [indicatorId]: value }))
  }

  function handleMoveEntry(indicatorId: string, direction: 'up' | 'down'): void {
    setReorderedEntryIds((current) => {
      const index = current.indexOf(indicatorId)
      if (index === -1) return current
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) return current
      const updated = [...current]
      updated[index] = current[targetIndex]
      updated[targetIndex] = indicatorId
      return updated
    })
  }

  function handleCancelEdit(): void {
    setIsEditingTargets(false)
    setTargetEdits({})
    setReorderedEntryIds([])
    setEditableWorkingDays(null)
  }

  async function handleSaveTargets(): Promise<void> {
    for (const indicatorId of Object.keys(targetEdits)) {
      const newTarget = targetEdits[indicatorId]
      if (newTarget === null) continue
      await saveTarget({ userId: resolvedVendorId, indicatorId, month: viewMonth, year: viewYear, target: newTarget })
    }

    const originalOrder = monthlyProgress.map((entry) => entry.indicatorId)
    const orderChanged = reorderedEntryIds.some((id, index) => originalOrder[index] !== id)
    if (orderChanged) {
      await saveIndicatorOrder(reorderedEntryIds)
    }

    const savedWorkingDays = workingDaysQuery.data?.workingDays ?? null
    const workingDaysChanged = editableWorkingDays !== null && editableWorkingDays !== savedWorkingDays
    if (workingDaysChanged) {
      await saveWorkingDays({
        userId: resolvedVendorId,
        month: viewMonth,
        year: viewYear,
        workingDays: editableWorkingDays,
      })
    }

    setIsEditingTargets(false)
    setTargetEdits({})
    setReorderedEntryIds([])
    setEditableWorkingDays(null)
  }

  const savedWorkingDays = workingDaysQuery.data?.workingDays ?? null
  const workingDaysEdited = editableWorkingDays !== null && editableWorkingDays !== savedWorkingDays
  const hasChangesToSave =
    Object.keys(targetEdits).length > 0 ||
    reorderedEntryIds.some((id, index) => monthlyProgress[index]?.indicatorId !== id) ||
    workingDaysEdited

  if (!currentUser) return null

  return (
    <div className="min-h-full">

      {/* Header + onglets — sticky */}
      <div className="sticky top-0 z-10 bg-app-bg">
        <div className="px-5 pt-12 pb-4 flex items-start justify-between">
          <div>
            <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
              Objectifs
            </h1>
            <p className="text-sm text-text-secondary mt-0.5 m-0">{formatTodayDate()}</p>
          </div>

          {/* Bouton gestion indicateurs (admin uniquement) */}
          {isAdmin && (
            <button
              onClick={() => navigate('/admin/indicators')}
              className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-surface text-xs font-bold text-text-secondary"
              title="Gérer les indicateurs"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
              Gérer
            </button>
          )}
        </div>

        {/* Navigation temporelle — jour ou mois selon l'onglet actif */}
        <div className="flex items-center justify-center gap-2 px-5 pb-3">
          {mainTab === 'day' ? (
            <>
              <button
                onClick={() => setSelectedDate(getPreviousDateString(selectedDate))}
                disabled={isMoreThanMaxDaysInPast(selectedDate)}
                className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30"
                style={{ background: 'var(--color-surface)' }}
                aria-label="Jour précédent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              <span className="text-sm font-bold text-text-primary min-w-[90px] text-center">
                {formatSelectedDateLabel(selectedDate)}
              </span>

              <button
                onClick={() => setSelectedDate(getNextDateString(selectedDate))}
                disabled={isTodaySelected}
                className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30"
                style={{ background: 'var(--color-surface)' }}
                aria-label="Jour suivant"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handlePreviousMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full"
                style={{ background: 'var(--color-surface)' }}
                aria-label="Mois précédent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <span className="text-sm font-bold text-text-primary min-w-[140px] text-center">
                {formatViewMonthLabel(viewMonth, viewYear)}
              </span>
              <button
                onClick={handleNextMonth}
                disabled={isViewingCurrentMonth}
                className="w-8 h-8 flex items-center justify-center rounded-full disabled:opacity-30"
                style={{ background: 'var(--color-surface)' }}
                aria-label="Mois suivant"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Onglets Jour / Mois */}
        <div className="flex border-b border-border-soft px-5 gap-1">
          {(['day', 'month'] as MainTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setMainTab(tab)}
              className={`pb-3 px-3 text-sm font-bold transition-colors relative ${
                mainTab === tab ? 'text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {tab === 'day' ? 'Jour' : 'Mois'}
              {mainTab === tab && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`px-5 py-4${isEditingTargets ? ' pb-36 md:pb-24' : ''}`}>

        {/* ── Onglet Jour ── */}
        {mainTab === 'day' && (
          <>
            <div className="flex bg-canvas rounded-2xl p-1 mb-4">
              {([['pointing', '✎ Je pointe'], ['team', 'Équipe']] as [DaySubTab, string][]).map(([sub, label]) => (
                <button
                  key={sub}
                  onClick={() => setDaySubTab(sub)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                    daySubTab === sub
                      ? 'bg-white text-text-primary shadow-[0_1px_3px_rgba(0,0,0,0.1)] dark:shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.5)]'
                      : 'text-text-secondary'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {daySubTab === 'pointing' && (
              isIndicatorsLoading ? (
                <ObjectivesSkeleton />
              ) : (
                <DailyPointing
                  indicators={dailyIndicators}
                  currentUserColor={currentUser.color}
                  dateString={selectedDate}
                />
              )
            )}

            {daySubTab === 'team' && (
              isDailySalesLoading || isIndicatorsLoading ? (
                <ObjectivesSkeleton />
              ) : (
                <TeamStackedGauges
                  indicators={dailyIndicators}
                  dailySales={dailySales}
                  currentUserId={currentUser.id}
                />
              )
            )}
          </>
        )}

        {/* ── Onglet Mois ── */}
        {mainTab === 'month' && (
          <>
            {/* Sélecteur de vendeur — admin uniquement */}
            {isAdmin && allUsers.length > 0 && (
              <div className="mb-4">
                <VendorSelector
                  vendors={allUsers}
                  selectedId={resolvedVendorId}
                  onSelect={handleVendorSelect}
                />

                {/* Bouton modifier les objectifs — uniquement sur le mois en cours */}
                {!isEditingTargets && isViewingCurrentMonth && (
                  <button
                    onClick={() => {
                      setEditableWorkingDays(workingDaysQuery.data?.workingDays ?? null)
                      setIsEditingTargets(true)
                    }}
                    className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                    style={{ background: 'var(--color-brand-tint)', color: '#FF7900' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Modifier les objectifs de {selectedVendor?.name ?? '…'}
                  </button>
                )}

                {/* Stepper jours travaillés — visible uniquement en mode édition */}
                {isEditingTargets && (
                  <WorkingDaysStepper
                    value={editableWorkingDays}
                    onChange={setEditableWorkingDays}
                    vendorName={selectedVendor?.name ?? '…'}
                  />
                )}
              </div>
            )}

            {isMonthlyProgressLoading ? (
              <ObjectivesSkeleton />
            ) : (
              <MonthlyProgress
                progressEntries={displayedProgressEntries}
                month={viewMonth}
                year={viewYear}
                vendorName={isAdmin ? selectedVendor?.name : undefined}
                isEditMode={isEditingTargets}
                editableTargets={targetEdits}
                onTargetChange={handleTargetChange}
                onMoveEntry={isEditingTargets ? handleMoveEntry : undefined}
                monthlyIndicatorIds={new Set(monthlyIndicators.map((i) => i.id))}
                currentUserId={currentUser.id}
                currentUserColor={isAdmin ? (selectedVendor?.color ?? currentUser.color) : currentUser.color}
                allowSaleCorrection={isViewingCurrentMonth}
                targetUserId={isAdmin ? resolvedVendorId : undefined}
                workingDays={workingDaysQuery.data?.workingDays}
              />
            )}

            {/* Barre actions — portail dans document.body pour échapper au transform de page-enter
                qui casserait le position:fixed en le rendant relatif au div animé plutôt qu'au viewport */}
            {isEditingTargets && createPortal(
              <div
                className="fixed bottom-14 md:bottom-0 left-0 right-0 md:left-[240px] z-30 px-5 py-4 bg-white dark:bg-[#1c1c1e] border-t border-border-soft flex gap-3"
                style={{ position: 'fixed', paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
              >
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 py-3 rounded-2xl border border-border-soft text-sm font-bold text-text-secondary"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTargets}
                  disabled={isSavingTargets || !hasChangesToSave}
                  className="flex-[2] py-3 rounded-2xl text-sm font-bold text-white disabled:opacity-40"
                  style={{ background: '#FF7900' }}
                >
                  {isSavingTargets ? 'Enregistrement…' : `Enregistrer pour ${selectedVendor?.name ?? '…'}`}
                </button>
              </div>,
              document.body,
            )}
          </>
        )}
      </div>
    </div>
  )
}
