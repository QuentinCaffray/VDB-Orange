import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useAdminRecurringTasks,
  useCreateAdminRecurringTask,
  useUpdateAdminRecurringTask,
  useDeleteAdminRecurringTask,
  useReorderAdminRecurringTasks,
} from '../../../features/recurring-tasks/hooks/useAdminRecurringTasks'
import { RecurringTaskAdminItem } from '../../../types/recurring-task.types'

export default function AdminRecurringTasksPage() {
  const navigate = useNavigate()
  const { data: tasks = [], isLoading } = useAdminRecurringTasks()
  const { mutate: createTask, isPending: isCreating } = useCreateAdminRecurringTask()
  const { mutate: updateTask, isPending: isUpdating } = useUpdateAdminRecurringTask()
  const { mutate: deleteTask } = useDeleteAdminRecurringTask()
  const { mutate: reorderTasks } = useReorderAdminRecurringTasks()

  const [newTaskTitle, setNewTaskTitle] = useState('')

  // Tâches actives triées par order, tâches inactives dans une section séparée
  const activeTasks = tasks
    .filter((task) => task.isActive)
    .sort((taskA, taskB) => taskA.order - taskB.order)
  const inactiveTasks = tasks
    .filter((task) => !task.isActive)
    .sort((taskA, taskB) => taskA.order - taskB.order)

  function handleAddTask(): void {
    const trimmedTitle = newTaskTitle.trim()
    if (!trimmedTitle) return
    createTask(trimmedTitle, {
      onSuccess: () => setNewTaskTitle(''),
    })
  }

  // Déplace une tâche active vers le haut (échange avec la précédente)
  function handleMoveTaskUp(taskId: string): void {
    const taskIndex = activeTasks.findIndex((task) => task.id === taskId)
    if (taskIndex <= 0) return

    const reorderedTasks = [...activeTasks]
    ;[reorderedTasks[taskIndex - 1], reorderedTasks[taskIndex]] = [
      reorderedTasks[taskIndex],
      reorderedTasks[taskIndex - 1],
    ]
    reorderTasks(reorderedTasks.map((task) => task.id))
  }

  // Déplace une tâche active vers le bas (échange avec la suivante)
  function handleMoveTaskDown(taskId: string): void {
    const taskIndex = activeTasks.findIndex((task) => task.id === taskId)
    if (taskIndex === -1 || taskIndex >= activeTasks.length - 1) return

    const reorderedTasks = [...activeTasks]
    ;[reorderedTasks[taskIndex], reorderedTasks[taskIndex + 1]] = [
      reorderedTasks[taskIndex + 1],
      reorderedTasks[taskIndex],
    ]
    reorderTasks(reorderedTasks.map((task) => task.id))
  }

  function handleToggleTaskActive(taskId: string, currentIsActive: boolean): void {
    updateTask({ taskId, data: { isActive: !currentIsActive } })
  }

  function handleUpdateTaskTitle(taskId: string, newTitle: string): void {
    updateTask({ taskId, data: { title: newTitle } })
  }

  function handleDeleteTask(taskId: string): void {
    deleteTask(taskId)
  }

  const totalTaskCount = tasks.length

  return (
    <div className="min-h-full">
      {/* Header sticky — même pattern que admin/users */}
      <div className="sticky top-0 z-10 bg-app-bg px-5 pt-12 pb-4 border-b border-border-soft">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 text-text-secondary mb-3"
          aria-label="Retour au profil"
        >
          <ChevronLeftIcon />
          <span className="text-sm font-semibold">Retour</span>
        </button>
        <h1 className="font-display text-[32px] font-semibold text-text-primary leading-tight m-0">
          Tâches récurrentes
        </h1>
        <p className="text-sm text-text-secondary mt-0.5 m-0">
          {isLoading
            ? 'Chargement…'
            : `${totalTaskCount} tâche${totalTaskCount > 1 ? 's' : ''}`}
        </p>
      </div>

      <div className="px-5 py-4 flex flex-col gap-6 pb-20">

        {/* Section tâches actives */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-bold tracking-widest uppercase text-text-tertiary m-0">
            Actives — {activeTasks.length}
          </p>

          {activeTasks.length === 0 && !isLoading ? (
            <p className="text-sm text-text-tertiary text-center py-4 m-0">
              Aucune tâche active
            </p>
          ) : (
            <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] overflow-hidden">
              {activeTasks.map((task, index) => (
                <AdminRecurringTaskRow
                  key={task.id}
                  task={task}
                  isLastRow={index === activeTasks.length - 1}
                  canMoveUp={index > 0}
                  canMoveDown={index < activeTasks.length - 1}
                  isPending={isUpdating}
                  onMoveUp={() => handleMoveTaskUp(task.id)}
                  onMoveDown={() => handleMoveTaskDown(task.id)}
                  onToggleActive={() => handleToggleTaskActive(task.id, task.isActive)}
                  onUpdateTitle={(newTitle) => handleUpdateTaskTitle(task.id, newTitle)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Formulaire d'ajout */}
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold tracking-widest uppercase text-text-tertiary m-0">
            Ajouter une tâche
          </p>
          <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] px-3 py-2.5 flex items-center gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(event) => setNewTaskTitle(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleAddTask()}
              placeholder="Titre de la nouvelle tâche…"
              className="flex-1 min-w-0 text-sm font-semibold outline-none"
              style={{ color: 'var(--color-text-primary)', background: 'transparent' }}
            />
            <button
              onClick={handleAddTask}
              disabled={isCreating || !newTaskTitle.trim()}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-xl text-white disabled:opacity-40"
              style={{ background: '#FF7900' }}
              aria-label="Ajouter la tâche"
            >
              {isCreating ? (
                <span className="text-xs font-bold">…</span>
              ) : (
                <PlusIcon />
              )}
            </button>
          </div>
        </div>

        {/* Section tâches inactives (masquées de la checklist) */}
        {inactiveTasks.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-widest uppercase text-text-tertiary m-0">
              Inactives — masquées de la checklist
            </p>
            <div className="bg-white rounded-2xl shadow-[0_4px_14px_rgba(0,0,0,0.05)] overflow-hidden opacity-70">
              {inactiveTasks.map((task, index) => (
                <AdminRecurringTaskRow
                  key={task.id}
                  task={task}
                  isLastRow={index === inactiveTasks.length - 1}
                  canMoveUp={false}
                  canMoveDown={false}
                  isPending={isUpdating}
                  onMoveUp={() => {/* pas de réordonnancement pour les inactives */}}
                  onMoveDown={() => {/* pas de réordonnancement pour les inactives */}}
                  onToggleActive={() => handleToggleTaskActive(task.id, task.isActive)}
                  onUpdateTitle={(newTitle) => handleUpdateTaskTitle(task.id, newTitle)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Ligne de tâche éditable ──────────────────────────────────────────────────

interface AdminRecurringTaskRowProps {
  task: RecurringTaskAdminItem
  isLastRow: boolean
  canMoveUp: boolean
  canMoveDown: boolean
  isPending: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onToggleActive: () => void
  onUpdateTitle: (title: string) => void
  onDelete: () => void
}

function AdminRecurringTaskRow({
  task,
  isLastRow,
  canMoveUp,
  canMoveDown,
  isPending,
  onMoveUp,
  onMoveDown,
  onToggleActive,
  onUpdateTitle,
  onDelete,
}: AdminRecurringTaskRowProps) {
  const [isTitleEditing, setIsTitleEditing] = useState(false)
  const [titleDraft, setTitleDraft] = useState(task.title)
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)

  // Synchronise le brouillon si le titre est mis à jour depuis le serveur
  useEffect(() => {
    if (!isTitleEditing) {
      setTitleDraft(task.title)
    }
  }, [task.title, isTitleEditing])

  function handleTitleSave(): void {
    const trimmedTitle = titleDraft.trim()
    if (!trimmedTitle) {
      // Titre vide : on annule et on restaure le titre original
      setTitleDraft(task.title)
      setIsTitleEditing(false)
      return
    }
    if (trimmedTitle !== task.title) {
      onUpdateTitle(trimmedTitle)
    }
    setIsTitleEditing(false)
  }

  function handleTitleKeyDown(event: React.KeyboardEvent<HTMLInputElement>): void {
    if (event.key === 'Enter') handleTitleSave()
    if (event.key === 'Escape') {
      setTitleDraft(task.title)
      setIsTitleEditing(false)
    }
  }

  function handleStartEditing(): void {
    setTitleDraft(task.title)
    setIsTitleEditing(true)
  }

  const showMoveButtons = task.isActive

  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 ${!isLastRow ? 'border-b border-border-soft' : ''}`}
      style={{ minHeight: 52 }}
    >
      {/* Boutons de réorganisation (↑↓) — uniquement pour les tâches actives */}
      {showMoveButtons ? (
        <div className="flex flex-col shrink-0">
          <button
            onClick={onMoveUp}
            disabled={!canMoveUp || isPending}
            className="w-6 h-6 flex items-center justify-center text-text-tertiary disabled:opacity-25 hover:text-text-secondary transition-colors"
            aria-label="Monter"
          >
            <ChevronUpSmallIcon />
          </button>
          <button
            onClick={onMoveDown}
            disabled={!canMoveDown || isPending}
            className="w-6 h-6 flex items-center justify-center text-text-tertiary disabled:opacity-25 hover:text-text-secondary transition-colors"
            aria-label="Descendre"
          >
            <ChevronDownSmallIcon />
          </button>
        </div>
      ) : (
        // Placeholder de largeur équivalente pour maintenir l'alignement
        <div className="w-6 shrink-0" />
      )}

      {/* Titre en lecture ou en édition inline */}
      {isTitleEditing ? (
        <input
          type="text"
          value={titleDraft}
          onChange={(event) => setTitleDraft(event.target.value)}
          onKeyDown={handleTitleKeyDown}
          onBlur={handleTitleSave}
          autoFocus
          className="flex-1 min-w-0 text-sm font-semibold px-2 py-1 rounded-lg border outline-none"
          style={{
            borderColor: 'var(--color-brand)',
            background: 'var(--color-surface)',
            color: 'var(--color-text-primary)',
          }}
        />
      ) : (
        <span
          className="flex-1 min-w-0 text-sm font-semibold leading-tight truncate"
          style={{
            color: task.isActive ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
          }}
        >
          {task.title}
        </span>
      )}

      {/* Chip actif/inactif — cliquable pour basculer */}
      <button
        onClick={onToggleActive}
        disabled={isPending}
        className="shrink-0 text-[11px] font-bold px-2 py-1 rounded-full disabled:opacity-50 transition-colors"
        style={{
          background: task.isActive ? 'rgba(34,166,80,0.10)' : 'var(--color-surface)',
          color: task.isActive ? '#22A650' : 'var(--color-text-tertiary)',
        }}
        aria-label={task.isActive ? 'Désactiver la tâche' : 'Activer la tâche'}
      >
        {task.isActive ? 'Actif' : 'Inactif'}
      </button>

      {/* Bouton d'édition du titre (crayon) */}
      {!isTitleEditing && (
        <button
          onClick={handleStartEditing}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-secondary hover:bg-surface transition-colors"
          aria-label="Modifier le titre"
        >
          <PencilSmallIcon />
        </button>
      )}

      {/* Bouton suppression avec confirmation inline */}
      {isConfirmingDelete ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => { onDelete(); setIsConfirmingDelete(false) }}
            className="text-[11px] font-bold px-2 py-1 rounded-lg text-white"
            style={{ background: 'var(--color-danger)' }}
            aria-label="Confirmer la suppression"
          >
            Suppr. ?
          </button>
          <button
            onClick={() => setIsConfirmingDelete(false)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-text-tertiary hover:text-text-primary transition-colors"
            aria-label="Annuler"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsConfirmingDelete(true)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg text-text-tertiary hover:bg-[#FDF2F2] hover:text-danger transition-colors"
          aria-label="Supprimer la tâche"
        >
          <TrashSmallIcon />
        </button>
      )}
    </div>
  )
}

// ─── Icônes SVG inline ────────────────────────────────────────────────────────

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronUpSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  )
}

function ChevronDownSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

function PencilSmallIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  )
}
