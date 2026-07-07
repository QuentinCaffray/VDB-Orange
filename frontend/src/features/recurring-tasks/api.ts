import api from '../../lib/axios'
import { RecurringTaskAdminItem } from '../../types/recurring-task.types'

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
