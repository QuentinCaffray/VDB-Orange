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
  adminCompleteTaskForUser,
} from '../api'
import { CreateTaskInput, Task, TaskStatus } from '../../../types/task.types'

const TASKS_QUERY_KEY = ['tasks']

export function useTasks() {
  return useQuery<Task[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchAllTasks,
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
    onSuccess: (newTask) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previousTasks = []) => [newTask, ...previousTasks])
      toast.success('Tâche créée')
    },
  })
}

export function useTakeTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => takeTask(taskId),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previousTasks = []) =>
        previousTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)),
      )
    },
  })
}

export function useCompleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => completeTask(taskId),
    onSuccess: (completedTask) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previousTasks = []) =>
        previousTasks.map((task) => (task.id === completedTask.id ? completedTask : task)),
      )
      toast.success('Tâche terminée')
    },
  })
}

export function useReleaseTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => releaseTask(taskId),
    onSuccess: (releasedTask) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previousTasks = []) =>
        previousTasks.map((task) => (task.id === releasedTask.id ? releasedTask : task)),
      )
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previousTasks = []) =>
        previousTasks.filter((task) => task.id !== taskId),
      )
    },
  })
}

export function useTaskHistory(dateString: string) {
  return useQuery<Task[]>({
    queryKey: ['tasks', 'history', dateString],
    queryFn: () => fetchTaskHistory(dateString),
    enabled: dateString.length > 0,
  })
}

export function useAdminCompleteTask(dateString: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, targetUserId }: { taskId: string; targetUserId: string }) =>
      adminCompleteTaskForUser(taskId, targetUserId, dateString),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'history', dateString] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'active-dates'] })
      toast.success('Tâche attribuée et terminée')
    },
    onError: () => {
      toast.error('Impossible de terminer cette tâche')
    },
  })
}

export function useActiveDates(month: number, year: number) {
  return useQuery<string[]>({
    queryKey: ['tasks', 'active-dates', month, year],
    queryFn: () => fetchActiveDates(month, year),
  })
}
