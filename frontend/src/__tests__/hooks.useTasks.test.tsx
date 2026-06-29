import { renderHook, act, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import * as tasksApi from '../features/tasks/api'
import {
  useTasks,
  useTasksByStatus,
  useCreateTask,
  useTakeTask,
  useDeleteTask,
} from '../features/tasks/hooks/useTasks'
import { Task } from '../types/task.types'

// ─── Mock des appels API ──────────────────────────────────────────────────────

vi.mock('../features/tasks/api')

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ─── Helper : wrapper QueryClientProvider avec client partagé ─────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return Wrapper
}

// ─── Données de test ──────────────────────────────────────────────────────────

const TASK_TODO: Task = {
  id: 'task-001',
  title: 'Tâche à faire',
  description: null,
  status: 'todo',
  assignee: null,
  createdAt: '2026-01-01T00:00:00Z',
  doneAt: null,
  dueDate: null,
}

const TASK_DOING: Task = {
  id: 'task-002',
  title: 'Tâche en cours',
  description: null,
  status: 'doing',
  assignee: { id: 'user-001', name: 'Alice', color: '#FF6B00' },
  createdAt: '2026-01-01T00:00:00Z',
  doneAt: null,
  dueDate: null,
}

// ─── Tests useTasks ───────────────────────────────────────────────────────────

describe('useTasks', () => {
  it('retourne les tâches depuis l\'API', async () => {
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO, TASK_DOING])

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toHaveLength(2)
    expect(result.current.data![0].title).toBe('Tâche à faire')
  })

  it('expose isLoading pendant le chargement', () => {
    vi.mocked(tasksApi.fetchAllTasks).mockReturnValue(new Promise(() => undefined))

    const { result } = renderHook(() => useTasks(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })
})

// ─── Tests useTasksByStatus ───────────────────────────────────────────────────

describe('useTasksByStatus', () => {
  it('filtre les tâches par statut todo', async () => {
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO, TASK_DOING])

    const { result } = renderHook(() => useTasksByStatus('todo'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].id).toBe('task-001')
  })

  it('filtre les tâches par statut doing', async () => {
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO, TASK_DOING])

    const { result } = renderHook(() => useTasksByStatus('doing'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.tasks).toHaveLength(1)
    expect(result.current.tasks[0].id).toBe('task-002')
  })
})

// ─── Tests useCreateTask ──────────────────────────────────────────────────────

describe('useCreateTask', () => {
  it('ajoute la nouvelle tâche au cache après une création réussie', async () => {
    const newTask: Task = { ...TASK_TODO, id: 'task-new', title: 'Nouvelle tâche' }
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO])
    vi.mocked(tasksApi.createTask).mockResolvedValue(newTask)

    const { result } = renderHook(
      () => ({ query: useTasks(), mutation: useCreateTask() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(async () => {
      result.current.mutation.mutate({ title: 'Nouvelle tâche' })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    const taskIds = result.current.query.data?.map((t) => t.id) ?? []
    expect(taskIds).toContain('task-new')
  })

  it('n\'ajoute pas de doublon si la tâche est déjà dans le cache', async () => {
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO])
    vi.mocked(tasksApi.createTask).mockResolvedValue(TASK_TODO) // même ID

    const { result } = renderHook(
      () => ({ query: useTasks(), mutation: useCreateTask() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(async () => {
      result.current.mutation.mutate({ title: 'Tâche à faire' })
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    expect(result.current.query.data).toHaveLength(1)
  })
})

// ─── Tests useTakeTask ────────────────────────────────────────────────────────

describe('useTakeTask', () => {
  it('met à jour la tâche dans le cache après prise en charge', async () => {
    const updatedTask: Task = {
      ...TASK_TODO,
      status: 'doing',
      assignee: { id: 'user-001', name: 'Alice', color: '#FF6B00' },
    }
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO, TASK_DOING])
    vi.mocked(tasksApi.takeTask).mockResolvedValue(updatedTask)

    const { result } = renderHook(
      () => ({ query: useTasks(), mutation: useTakeTask() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(async () => {
      result.current.mutation.mutate('task-001')
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    const task = result.current.query.data?.find((t) => t.id === 'task-001')
    expect(task?.status).toBe('doing')
    expect(task?.assignee?.id).toBe('user-001')
  })
})

// ─── Tests useDeleteTask ──────────────────────────────────────────────────────

describe('useDeleteTask', () => {
  it('retire la tâche du cache après suppression', async () => {
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([TASK_TODO, TASK_DOING])
    vi.mocked(tasksApi.deleteTask).mockResolvedValue(undefined)

    const { result } = renderHook(
      () => ({ query: useTasks(), mutation: useDeleteTask() }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.query.isSuccess).toBe(true))

    await act(async () => {
      result.current.mutation.mutate('task-001')
    })

    await waitFor(() => expect(result.current.mutation.isSuccess).toBe(true))

    const taskIds = result.current.query.data?.map((t) => t.id) ?? []
    expect(taskIds).not.toContain('task-001')
    expect(taskIds).toContain('task-002')
  })
})
