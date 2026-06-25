import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Task } from '../types/task.types'
import { DailySaleEntry } from '../types/sales.types'

type AppEvent =
  | { type: 'task.created'; task: Task }
  | { type: 'task.taken'; task: Task }
  | { type: 'task.completed'; task: Task }
  | { type: 'task.released'; task: Task }
  | { type: 'task.deleted'; taskId: string }
  | { type: 'sale.updated'; sale: DailySaleEntry }
  | { type: 'sale.monthly.corrected'; userId: string; month: number; year: number }
  | { type: 'monthly.target.updated'; userId: string; month: number; year: number }

const TASKS_QUERY_KEY = ['tasks']

export function useAppEventStream(isAuthenticated: boolean): void {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!isAuthenticated) return

    const token = localStorage.getItem('access_token') ?? ''
    const sseUrl = `/api/events/stream?token=${encodeURIComponent(token)}`
    const eventSource = new EventSource(sseUrl)

    eventSource.onmessage = (messageEvent) => {
      const appEvent = JSON.parse(messageEvent.data as string) as AppEvent
      dispatchAppEvent(appEvent, queryClient)
    }

    return () => {
      eventSource.close()
    }
  }, [isAuthenticated, queryClient])
}

function dispatchAppEvent(
  event: AppEvent,
  queryClient: ReturnType<typeof useQueryClient>,
): void {
  if (event.type === 'task.created') {
    queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previous = []) => {
      const alreadyExists = previous.some((task) => task.id === event.task.id)
      return alreadyExists ? previous : [...previous, event.task]
    })
    return
  }

  if (
    event.type === 'task.taken' ||
    event.type === 'task.completed' ||
    event.type === 'task.released'
  ) {
    queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previous = []) =>
      previous.map((task) => (task.id === event.task.id ? event.task : task)),
    )
    return
  }

  if (event.type === 'task.deleted') {
    queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (previous = []) =>
      previous.filter((task) => task.id !== event.taskId),
    )
    return
  }

  if (event.type === 'sale.updated') {
    queryClient.invalidateQueries({ queryKey: ['sales', 'daily'] })
    queryClient.invalidateQueries({ queryKey: ['sales', 'monthly'] })
    return
  }

  if (event.type === 'sale.monthly.corrected' || event.type === 'monthly.target.updated') {
    queryClient.invalidateQueries({ queryKey: ['sales', 'monthly'] })
  }
}

