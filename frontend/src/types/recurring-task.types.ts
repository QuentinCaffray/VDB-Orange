// Type utilisé par les endpoints admin de gestion des tâches récurrentes
export interface RecurringTaskAdminItem {
  id: string
  title: string
  order: number
  isActive: boolean
  createdAt: string  // ISO 8601
}
