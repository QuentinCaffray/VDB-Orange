import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Task } from '../types/task.types'
import { DailySaleEntry } from '../types/sales.types'
import { ACTIVE_GAME_QUERY_KEY } from '../features/game/hooks/useGame'
import { getAccessToken, setAccessToken } from '../lib/axios'

type AppEvent =
  | { type: 'task.created'; task: Task }
  | { type: 'task.taken'; task: Task }
  | { type: 'task.completed'; task: Task }
  | { type: 'task.released'; task: Task }
  | { type: 'task.deleted'; taskId: string }
  | { type: 'sale.updated'; sale: DailySaleEntry }
  | { type: 'sale.monthly.corrected'; userId: string; month: number; year: number }
  | { type: 'monthly.target.updated'; userId: string; month: number; year: number }
  | { type: 'game.started'; payload: unknown }
  | { type: 'game.status.changed'; payload: unknown }
  | { type: 'game.reset'; payload: unknown }
  | { type: 'game.pawn.moved'; payload: unknown }
  | { type: 'game.finished'; payload: unknown }
  | { type: 'game.move_request.created'; payload: unknown }
  | { type: 'user.deleted'; userId: string }

const TASKS_QUERY_KEY = ['tasks']
const SSE_RECONNECT_DELAY_MS = 3000

export function useAppEventStream(
  isAuthenticated: boolean,
  currentUserId: string | null,
  onForcedLogout: () => void,
): void {
  const queryClient = useQueryClient()

  // Ref pour toujours avoir la version la plus récente du callback sans relancer l'effet SSE
  const onForcedLogoutRef = useRef(onForcedLogout)
  useEffect(() => {
    onForcedLogoutRef.current = onForcedLogout
  })

  useEffect(() => {
    if (!isAuthenticated) return

    let isActive = true
    const abortController = new AbortController()

    async function connectToStream(): Promise<void> {
      const token = getAccessToken()
      if (!token || !isActive) return

      try {
        const response = await fetch('/api/events/stream', {
          headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
          credentials: 'include',
          signal: abortController.signal,
        })

        if (response.status === 401) {
          await refreshTokenAndReconnect()
          return
        }

        if (!response.ok || !response.body) {
          scheduleReconnect()
          return
        }

        await readStream(response.body)
        scheduleReconnect()
      } catch {
        if (isActive) scheduleReconnect()
      }
    }

    // Appelé quand le SSE reçoit un 401 — tente de renouveler l'access token via le cookie
    async function refreshTokenAndReconnect(): Promise<void> {
      try {
        const response = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          onForcedLogoutRef.current()
          return
        }

        const { accessToken } = (await response.json()) as { accessToken: string }
        setAccessToken(accessToken)
        if (isActive) connectToStream()
      } catch {
        if (isActive) scheduleReconnect()
      }
    }

    async function readStream(body: ReadableStream<Uint8Array>): Promise<void> {
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (isActive) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          // Les événements SSE sont séparés par une ligne vide (\n\n)
          const rawEvents = buffer.split('\n\n')
          buffer = rawEvents.pop() ?? ''
          for (const rawEvent of rawEvents) {
            parseAndDispatch(rawEvent)
          }
        }
      } finally {
        reader.releaseLock()
      }
    }

    function parseAndDispatch(rawEvent: string): void {
      const dataLine = rawEvent.split('\n').find((line) => line.startsWith('data: '))
      if (!dataLine) return
      try {
        const appEvent = JSON.parse(dataLine.slice(6)) as AppEvent
        dispatchAppEvent(appEvent, queryClient, currentUserId, onForcedLogoutRef)
      } catch {
        // Ignorer les événements malformés
      }
    }

    function scheduleReconnect(): void {
      if (isActive) setTimeout(connectToStream, SSE_RECONNECT_DELAY_MS)
    }

    connectToStream()

    return () => {
      isActive = false
      abortController.abort()
    }
  }, [isAuthenticated, queryClient, currentUserId])
}

function dispatchAppEvent(
  event: AppEvent,
  queryClient: ReturnType<typeof useQueryClient>,
  currentUserId: string | null,
  onForcedLogoutRef: React.MutableRefObject<() => void>,
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
    return
  }

  if (
    event.type === 'game.started' ||
    event.type === 'game.status.changed' ||
    event.type === 'game.reset' ||
    event.type === 'game.pawn.moved' ||
    event.type === 'game.finished'
  ) {
    queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY })
    return
  }

  if (event.type === 'game.move_request.created') {
    queryClient.invalidateQueries({ queryKey: ACTIVE_GAME_QUERY_KEY })
    queryClient.invalidateQueries({ queryKey: ['game', 'move-requests'] })
    return
  }

  if (event.type === 'user.deleted' && event.userId === currentUserId) {
    onForcedLogoutRef.current()
  }
}
