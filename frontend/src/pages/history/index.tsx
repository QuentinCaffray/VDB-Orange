import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MonthCalendar from '../../components/ui/MonthCalendar'
import {
  useTaskHistory,
  useActiveDates,
  useTasks,
  useAdminCompleteTask,
  useAdminCreateCompletedTask,
  useDeleteHistoryTask,
} from '../../features/tasks/hooks/useTasks'
import { useAllUsers } from '../../features/users/hooks/useUsers'
import { useRecurringTasks } from '../../features/recurring-tasks/hooks/useRecurringTasks'
import { useAuthContext } from '../../context/AuthContext'
import { Task } from '../../types/task.types'
import { RecurringTaskWithCompletion } from '../../types/recurring-task.types'
import { UserSummary } from '../../features/users/api'

function formatSelectedDateLabel(dateString: string, taskCount: number): string {
  const date = new Date(dateString + 'T12:00:00')
  const label = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(date)
  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)
  const taskLabel = taskCount === 0 ? 'Aucune tâche' : `${taskCount} tâche${taskCount > 1 ? 's' : ''}`
  return `${capitalizedLabel} · ${taskLabel}`
}

function formatDoneTime(doneAt: string | null): string {
  if (!doneAt) return ''
  return new Date(doneAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { currentUser } = useAuthContext()
  const isAdmin = currentUser?.role === 'admin'

  const today = new Date()
  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0])
  const [isEditMode, setIsEditMode] = useState(false)

  const { data: activeDates = [] } = useActiveDates(calendarMonth, calendarYear)
  const { data: historyTasks = [], isLoading: isLoadingHistory } = useTaskHistory(selectedDate)
  const { data: allTasks = [] } = useTasks()
  const { data: allUsers = [] } = useAllUsers()
  const { data: checklistTasks = [], isLoading: isLoadingChecklist } = useRecurringTasks(selectedDate)
  const adminCompleteTask = useAdminCompleteTask(selectedDate)
  const adminCreateCompletedTask = useAdminCreateCompletedTask(selectedDate)
  const deleteHistoryTask = useDeleteHistoryTask(selectedDate)

  const openTasks = allTasks.filter((task) => task.status !== 'done')
  const vendorUsers = allUsers.filter((user) => !user.isFirstLogin)

  function handleNavigateMonth(direction: 'prev' | 'next'): void {
    if (direction === 'prev') {
      if (calendarMonth === 1) {
        setCalendarMonth(12)
        setCalendarYear((y) => y - 1)
      } else {
        setCalendarMonth((m) => m - 1)
      }
    } else {
      if (calendarMonth === 12) {
        setCalendarMonth(1)
        setCalendarYear((y) => y + 1)
      } else {
        setCalendarMonth((m) => m + 1)
      }
    }
  }

  return (
    <div className="min-h-full">

      {/* Header */}
      <div className="sticky top-0 z-10 bg-app-bg px-5 pt-12 pb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
            Historique
          </h1>
          <p className="text-sm text-text-secondary mt-0.5 m-0">
            Ce qui a été fait, et quand
          </p>
        </div>
        <div className="flex items-center gap-2 pt-1">
          {isAdmin ? (
            <button
              onClick={() => setIsEditMode((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors"
              style={{
                background: isEditMode ? 'var(--color-brand)' : 'var(--color-surface)',
                color: isEditMode ? '#fff' : 'var(--color-text-secondary)',
              }}
            >
              {isEditMode ? <PencilIcon /> : <LockIcon />}
              {isEditMode ? 'Édition' : 'Lecture'}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-full">
              <LockIcon />
              <span className="text-xs font-bold text-text-secondary">Lecture</span>
            </div>
          )}
          <button
            onClick={() => navigate('/tasks')}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface text-text-secondary"
            aria-label="Retour aux tâches"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Calendrier */}
      <div className="px-5 pb-4">
        <MonthCalendar
          year={calendarYear}
          month={calendarMonth}
          activeDates={activeDates}
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          onNavigateMonth={handleNavigateMonth}
        />
      </div>

      {/* Mode édition */}
      {isEditMode && (
        <div className="px-5 pb-6">

          {/* Créer une nouvelle tâche rétroactive */}
          <p className="text-sm font-bold text-text-primary mb-3 m-0">Créer une tâche</p>
          <CreateRetroactiveTaskForm
            users={vendorUsers}
            isPending={adminCreateCompletedTask.isPending}
            onSubmit={(title, targetUserId) =>
              adminCreateCompletedTask.mutate({ title, targetUserId })
            }
          />

          {/* Tâches existantes à attribuer */}
          {openTasks.length > 0 && (
            <>
              <p className="text-sm font-bold text-text-primary mt-5 mb-1 m-0">Tâches existantes à attribuer</p>
              <p className="text-xs text-text-secondary mb-3 m-0">
                Attribuez une tâche déjà créée à un vendeur pour la date sélectionnée.
              </p>
              <div className="flex flex-col gap-3">
                {openTasks.map((task) => (
                  <EditableTaskCard
                    key={task.id}
                    task={task}
                    users={vendorUsers}
                    isPending={adminCompleteTask.isPending}
                    onComplete={(targetUserId) =>
                      adminCompleteTask.mutate({ taskId: task.id, targetUserId })
                    }
                  />
                ))}
              </div>
            </>
          )}

          <div className="mt-6 h-px bg-border-soft" />
        </div>
      )}

      {/* Tâches terminées du jour sélectionné */}
      <div className="px-5 pb-10">
        <p className="text-sm font-bold text-text-primary mb-3 m-0">
          {formatSelectedDateLabel(selectedDate, historyTasks.length)}
        </p>

        {isLoadingHistory && (
          <p className="text-sm text-text-tertiary text-center py-6 m-0">Chargement…</p>
        )}

        {!isLoadingHistory && historyTasks.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8 m-0">
            Aucune tâche terminée ce jour-là
          </p>
        )}

        <div className="flex flex-col gap-3">
          {historyTasks.map((task) => (
            <HistoryTaskCard
              key={task.id}
              task={task}
              onDelete={isAdmin && isEditMode ? () => deleteHistoryTask.mutate(task.id) : undefined}
              isDeleting={deleteHistoryTask.isPending}
            />
          ))}
        </div>
      </div>

      {/* Checklist récurrente du jour sélectionné — lecture seule */}
      <HistoryChecklistSection
        tasks={checklistTasks}
        isLoading={isLoadingChecklist}
      />
    </div>
  )
}

// ── Formulaire de création rétroactive ────────────────────────────────────────

interface CreateRetroactiveTaskFormProps {
  users: UserSummary[]
  isPending: boolean
  onSubmit: (title: string, targetUserId: string) => void
}

function CreateRetroactiveTaskForm({ users, isPending, onSubmit }: CreateRetroactiveTaskFormProps) {
  const defaultUserId = users[0]?.id ?? ''
  const [taskTitle, setTaskTitle] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string>(defaultUserId)

  function handleSubmit(): void {
    const trimmedTitle = taskTitle.trim()
    if (!trimmedTitle || !selectedUserId) return
    onSubmit(trimmedTitle, selectedUserId)
    setTaskTitle('')
  }

  const isSubmitDisabled = isPending || taskTitle.trim().length === 0 || !selectedUserId

  return (
    <div className="bg-white rounded-2xl px-4 py-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
      <input
        type="text"
        placeholder="Titre de la tâche…"
        value={taskTitle}
        onChange={(e) => setTaskTitle(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        className="w-full text-sm rounded-xl px-3 py-2.5 border border-border bg-surface text-text-primary placeholder:text-text-tertiary mb-2.5"
      />
      <div className="flex items-center gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 text-sm rounded-xl px-3 py-2 border border-border bg-surface text-text-primary"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: 'var(--color-brand)' }}
        >
          Créer
        </button>
      </div>
    </div>
  )
}

// ── Carte tâche existante en mode édition ─────────────────────────────────────

interface EditableTaskCardProps {
  task: Task
  users: UserSummary[]
  isPending: boolean
  onComplete: (userId: string) => void
}

function EditableTaskCard({ task, users, isPending, onComplete }: EditableTaskCardProps) {
  const defaultUserId = task.assignee?.id ?? (users[0]?.id ?? '')
  const [selectedUserId, setSelectedUserId] = useState<string>(defaultUserId)

  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.05)]">
      <p className="text-sm font-semibold text-text-primary m-0 mb-2">{task.title}</p>
      <div className="flex items-center gap-2">
        <select
          value={selectedUserId}
          onChange={(e) => setSelectedUserId(e.target.value)}
          className="flex-1 text-sm rounded-xl px-3 py-2 border border-border bg-surface text-text-primary"
        >
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => onComplete(selectedUserId)}
          disabled={isPending || !selectedUserId}
          className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50"
          style={{ background: 'var(--color-success)' }}
        >
          ✓ Terminer
        </button>
      </div>
    </div>
  )
}

// ── Carte tâche en lecture (+ suppression admin en mode édition) ──────────────

interface HistoryTaskCardProps {
  task: Task
  onDelete?: () => void
  isDeleting?: boolean
}

function HistoryTaskCard({ task, onDelete, isDeleting }: HistoryTaskCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  function handleConfirmDelete(): void {
    onDelete?.()
    setConfirmingDelete(false)
  }

  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-success-tint flex items-center justify-center shrink-0">
        <CheckIcon />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary m-0 truncate">{task.title}</p>
        {task.assignee && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: task.assignee.color }} />
            <span className="text-xs text-text-secondary">
              {task.assignee.name} · {formatDoneTime(task.doneAt)}
            </span>
          </div>
        )}
      </div>
      {onDelete && (
        confirmingDelete ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="text-[11px] font-bold px-2 py-1 rounded-lg text-white bg-danger disabled:opacity-40"
              aria-label="Confirmer la suppression"
            >
              Suppr. ?
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="w-6 h-6 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
              aria-label="Annuler"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-[#FDF2F2] hover:text-danger transition-colors"
            aria-label="Supprimer la tâche de l'historique"
          >
            <TrashIcon />
          </button>
        )
      )}
    </div>
  )
}

// ── Checklist récurrente en lecture seule ─────────────────────────────────────

interface HistoryChecklistSectionProps {
  tasks: RecurringTaskWithCompletion[]
  isLoading: boolean
}

function formatChecklistCompletionTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function HistoryChecklistSection({ tasks, isLoading }: HistoryChecklistSectionProps) {
  if (isLoading) return null

  const completedCount = tasks.filter((task) => task.completion !== null).length

  return (
    <div className="px-5 pb-10">
      <p className="text-sm font-bold text-text-primary mb-3 m-0">
        Checklist · {completedCount}/{tasks.length} faites
      </p>

      {completedCount === 0 ? (
        <p className="text-sm text-text-secondary text-center py-8 m-0">
          Aucune tâche effectuée ce jour-là
        </p>
      ) : (
        <div
          className="rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] overflow-hidden"
          style={{ background: 'var(--color-card)' }}
        >
          {tasks.map((task, index) => (
            <HistoryChecklistRow
              key={task.id}
              task={task}
              isLastRow={index === tasks.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface HistoryChecklistRowProps {
  task: RecurringTaskWithCompletion
  isLastRow: boolean
}

function HistoryChecklistRow({ task, isLastRow }: HistoryChecklistRowProps) {
  const isCompleted = task.completion !== null

  return (
    <div
      className={`flex items-center gap-2.5 px-3 ${!isLastRow ? 'border-b border-border-soft' : ''}`}
      style={{
        minHeight: 40,
        backgroundColor: isCompleted ? 'rgba(34,166,80,0.06)' : 'transparent',
      }}
    >
      {/* Icône cochée/non-cochée (18px) — non interactive */}
      <div
        className="shrink-0 rounded-full border-2 flex items-center justify-center"
        style={{
          width: 18,
          height: 18,
          borderColor: isCompleted ? '#22A650' : 'var(--color-border-soft)',
          backgroundColor: isCompleted ? '#22A650' : 'transparent',
        }}
        aria-label={isCompleted ? 'Tâche cochée' : 'Tâche non cochée'}
      >
        {isCompleted && (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </div>

      {/* Titre */}
      <span
        className="flex-1 min-w-0 text-sm font-semibold leading-tight truncate"
        style={{
          color: isCompleted ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {/* Info de complétion à droite */}
      {isCompleted && task.completion && (
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: task.completion.userColor }}
          />
          <span className="text-xs text-text-tertiary whitespace-nowrap">
            {task.completion.userName} · {formatChecklistCompletionTime(task.completion.completedAt)}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22A650" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  )
}
