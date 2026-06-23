import api from '../../lib/axios'
import { UserRole } from '../../types/auth.types'

export interface UserSummary {
  id: string
  cuid: string
  name: string
  role: UserRole
  color: string
}

export async function fetchAllUsers(): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>('/users')
  return response.data
}
