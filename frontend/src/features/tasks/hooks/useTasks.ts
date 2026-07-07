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
  adminCreateCompletedTask,
} from '../api'
import { CreateTaskInput, Task, TaskStatus } from '../../../types/task.types'

const TASKS_QUERY_KEY = ['tasks']

export function useTasks() {
  return useQuery<Task[], Error, Task[]>({
    queryKey: TASKS_QUERY_KEY,
    queryFn: fetchAllTasks,
    select: sortTasksForDisplay,
  })
}

// Trie comme le backend (findAllTasks) : tâches issues d'un template récurrent d'abord,
// selon l'ordre configuré par l'admin, puis tâches manuelles par date de création la plus
// récente. Nécessaire car les mises à jour temps réel (SSE, voir useAppEventStream) ne
// font que patcher ou ajouter un élément dans le cache sans jamais re-trier le tableau —
// ce tri au moment de la lecture garantit un ordre correct même sans recharger la page.
function sortTasksForDisplay(tasks: Task[]): Task[] {
  return [...tasks].sort(compareTasksForDisplay)
}

function compareTasksForDisplay(taskA: Task, taskB: Task): number {
  if (taskA.order !== null && taskB.order !== null) {
    return taskA.order - taskB.order
  }
  if (taskA.order !== null) return -1
  if (taskB.order !== null) return 1
  return new Date(taskB.createdAt).getTime() - new Date(taskA.createdAt).getTime()
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
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previousTasks = []) => {
        const alreadyInCache = previousTasks.some((task) => task.id === newTask.id)
        return alreadyInCache ? previousTasks : [newTask, ...previousTasks]
      })
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

export function useDeleteHistoryTask(dateString: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (taskId: string) => deleteTask(taskId),
    onSuccess: (_, taskId) => {
      queryClient.setQueryData<Task[]>(['tasks', 'history', dateString], (previousTasks = []) =>
        previousTasks.filter((task) => task.id !== taskId),
      )
      // Si le jour n'a plus de tâches, le point vert du calendrier doit disparaître
      queryClient.invalidateQueries({ queryKey: ['tasks', 'active-dates'] })
      toast.success('Tâche supprimée de l\'historique')
    },
    onError: () => {
      toast.error('Impossible de supprimer la tâche')
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
      queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY, exact: true })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'history', dateString] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'active-dates'] })
      toast.success('Tâche attribuée et terminée')
    },
    onError: () => {
      toast.error('Impossible de terminer cette tâche')
    },
  })
}

export function useAdminCreateCompletedTask(dateString: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ title, targetUserId }: { title: string; targetUserId: string }) =>
      adminCreateCompletedTask(title, targetUserId, dateString),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'history', dateString] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'active-dates'] })
      toast.success('Tâche créée et attribuée')
    },
    onError: () => {
      toast.error('Impossible de créer la tâche')
    },
  })
}

export function useActiveDates(month: number, year: number) {
  return useQuery<string[]>({
    queryKey: ['tasks', 'active-dates', month, year],
    queryFn: () => fetchActiveDates(month, year),
  })
}
