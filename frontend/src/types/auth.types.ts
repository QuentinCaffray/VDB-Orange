export type UserRole = 'vendeur' | 'admin'

export interface AuthenticatedUser {
  id: string
  cuid: string
  name: string
  role: UserRole
  color: string
  isFirstLogin: boolean
}

export interface AuthResponse {
  accessToken: string
  user: AuthenticatedUser
}
