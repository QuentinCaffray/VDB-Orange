export type UserRole = 'vendeur' | 'admin'

export interface AuthenticatedUser {
  id: string
  cuid: string
  name: string
  role: UserRole
  color: string
  isFirstLogin: boolean
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: AuthenticatedUser
}
