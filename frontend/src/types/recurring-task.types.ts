export interface RecurringTaskCompletion {
  completedAt: string  // ISO 8601
  userId: string
  userName: string
  userColor: string
}

export interface RecurringTaskWithCompletion {
  id: string
  title: string
  order: number
  completion: RecurringTaskCompletion | null
}

// Type utilisé par les endpoints admin de gestion des tâches récurrentes
export interface RecurringTaskAdminItem {
  id: string
  title: string
  order: number
  isActive: boolean
  createdAt: string  // ISO 8601
}
