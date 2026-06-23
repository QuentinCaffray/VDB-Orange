import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MonthCalendar from '../../components/ui/MonthCalendar'
import { useTaskHistory, useActiveDates } from '../../features/tasks/hooks/useTasks'
import { Task } from '../../types/task.types'

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
  const today = new Date()

  const [calendarYear, setCalendarYear] = useState(today.getFullYear())
  const [calendarMonth, setCalendarMonth] = useState(today.getMonth() + 1)
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0])

  const { data: activeDates = [] } = useActiveDates(calendarMonth, calendarYear)
  const { data: historyTasks = [], isLoading: isLoadingTasks } = useTaskHistory(selectedDate)

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
          {/* Chip lecture seule */}
          <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-full">
            <LockIcon />
            <span className="text-xs font-bold text-text-secondary">Lecture</span>
          </div>
          {/* Retour */}
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

      {/* Tâches du jour sélectionné */}
      <div className="px-5 pb-10">
        <p className="text-sm font-bold text-text-primary mb-3">
          {formatSelectedDateLabel(selectedDate, historyTasks.length)}
        </p>

        {isLoadingTasks && (
          <p className="text-sm text-text-tertiary text-center py-6 m-0">Chargement…</p>
        )}

        {!isLoadingTasks && historyTasks.length === 0 && (
          <p className="text-sm text-text-secondary text-center py-8 m-0">
            Aucune tâche terminée ce jour-là
          </p>
        )}

        <div className="flex flex-col gap-3">
          {historyTasks.map((task) => (
            <HistoryTaskCard key={task.id} task={task} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HistoryTaskCard({ task }: { task: Task }) {
  return (
    <div className="bg-white rounded-2xl px-4 py-3.5 shadow-[0_4px_14px_rgba(0,0,0,0.05)] flex items-center gap-3">
      {/* Icône check verte */}
      <div className="w-8 h-8 rounded-full bg-success-tint flex items-center justify-center shrink-0">
        <CheckIcon />
      </div>

      {/* Infos tâche */}
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
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
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
