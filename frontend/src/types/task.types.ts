export type TaskStatus = 'todo' | 'doing' | 'done'

export interface TaskAssignee {
  id: string
  name: string
  color: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  assignee: TaskAssignee | null
  doneAt: string | null
  dueDate: string | null
  createdAt: string
  // Ordre configuré sur le template récurrent d'origine — null pour une tâche manuelle,
  // qui n'a pas d'ordre (voir compareTasksForDisplay dans hooks/useTasks.ts)
  order: number | null
}

export interface CreateTaskInput {
  title: string
  description?: string
  dueDate?: string
}
