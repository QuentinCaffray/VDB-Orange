import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAdminRecurringTasks,
  createAdminRecurringTask,
  updateAdminRecurringTask,
  deleteAdminRecurringTask,
  reorderAdminRecurringTasks,
} from '../api'
import { RecurringTaskAdminItem } from '../../../types/recurring-task.types'

const ADMIN_RECURRING_TASKS_QUERY_KEY = ['admin-recurring-tasks'] as const

export function useAdminRecurringTasks() {
  return useQuery<RecurringTaskAdminItem[]>({
    queryKey: ADMIN_RECURRING_TASKS_QUERY_KEY,
    queryFn: fetchAdminRecurringTasks,
  })
}

export function useCreateAdminRecurringTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (title: string) => createAdminRecurringTask(title),
    onSuccess: (newTask) => {
      queryClient.setQueryData<RecurringTaskAdminItem[]>(
        ADMIN_RECURRING_TASKS_QUERY_KEY,
        (previousTasks = []) => [...previousTasks, newTask],
      )
      toast.success('Tâche créée')
    },
    onError: () => {
      toast.error('Impossible de créer la tâche')
    },
  })
}

export function useUpdateAdminRecurringTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      taskId,
      data,
    }: {
      taskId: string
      data: { title?: string; isActive?: boolean }
    }) => updateAdminRecurringTask(taskId, data),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<RecurringTaskAdminItem[]>(
        ADMIN_RECURRING_TASKS_QUERY_KEY,
        (previousTasks = []) =>
          previousTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    },
    onError: () => {
      toast.error('Impossible de modifier la tâche')
    },
  })
}

export function useDeleteAdminRecurringTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteAdminRecurringTask(taskId),
    onSuccess: (_, deletedTaskId) => {
      queryClient.setQueryData<RecurringTaskAdminItem[]>(
        ADMIN_RECURRING_TASKS_QUERY_KEY,
        (previousTasks = []) => previousTasks.filter((task) => task.id !== deletedTaskId),
      )
      toast.success('Tâche supprimée')
    },
    onError: () => {
      toast.error('Impossible de supprimer la tâche')
    },
  })
}

export function useReorderAdminRecurringTasks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderAdminRecurringTasks(orderedIds),
    // Après le réordonnancement côté serveur, on invalide le cache pour récupérer
    // les orders mis à jour plutôt que de les recalculer localement.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_RECURRING_TASKS_QUERY_KEY })
    },
    onError: () => {
      toast.error('Impossible de réordonner les tâches')
    },
  })
}
