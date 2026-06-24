import api from '../../lib/axios'
import { UserRole } from '../../types/auth.types'

export interface UserSummary {
  id: string
  cuid: string
  name: string
  role: UserRole
  color: string
  isFirstLogin: boolean
  lastLoginAt: string | null
}

export interface CreateVendorInput {
  name: string
  cuid: string
  password: string
  color: string
}

export interface UpdateUserProfileInput {
  cuid?: string
  color?: string
}

export async function fetchAllUsers(): Promise<UserSummary[]> {
  const response = await api.get<UserSummary[]>('/users')
  return response.data
}

export async function updateUserColor(userId: string, color: string): Promise<void> {
  await api.patch(`/users/${userId}/color`, { color })
}

export async function createVendor(input: CreateVendorInput): Promise<UserSummary> {
  const response = await api.post<UserSummary>('/users', input)
  return response.data
}

export async function updateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserSummary> {
  const response = await api.patch<UserSummary>(`/users/${userId}`, input)
  return response.data
}

export async function adminResetUserPassword(userId: string, newPassword: string): Promise<void> {
  await api.patch(`/users/${userId}/reset-password`, { newPassword })
}

export async function updateUserRole(userId: string, role: 'admin' | 'vendeur'): Promise<void> {
  await api.patch(`/users/${userId}/role`, { role })
}

export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`)
}
