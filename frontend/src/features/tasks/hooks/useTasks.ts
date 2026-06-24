import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  fetchAllTasks,
  createTask,
  takeTask,
  completeTask,
  releaseTask,
  deleteTask,
  fetchTaskHistory,
  fetchActiveDates,
} from '../api'
import { CreateTaskInput, Task, TaskStatus } from '../../../types/task.types'

const TASKS_QUERY_KEY = ['tasks']
const POLLING_INTERVAL_MS = 20_000

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchAllTasks,
    refetchInterval: POLLING_INTERVAL_MS,
  })
}

export function useTasksByStatus(status: TaskStatus) {
  const { data: allTasks = [], ...queryState } = useTasks()
  const filteredTasks = allTasks.filter((task) => task.status === status)
  return { tasks: filteredTasks, ...queryState }
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Tâche créée')
    },
  })
}

export function useTakeTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => takeTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      toast.success('Tâche terminée')
    },
  })
}

export function useReleaseTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => releaseTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
  })
}

export function useTaskHistory(dateString: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'history', dateString],
    queryFn: () => fetchTaskHistory(dateString),
    enabled: dateString.length > 0,
  })
}

export function useActiveDates(month: number, year: number) {
  return useQuery<string[]>({
    queryKey: ['tasks', 'active-dates', month, year],
    queryFn: () => fetchActiveDates(month, year),
  })
}
