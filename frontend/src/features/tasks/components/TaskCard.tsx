import { useState } from 'react'
import { Task } from '../../../types/task.types'
import { UserRole } from '../../../types/auth.types'
import { useTakeTask, useCompleteTask, useReleaseTask, useDeleteTask } from '../hooks/useTasks'

interface TaskCardProps {
  task: Task
  currentUserId: string
  currentUserRole: UserRole
}

export default function TaskCard({ task, currentUserId, currentUserRole }: TaskCardProps) {
  const { mutate: takeTask, isPending: isTaking } = useTakeTask()
  const { mutate: completeTask, isPending: isCompleting } = useCompleteTask()
  const { mutate: releaseTask, isPending: isReleasing } = useReleaseTask()
  const { mutate: deleteTask, isPending: isDeleting } = useDeleteTask()
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const isAdmin = currentUserRole === 'admin'
  const isAssignedToCurrentUser = task.assignee?.id === currentUserId
  const canActOnDoingTask = task.status === 'doing' && (isAssignedToCurrentUser || isAdmin)
  const showDueDate = task.dueDate !== null && task.status !== 'done'

  function handleConfirmDelete(): void {
    deleteTask(task.id)
    setConfirmingDelete(false)
  }

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex flex-col gap-3 ${task.status === 'done' ? 'opacity-75' : ''}`}>

      {/* Titre + bouton suppression (admin, tâches non terminées) */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-text-primary leading-snug flex-1 m-0">
          {task.title}
        </p>
        {isAdmin && task.status !== 'done' && (
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
                aria-label="Annuler la suppression"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-[#FDF2F2] hover:text-danger transition-colors"
              aria-label="Supprimer la tâche"
            >
              <TrashIcon />
            </button>
          )
        )}
      </div>

      {/* Date limite (tâches todo et doing uniquement) */}
      {showDueDate && <DueDateBadge dueDate={task.dueDate as string} />}

      {/* Bas de carte selon le statut */}
      {task.status === 'todo' && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-text-tertiary bg-surface px-2.5 py-1 rounded-full">
            Non attribuée
          </span>
          <button
            onClick={() => takeTask(task.id)}
            disabled={isTaking}
            className="text-xs font-bold text-white bg-brand px-4 py-2 rounded-xl shadow-[0_4px_10px_rgba(255,121,0,0.35)] disabled:opacity-50"
          >
            {isTaking ? '…' : 'Prendre →'}
          </button>
        </div>
      )}

      {task.status === 'doing' && (
        <div className="flex items-center justify-between gap-2">
          <AssigneeChip assignee={task.assignee} />
          {canActOnDoingTask && (
            <div className="flex items-center gap-2 shrink-0">
              {/* Remettre dans À faire */}
              <button
                onClick={() => releaseTask(task.id)}
                disabled={isReleasing}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface text-text-secondary hover:bg-canvas transition-colors disabled:opacity-40"
                aria-label="Remettre la tâche dans À faire"
              >
                <UndoIcon />
              </button>
              {/* Marquer comme terminée */}
              <button
                onClick={() => completeTask(task.id)}
                disabled={isCompleting}
                className="text-xs font-bold text-white bg-[#22A650] px-4 py-2 rounded-xl shadow-[0_4px_10px_rgba(34,166,80,0.35)] disabled:opacity-50"
              >
                {isCompleting ? '…' : '✓ Terminer'}
              </button>
            </div>
          )}
        </div>
      )}

      {task.status === 'done' && (
        <div className="flex items-center justify-between gap-2">
          <AssigneeChip assignee={task.assignee} />
          <span className="text-xs font-semibold text-text-tertiary shrink-0">
            ✓ {formatDoneTime(task.doneAt)}
          </span>
        </div>
      )}
    </div>
  )
}

function AssigneeChip({ assignee }: { assignee: Task['assignee'] }) {
  if (!assignee) return null
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: assignee.color }} />
      <span className="text-xs font-semibold text-text-secondary truncate">
        {assignee.name}
      </span>
    </div>
  )
}

function formatDoneTime(doneAt: string | null): string {
  if (!doneAt) return 'Fait'
  return new Date(doneAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

type DueDateStatus = 'overdue' | 'urgent' | 'normal'

function getDueDateStatus(dueDate: string): DueDateStatus {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)
  const msPerDay = 1000 * 60 * 60 * 24
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / msPerDay)

  if (daysUntilDue < 0) return 'overdue'
  if (daysUntilDue < 2) return 'urgent'
  return 'normal'
}

function formatDueDate(dueDate: string): string {
  const due = new Date(dueDate)
  const currentYear = new Date().getFullYear()
  const options: Intl.DateTimeFormatOptions =
    due.getFullYear() === currentYear
      ? { day: 'numeric', month: 'long' }
      : { day: 'numeric', month: 'long', year: 'numeric' }
  return due.toLocaleDateString('fr-FR', options)
}

const DUE_DATE_STYLES: Record<DueDateStatus, string> = {
  overdue: 'text-danger',
  urgent: 'text-[#E07A00]',
  normal: 'text-text-tertiary',
}

function DueDateBadge({ dueDate }: { dueDate: string }) {
  const status = getDueDateStatus(dueDate)
  const colorClass = DUE_DATE_STYLES[status]
  const label =
    status === 'overdue'
      ? '⚠ En retard'
      : `Échéance le ${formatDueDate(dueDate)}`

  return (
    <p className={`text-xs font-semibold m-0 ${colorClass}`}>
      {label}
    </p>
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

function UndoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7v6h6" />
      <path d="M3 13C5 8 9.5 5 15 5a9 9 0 0 1 6 15" />
    </svg>
  )
}
