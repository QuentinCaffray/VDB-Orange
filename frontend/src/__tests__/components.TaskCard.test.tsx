import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import TaskCard from '../features/tasks/components/TaskCard'
import * as tasksApi from '../features/tasks/api'
import { Task } from '../types/task.types'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../features/tasks/api')
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

// ─── Helper wrapper ───────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

// ─── Données de test ──────────────────────────────────────────────────────────

const TASK_TODO: Task = {
  id: 'task-001',
  title: 'Ranger la vitrine',
  description: null,
  status: 'todo',
  assignee: null,
  createdAt: '2026-06-01T08:00:00Z',
  doneAt: null,
  dueDate: null,
}

const TASK_DOING: Task = {
  id: 'task-002',
  title: 'Contacter les clients',
  description: null,
  status: 'doing',
  assignee: { id: 'user-001', name: 'Alice', color: '#FF6B00' },
  createdAt: '2026-06-01T08:00:00Z',
  doneAt: null,
  dueDate: null,
}

const TASK_DONE: Task = {
  id: 'task-003',
  title: 'Nettoyer le comptoir',
  description: null,
  status: 'done',
  assignee: { id: 'user-001', name: 'Alice', color: '#FF6B00' },
  createdAt: '2026-06-01T08:00:00Z',
  doneAt: '2026-06-01T14:30:00Z',
  dueDate: null,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('TaskCard — statut todo', () => {
  it('affiche le titre et le bouton "Prendre"', () => {
    render(<TaskCard task={TASK_TODO} currentUserId="user-001" currentUserRole="vendeur" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Ranger la vitrine')).toBeDefined()
    expect(screen.getByText('Prendre →')).toBeDefined()
    expect(screen.getByText('Non attribuée')).toBeDefined()
  })

  it('appelle takeTask quand on clique sur "Prendre"', async () => {
    const updatedTask: Task = { ...TASK_TODO, status: 'doing', assignee: { id: 'user-001', name: 'Alice', color: '#FF6B00' } }
    vi.mocked(tasksApi.takeTask).mockResolvedValue(updatedTask)
    vi.mocked(tasksApi.fetchAllTasks).mockResolvedValue([])

    render(<TaskCard task={TASK_TODO} currentUserId="user-001" currentUserRole="vendeur" />, {
      wrapper: createWrapper(),
    })

    fireEvent.click(screen.getByText('Prendre →'))

    await waitFor(() => {
      expect(vi.mocked(tasksApi.takeTask)).toHaveBeenCalledWith('task-001')
    })
  })

  it('un admin voit le bouton de suppression sur une tâche todo', () => {
    render(<TaskCard task={TASK_TODO} currentUserId="admin-001" currentUserRole="admin" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByLabelText('Supprimer la tâche')).toBeDefined()
  })

  it('un vendeur ne voit pas le bouton de suppression', () => {
    render(<TaskCard task={TASK_TODO} currentUserId="user-001" currentUserRole="vendeur" />, {
      wrapper: createWrapper(),
    })

    expect(screen.queryByLabelText('Supprimer la tâche')).toBeNull()
  })
})

describe('TaskCard — statut doing', () => {
  it('affiche le nom de l\'assigné', () => {
    render(
      <TaskCard task={TASK_DOING} currentUserId="user-001" currentUserRole="vendeur" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('Alice')).toBeDefined()
  })

  it('affiche les boutons d\'action pour le vendeur assigné', () => {
    render(
      <TaskCard task={TASK_DOING} currentUserId="user-001" currentUserRole="vendeur" />,
      { wrapper: createWrapper() },
    )

    expect(screen.getByText('✓ Terminer')).toBeDefined()
    expect(screen.getByLabelText('Remettre la tâche dans À faire')).toBeDefined()
  })

  it('ne montre pas les boutons d\'action à un autre vendeur', () => {
    render(
      <TaskCard task={TASK_DOING} currentUserId="user-002" currentUserRole="vendeur" />,
      { wrapper: createWrapper() },
    )

    expect(screen.queryByText('✓ Terminer')).toBeNull()
  })
})

describe('TaskCard — statut done', () => {
  it('affiche le nom de l\'assigné et l\'heure de complétion', () => {
    render(<TaskCard task={TASK_DONE} currentUserId="user-001" currentUserRole="vendeur" />, {
      wrapper: createWrapper(),
    })

    expect(screen.getByText('Alice')).toBeDefined()
    // L'heure formatée doit être affichée (format HH:MM)
    expect(screen.getByText(/✓ \d{2}:\d{2}/)).toBeDefined()
  })

  it('n\'affiche pas le bouton de suppression pour une tâche done (même pour un admin)', () => {
    render(<TaskCard task={TASK_DONE} currentUserId="admin-001" currentUserRole="admin" />, {
      wrapper: createWrapper(),
    })

    expect(screen.queryByLabelText('Supprimer la tâche')).toBeNull()
  })
})

describe('TaskCard — confirmation de suppression', () => {
  it('affiche les boutons de confirmation après le premier clic sur Supprimer', () => {
    render(<TaskCard task={TASK_TODO} currentUserId="admin-001" currentUserRole="admin" />, {
      wrapper: createWrapper(),
    })

    fireEvent.click(screen.getByLabelText('Supprimer la tâche'))

    expect(screen.getByLabelText('Confirmer la suppression')).toBeDefined()
    expect(screen.getByLabelText('Annuler la suppression')).toBeDefined()
  })

  it('annule la confirmation quand on clique sur le bouton d\'annulation', () => {
    render(<TaskCard task={TASK_TODO} currentUserId="admin-001" currentUserRole="admin" />, {
      wrapper: createWrapper(),
    })

    fireEvent.click(screen.getByLabelText('Supprimer la tâche'))
    fireEvent.click(screen.getByLabelText('Annuler la suppression'))

    expect(screen.getByLabelText('Supprimer la tâche')).toBeDefined()
    expect(screen.queryByLabelText('Confirmer la suppression')).toBeNull()
  })
})
