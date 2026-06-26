import { useState, useEffect } from 'react'
import { MonthlyProgressEntry } from '../../../types/sales.types'
import { useSetMonthlyAbsoluteTotal } from '../hooks/useSales'

// ── Calcul du rythme journalier nécessaire pour atteindre l'objectif ─────────

interface DailyPaceInfo {
  type: 'none' | 'pace'
  paceNeeded?: number
  currentPace?: number
  daysRemaining?: number
}

function calculateDailyPace(
  totalSales: number,
  target: number,
  month: number,
  year: number,
): DailyPaceInfo {
  const today = new Date()
  const daysInMonth = new Date(year, month, 0).getDate()
  const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year
  const currentDay = isCurrentMonth ? today.getDate() : daysInMonth

  const daysRemaining = daysInMonth - currentDay
  const salesNeeded = target - totalSales

  if (daysRemaining <= 0 || salesNeeded <= 0) return { type: 'none' }

  const paceNeeded = salesNeeded / daysRemaining
  const currentPace = currentDay > 0 ? totalSales / currentDay : 0

  return { type: 'pace', paceNeeded, currentPace, daysRemaining }
}

interface MonthlyProgressProps {
  progressEntries: MonthlyProgressEntry[]
  month: number
  year: number
  vendorName?: string
  isEditMode?: boolean
  editableTargets?: Record<string, number | null>
  onTargetChange?: (indicatorId: string, value: number | null) => void
  monthlyIndicatorIds?: Set<string>
  currentUserId?: string
  currentUserColor?: string
  allowSaleCorrection?: boolean
  // ID du vendeur cible — si défini, les actions d'édition s'appliquent à ce vendeur (vue admin)
  targetUserId?: string
}

export default function MonthlyProgress({
  progressEntries,
  month,
  year,
  vendorName,
  isEditMode = false,
  editableTargets = {},
  onTargetChange,
  monthlyIndicatorIds,
  currentUserId,
  currentUserColor,
  allowSaleCorrection = false,
  targetUserId,
}: MonthlyProgressProps) {
  const [animationReady, setAnimationReady] = useState(false)

  // Démarre à 0% puis anime vers la valeur réelle — réinitialise au changement de vendeur
  useEffect(() => {
    setAnimationReady(false)
    const frameId = requestAnimationFrame(() => setAnimationReady(true))
    return () => cancelAnimationFrame(frameId)
  }, [progressEntries])

  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' })
    .format(new Date(year, month - 1, 1))

  const heroTitle = vendorName ?? 'Ma progression'
  const hasMonthlySteppers = monthlyIndicatorIds && monthlyIndicatorIds.size > 0 && currentUserId && currentUserColor

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

          const isMonthlyEntry = monthlyIndicatorIds?.has(entry.indicatorId)
          const showMonthlyForm = hasMonthlySteppers && isMonthlyEntry

          return (
            <div key={entry.indicatorId} className="bg-white rounded-2xl px-5 py-5 shadow-[0_4px_14px_rgba(0,0,0,0.05)] hover-lift">
              <div className="flex items-center justify-between mb-2">

                {/* Nom + badge */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm font-bold text-text-primary truncate">
                    {entry.indicatorName}
                  </span>
                  {!isEditMode && isValidated && (
                    <span className="text-[11px] font-bold text-success bg-success-tint px-2 py-0.5 rounded-full shrink-0">
                      ✓ Validé
                    </span>
                  )}
                </div>

                {/* Valeur actuelle / objectif */}
                {isEditMode ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className="text-sm font-bold"
                      style={{ color: currentUserColor ?? '#57C77E' }}
                      aria-hidden="true"
                    >
                      {entry.totalSales}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-text-tertiary font-semibold" aria-hidden="true">/</span>
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
                        aria-label={`Objectif ${entry.indicatorName}`}
                      />
                    </div>
                  </div>
                ) : (
                  <span
                    className="flex items-center gap-2 shrink-0"
                    role="text"
                    aria-label={
                      displayTarget !== null
                        ? `${entry.totalSales} sur ${displayTarget}`
                        : String(entry.totalSales)
                    }
                  >
                    <span
                      className="text-sm font-bold"
                      style={{ color: currentUserColor ?? '#57C77E' }}
                      aria-hidden="true"
                    >
                      {entry.totalSales}
                    </span>
                    {displayTarget !== null && (
                      <span className="text-sm text-text-tertiary font-semibold" aria-hidden="true">
                        / {displayTarget}
                      </span>
                    )}
                  </span>
                )}
              </div>

              {/* Barre de progression */}
              {displayTarget !== null && displayTarget > 0 && (
                <div className="h-2 rounded-full bg-surface overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: animationReady ? `${progressRatio * 100}%` : '0%',
                      background: currentUserColor ?? '#57C77E',
                    }}
                  />
                </div>
              )}

              {/* Rythme journalier — uniquement pour les indicateurs journaliers, vue vendeur, objectif non atteint */}
              {allowSaleCorrection && !isEditMode && !isMonthlyEntry && displayTarget !== null && displayTarget > 0 && !isValidated && (() => {
                const paceInfo = calculateDailyPace(entry.totalSales, displayTarget, month, year)
                if (paceInfo.type === 'none') return null

                const { paceNeeded, currentPace, daysRemaining } = paceInfo as Required<DailyPaceInfo>
                const isLaggingBehind = currentPace < paceNeeded * 0.8

                return (
                  <p
                    className="text-xs m-0 mt-1.5"
                    style={{ color: isLaggingBehind ? '#E85D04' : 'var(--color-text-tertiary)' }}
                  >
                    Rythme actuel : {currentPace.toFixed(1)}/j · objectif : {paceNeeded.toFixed(1)}/j pour {daysRemaining}j restants
                  </p>
                )
              })()}

              {/* Correction du total mensuel — uniquement pour les indicateurs journaliers */}
              {allowSaleCorrection && !isMonthlyEntry && !isEditMode && currentUserColor && (
                <MonthlySaleCorrector
                  indicatorId={entry.indicatorId}
                  indicatorName={entry.indicatorName}
                  currentMonthlyTotal={entry.totalSales}
                  userColor={currentUserColor}
                  month={month}
                  year={year}
                  targetUserId={targetUserId}
                />
              )}

              {/* Formulaire de saisie pour les indicateurs mensuels */}
              {showMonthlyForm && currentUserColor && (
                <MonthlyIndicatorForm
                  indicatorId={entry.indicatorId}
                  indicatorName={entry.indicatorName}
                  monthlyTotal={entry.totalSales}
                  userColor={currentUserColor}
                  month={month}
                  year={year}
                  targetUserId={targetUserId}
                />
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

// ── Correction du total mensuel (indicateurs journaliers) ────────────────────

interface MonthlySaleCorrectorProps {
  indicatorId: string
  indicatorName: string
  currentMonthlyTotal: number
  userColor: string
  month: number
  year: number
  targetUserId?: string
}

function MonthlySaleCorrector({
  indicatorId,
  indicatorName,
  currentMonthlyTotal,
  userColor,
  month,
  year,
  targetUserId,
}: MonthlySaleCorrectorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { mutate: setMonthlyTotal, isPending } = useSetMonthlyAbsoluteTotal(month, year, true, targetUserId)

  function handleOpenEdit(): void {
    setInputValue(String(currentMonthlyTotal))
    setIsEditing(true)
  }

  function handleCancel(): void {
    setIsEditing(false)
    setInputValue('')
  }

  function handleSave(): void {
    const total = parseFloat(inputValue)
    if (isNaN(total) || total < 0) return

    setMonthlyTotal(
      { indicatorId, total },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  if (!isEditing) {
    return (
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label={`Corriger le total mensuel de ${indicatorName}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          Corriger
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-border-soft flex flex-col gap-2">
      <p className="text-xs text-text-tertiary m-0">
        Total du mois souhaité pour <span className="font-semibold text-text-primary">{indicatorName}</span>
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          step="any"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          className="w-20 text-sm font-bold text-center rounded-xl px-3 py-2 outline-none border-2 border-brand"
          style={{ color: userColor }}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave()
            if (event.key === 'Escape') handleCancel()
          }}
        />
        <button
          onClick={handleCancel}
          className="flex-1 py-2 rounded-xl text-xs font-bold text-text-secondary bg-surface"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex-[2] py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: userColor }}
        >
          {isPending ? '…' : 'OK'}
        </button>
      </div>
    </div>
  )
}

// ── Formulaire pour indicateurs mensuels ─────────────────────────────────────

interface MonthlyIndicatorFormProps {
  indicatorId: string
  indicatorName: string
  monthlyTotal: number
  userColor: string
  month: number
  year: number
  targetUserId?: string
}

function MonthlyIndicatorForm({
  indicatorId,
  indicatorName,
  monthlyTotal,
  userColor,
  month,
  year,
  targetUserId,
}: MonthlyIndicatorFormProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const { mutate: setMonthlyTotal, isPending } = useSetMonthlyAbsoluteTotal(month, year, false, targetUserId)

  function handleOpenEdit(): void {
    setInputValue(String(monthlyTotal))
    setIsEditing(true)
  }

  function handleCancel(): void {
    setIsEditing(false)
    setInputValue('')
  }

  function handleSave(): void {
    const total = parseFloat(inputValue)
    if (isNaN(total) || total < 0) return
    setMonthlyTotal(
      { indicatorId, total },
      { onSuccess: () => setIsEditing(false) },
    )
  }

  if (!isEditing) {
    return (
      <div className="mt-2 flex justify-end">
        <button
          onClick={handleOpenEdit}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary hover:text-text-secondary transition-colors"
          aria-label={`Saisir la valeur mensuelle de ${indicatorName}`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
          {monthlyTotal > 0 ? 'Modifier' : 'Saisir'}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-3 pt-3 border-t border-border-soft flex items-center gap-2">
      <input
        type="number"
        min={0}
        step="any"
        value={inputValue}
        onChange={(event) => setInputValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') handleSave()
          if (event.key === 'Escape') handleCancel()
        }}
        className="flex-1 text-sm font-bold text-center rounded-xl px-3 py-2 outline-none border border-border-soft focus:border-brand"
        style={{ color: userColor }}
        autoFocus
      />
      <button
        onClick={handleCancel}
        className="shrink-0 py-2 px-3 rounded-xl text-xs font-bold text-text-secondary bg-surface"
      >
        ✕
      </button>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="shrink-0 py-2 px-4 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-opacity"
        style={{ background: userColor }}
      >
        {isPending ? '…' : 'OK'}
      </button>
    </div>
  )
}
