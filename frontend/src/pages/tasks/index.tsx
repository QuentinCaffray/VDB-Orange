import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../../context/AuthContext'
import { useTasks } from '../../features/tasks/hooks/useTasks'
import TaskCard from '../../features/tasks/components/TaskCard'
import CreateTaskSheet from '../../features/tasks/components/CreateTaskSheet'
import { Skeleton } from '../../components/ui/Skeleton'
import { TaskStatus, Task, TaskAssignee } from '../../types/task.types'
import { getLocalDateString } from '../../lib/date'

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'À faire',
  doing: 'En cours',
  done: 'Fait',
}

function formatTodayDate(): string {
  const formatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
  // Capitalise la première lettre : "lundi 23 juin" → "Lundi 23 juin"
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

const TODAY_DATE_STRING = getLocalDateString()

function isCompletedToday(task: Task): boolean {
  if (!task.doneAt) return false
  // doneAt est en UTC (ISO string) — on convertit en heure locale avant de comparer
  return getLocalDateString(new Date(task.doneAt)) === TODAY_DATE_STRING
}

function countTasksByStatus(tasks: Task[]): Record<TaskStatus, number> {
  return {
    todo: tasks.filter((task) => task.status === 'todo').length,
    doing: tasks.filter((task) => task.status === 'doing').length,
    done: tasks.filter(isCompletedToday).length,
  }
}

export default function TasksPage() {
  const { currentUser } = useAuthContext()
  const { data: allTasks = [], isLoading } = useTasks()
  const [activeTab, setActiveTab] = useState<TaskStatus>('todo')
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false)
  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null)

  const navigate = useNavigate()
  const taskCounts = countTasksByStatus(allTasks)

  const assigneesInActiveTasks = useMemo<TaskAssignee[]>(() => {
    const activeTasks = allTasks.filter(
      (task) => task.status === 'todo' || task.status === 'doing',
    )
    const assigneeMap = new Map<string, TaskAssignee>()
    for (const task of activeTasks) {
      if (task.assignee && !assigneeMap.has(task.assignee.id)) {
        assigneeMap.set(task.assignee.id, task.assignee)
      }
    }
    return Array.from(assigneeMap.values())
  }, [allTasks])

  const tasksMatchingActiveTab = allTasks.filter(
    (task) => task.status === activeTab && (task.status !== 'done' || isCompletedToday(task)),
  )

  const visibleTasks = tasksMatchingActiveTab.filter((task) => {
    if (filterAssigneeId === null) return true
    return task.assignee?.id === filterAssigneeId
  })

  function handleTabChange(newStatus: TaskStatus): void {
    setActiveTab(newStatus)
    setFilterAssigneeId(null)
  }

  if (!currentUser) return null

  return (
    <div className="min-h-full">

      {/* Header + onglets — sticky dans le scroll du main */}
      <div className="sticky top-0 z-10 bg-app-bg">

        {/* Header */}
        <div className="px-5 pt-12 pb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
              Tâches
            </h1>
            <p className="text-sm text-text-secondary mt-0.5 m-0">
              {formatTodayDate()}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 pt-1">
            {/* Calendrier — historique */}
            <button
              onClick={() => navigate('/history')}
              className="w-10 h-10 rounded-2xl bg-surface flex items-center justify-center text-text-secondary"
              aria-label="Voir l'historique"
            >
              <CalendarIcon />
            </button>
            {/* Nouvelle tâche — tous les utilisateurs connectés */}
            <button
              onClick={() => setIsCreateSheetOpen(true)}
              className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center shadow-[0_4px_12px_rgba(255,121,0,0.35)]"
              aria-label="Créer une tâche"
            >
              <PlusIcon />
            </button>
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-border-soft px-5 gap-1">
          {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => handleTabChange(status)}
              className={`pb-3 px-2 text-sm font-bold transition-colors relative ${
                activeTab === status ? 'text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {STATUS_LABELS[status]}
              <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full bg-surface text-text-tertiary">
                {taskCounts[status]}
              </span>
              {activeTab === status && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-text-primary rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Chips de filtre par assigné (uniquement si au moins 1 assigné dans les tâches actives) */}
        {assigneesInActiveTasks.length > 0 && (
          <div className="flex items-center gap-2 px-5 py-3 overflow-x-auto">
            <AssigneeFilterChip
              label="Tous"
              isActive={filterAssigneeId === null}
              onPress={() => setFilterAssigneeId(null)}
            />
            {assigneesInActiveTasks.map((assignee) => (
              <AssigneeFilterChip
                key={assignee.id}
                label={assignee.name}
                avatarColor={assignee.color}
                isActive={filterAssigneeId === assignee.id}
                onPress={() => setFilterAssigneeId(assignee.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Liste des tâches */}
      <div className="px-5 py-4 flex flex-col gap-3">
        {isLoading && (
          <>
            <Skeleton className="h-[88px] w-full" />
            <Skeleton className="h-[88px] w-full" />
            <Skeleton className="h-[88px] w-full" />
          </>
        )}

        {!isLoading && visibleTasks.length === 0 && (
          <p className="text-sm font-semibold text-text-secondary text-center py-16 m-0">
            {activeTab === 'todo' && 'Aucune tâche en attente 🎉'}
            {activeTab === 'doing' && 'Aucune tâche en cours'}
            {activeTab === 'done' && "Aucune tâche terminée"}
          </p>
        )}

        {visibleTasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            currentUserId={currentUser.id}
            currentUserRole={currentUser.role}
          />
        ))}
      </div>

      {/* Bottom sheet création */}
      <CreateTaskSheet
        isOpen={isCreateSheetOpen}
        onClose={() => setIsCreateSheetOpen(false)}
      />
    </div>
  )
}

interface AssigneeFilterChipProps {
  label: string
  isActive: boolean
  onPress: () => void
  avatarColor?: string
}

function AssigneeFilterChip({ label, isActive, onPress, avatarColor }: AssigneeFilterChipProps) {
  return (
    <button
      onClick={onPress}
      className={`flex items-center gap-1.5 px-3 h-7 rounded-full text-xs font-semibold shrink-0 transition-colors ${
        isActive
          ? 'bg-brand-tint text-brand'
          : 'bg-surface text-text-secondary'
      }`}
    >
      {avatarColor && (
        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: avatarColor }} />
      )}
      {label}
    </button>
  )
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}
