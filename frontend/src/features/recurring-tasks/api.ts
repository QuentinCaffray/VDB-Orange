import api from '../../lib/axios'
import { RecurringTaskWithCompletion, RecurringTaskAdminItem } from '../../types/recurring-task.types'

// ─── Checklist quotidienne ─────────────────────────────────────────────────────

export async function fetchRecurringTasks(dateString: string): Promise<RecurringTaskWithCompletion[]> {
  const response = await api.get<RecurringTaskWithCompletion[]>('/recurring-tasks', {
    params: { date: dateString },
  })
  return response.data
}

export async function completeRecurringTask(
  taskId: string,
  dateString: string,
): Promise<RecurringTaskWithCompletion> {
  const response = await api.post<RecurringTaskWithCompletion>(
    `/recurring-tasks/${taskId}/complete`,
    { date: dateString },
  )
  return response.data
}

export async function uncompleteRecurringTask(taskId: string, dateString: string): Promise<void> {
  // axios envoie le body dans { data } pour les requêtes DELETE
  await api.delete(`/recurring-tasks/${taskId}/complete`, { data: { date: dateString } })
}

// ─── Gestion admin ─────────────────────────────────────────────────────────────

export async function fetchAdminRecurringTasks(): Promise<RecurringTaskAdminItem[]> {
  const response = await api.get<RecurringTaskAdminItem[]>('/recurring-tasks/admin')
  return response.data
}

export async function createAdminRecurringTask(title: string): Promise<RecurringTaskAdminItem> {
  const response = await api.post<RecurringTaskAdminItem>('/recurring-tasks/admin', { title })
  return response.data
}

export async function updateAdminRecurringTask(
  taskId: string,
  data: { title?: string; isActive?: boolean },
): Promise<RecurringTaskAdminItem> {
  const response = await api.patch<RecurringTaskAdminItem>(
    `/recurring-tasks/admin/${taskId}`,
    data,
  )
  return response.data
}

export async function deleteAdminRecurringTask(taskId: string): Promise<void> {
  await api.delete(`/recurring-tasks/admin/${taskId}`)
}

export async function reorderAdminRecurringTasks(orderedIds: string[]): Promise<void> {
  await api.patch('/recurring-tasks/admin/reorder', { orderedIds })
}
