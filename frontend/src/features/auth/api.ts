import api from '../../lib/axios'
import { AuthResponse } from '../../types/auth.types'

export async function loginWithCuid(cuid: string, password: string): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/login', { cuid, password })
  return response.data
}

export async function activateAccountWithNewPassword(
  newPassword: string,
  confirmPassword: string,
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>('/auth/activate', {
    newPassword,
    confirmPassword,
  })
  return response.data
}
