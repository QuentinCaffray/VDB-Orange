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
  createdAt: string
}

export interface CreateTaskInput {
  title: string
  description?: string
}
