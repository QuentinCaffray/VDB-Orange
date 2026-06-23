import api from '../../lib/axios'
import { Task, CreateTaskInput } from '../../types/task.types'

export async function fetchAllTasks(): Promise<Task[]> {
  const response = await api.get<Task[]>('/tasks')
  return response.data
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await api.post<Task>('/tasks', input)
  return response.data
}

export async function takeTask(taskId: string): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${taskId}/take`)
  return response.data
}

export async function completeTask(taskId: string): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${taskId}/done`)
  return response.data
}

export async function releaseTask(taskId: string): Promise<Task> {
  const response = await api.patch<Task>(`/tasks/${taskId}/release`)
  return response.data
}

export async function fetchTaskHistory(dateString: string): Promise<Task[]> {
  const response = await api.get<Task[]>('/tasks/history', { params: { date: dateString } })
  return response.data
}

export async function fetchActiveDates(month: number, year: number): Promise<string[]> {
  const response = await api.get<string[]>('/tasks/history/active-dates', { params: { month, year } })
  return response.data
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`)
}
