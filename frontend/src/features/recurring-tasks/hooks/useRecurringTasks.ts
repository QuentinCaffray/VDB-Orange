import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchRecurringTasks,
  completeRecurringTask,
  uncompleteRecurringTask,
} from '../api'
import { RecurringTaskWithCompletion } from '../../../types/recurring-task.types'

function buildRecurringTasksQueryKey(dateString: string): [string, string] {
  return ['recurring-tasks', dateString]
}

export function useRecurringTasks(dateString: string) {
  return useQuery<RecurringTaskWithCompletion[]>({
    queryKey: buildRecurringTasksQueryKey(dateString),
    queryFn: () => fetchRecurringTasks(dateString),
  })
}

export function useCompleteRecurringTask(dateString: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => completeRecurringTask(taskId, dateString),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<RecurringTaskWithCompletion[]>(
        buildRecurringTasksQueryKey(dateString),
        (previousTasks = []) =>
          previousTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    },
    onError: () => {
      toast.error('Impossible de cocher cette tâche')
    },
  })
}

export function useUncompleteRecurringTask(dateString: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => uncompleteRecurringTask(taskId, dateString),
    onSuccess: (_, taskId) => {
      queryClient.setQueryData<RecurringTaskWithCompletion[]>(
        buildRecurringTasksQueryKey(dateString),
        (previousTasks = []) =>
          previousTasks.map((task) =>
            task.id === taskId ? { ...task, completion: null } : task,
          ),
      )
    },
    onError: () => {
      toast.error('Impossible de décocher cette tâche')
    },
  })
}
