import { useState } from 'react'
import { getLocalDateString } from '../../../lib/date'
import { useRecurringTasks, useCompleteRecurringTask, useUncompleteRecurringTask } from '../hooks/useRecurringTasks'
import { RecurringTaskWithCompletion } from '../../../types/recurring-task.types'
import { Skeleton } from '../../../components/ui/Skeleton'

// Nombre maximum de jours en arrière pour la navigation dans la checklist
const MAX_DAYS_BACK = 30

interface DailyChecklistSectionProps {
  currentUserRole: string
}

// ─── Helpers de date ──────────────────────────────────────────────────────────

function addDaysToDate(baseDate: Date, daysDelta: number): Date {
  const result = new Date(baseDate)
  result.setDate(result.getDate() + daysDelta)
  return result
}

function formatDateForDisplay(date: Date): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  // "jeudi 3 juillet" → "Jeudi 3 juillet"
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatCompletionTime(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(isoString))
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function DailyChecklistSection({ currentUserRole }: DailyChecklistSectionProps) {
  const todayDate = new Date()
  const todayDateString = getLocalDateString(todayDate)
  const [selectedDate, setSelectedDate] = useState<Date>(todayDate)

  const selectedDateString = getLocalDateString(selectedDate)
  const isViewingToday = selectedDateString === todayDateString
  const isAdmin = currentUserRole === 'admin'

  const { data: tasks = [], isLoading } = useRecurringTasks(selectedDateString)
  const { mutate: completeTask, isPending: isCompleting } = useCompleteRecurringTask(selectedDateString)
  const { mutate: uncompleteTask, isPending: isUncompleting } = useUncompleteRecurringTask(selectedDateString)

  const completedCount = tasks.filter((task) => task.completion !== null).length

  // La date la plus ancienne autorisée pour la navigation arrière
  const oldestAllowedDate = addDaysToDate(todayDate, -MAX_DAYS_BACK)
  const canGoBack = selectedDate > oldestAllowedDate
  const canGoForward = !isViewingToday

  function handleGoToPreviousDay(): void {
    setSelectedDate((currentDate) => addDaysToDate(currentDate, -1))
  }

  function handleGoToNextDay(): void {
    setSelectedDate((currentDate) => addDaysToDate(currentDate, +1))
  }

  function handleCompleteTask(taskId: string): void {
    completeTask(taskId)
  }

  function handleUncompleteTask(taskId: string): void {
    uncompleteTask(taskId)
  }

  const isMutating = isCompleting || isUncompleting

  return (
    <div className="px-5 pt-4 pb-2">
      {/* En-tête : titre, compteur, navigateur de date */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-text-primary m-0">Checklist du jour</h2>
          {!isLoading && tasks.length > 0 && (
            <span className="text-xs font-semibold text-text-tertiary bg-surface px-2 py-0.5 rounded-full">
              {completedCount}/{tasks.length}
            </span>
          )}
        </div>

        {/* Navigateur de date */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleGoToPreviousDay}
            disabled={!canGoBack}
            className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Jour précédent"
          >
            <ChevronLeftIcon />
          </button>
          <span className="text-xs font-semibold text-text-secondary min-w-[100px] text-center">
            {isViewingToday ? "Aujourd'hui" : formatDateForDisplay(selectedDate)}
          </span>
          <button
            onClick={handleGoToNextDay}
            disabled={!canGoForward}
            className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center text-text-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Jour suivant"
          >
            <ChevronRightIcon />
          </button>
        </div>
      </div>

      {/* Skeleton pendant le chargement */}
      {isLoading && <Skeleton className="h-[360px] w-full rounded-2xl" />}

      {/* Toutes les tâches dans une seule carte compacte */}
      {!isLoading && tasks.length > 0 && (
        <div
          className="rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] overflow-hidden"
          style={{ background: 'var(--color-card)' }}
        >
          {tasks.map((task, index) => (
            <CompactChecklistRow
              key={task.id}
              task={task}
              isLastRow={index === tasks.length - 1}
              isViewingToday={isViewingToday}
              isAdmin={isAdmin}
              isMutationPending={isMutating}
              onComplete={handleCompleteTask}
              onUncomplete={handleUncompleteTask}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Ligne de tâche compacte (dans la carte unique) ──────────────────────────

interface CompactChecklistRowProps {
  task: RecurringTaskWithCompletion
  isLastRow: boolean
  isViewingToday: boolean
  isAdmin: boolean
  isMutationPending: boolean
  onComplete: (taskId: string) => void
  onUncomplete: (taskId: string) => void
}

function CompactChecklistRow({
  task,
  isLastRow,
  isViewingToday,
  isAdmin,
  isMutationPending,
  onComplete,
  onUncomplete,
}: CompactChecklistRowProps) {
  const isCompleted = task.completion !== null

  // Une tâche est cochable uniquement si on consulte aujourd'hui et qu'elle n'est pas déjà cochée
  const canComplete = isViewingToday && !isCompleted && !isMutationPending

  // Un admin peut décocher uniquement sur la vue d'aujourd'hui
  const canUncomplete = isViewingToday && isAdmin && isCompleted && !isMutationPending

  return (
    <div
      className={`group flex items-center gap-2.5 px-3 ${!isLastRow ? 'border-b border-border-soft' : ''}`}
      style={{
        minHeight: 40,
        // Fond légèrement teinté vert pour les tâches cochées
        backgroundColor: isCompleted ? 'rgba(34,166,80,0.06)' : 'transparent',
      }}
    >
      {/* Icône cochée/non-cochée (18px) */}
      <button
        onClick={() => canComplete && onComplete(task.id)}
        disabled={!canComplete}
        className="shrink-0 rounded-full border-2 flex items-center justify-center transition-colors"
        style={{
          width: 18,
          height: 18,
          borderColor: isCompleted ? '#22A650' : 'var(--color-border-soft)',
          backgroundColor: isCompleted ? '#22A650' : 'transparent',
          cursor: canComplete ? 'pointer' : 'default',
        }}
        aria-label={isCompleted ? 'Tâche cochée' : 'Cocher la tâche'}
      >
        {isCompleted && <SmallCheckmarkIcon />}
      </button>

      {/* Titre — barré si cochée */}
      <span
        className="flex-1 min-w-0 text-sm font-semibold leading-tight truncate"
        style={{
          color: isCompleted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {/* Info de complétion (bulle couleur + prénom + heure), alignée à droite */}
      {isCompleted && task.completion && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: task.completion.userColor }}
          />
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {task.completion.userName} · {formatCompletionTime(task.completion.completedAt)}
          </span>
        </div>
      )}

      {/* Bouton décocher — admin uniquement.
          Mobile : toujours visible.
          Desktop (md+) : masqué, révélé au survol de la ligne via group-hover. */}
      {canUncomplete && (
        <button
          onClick={() => onUncomplete(task.id)}
          className="shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-text-tertiary opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-text-secondary"
          aria-label="Décocher la tâche"
        >
          <CrossIcon />
        </button>
      )}
    </div>
  )
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

function SmallCheckmarkIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function CrossIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}
