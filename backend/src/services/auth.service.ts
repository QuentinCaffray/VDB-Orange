import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { findUserByCuid, findUserById, updateUserPassword, updateLastLoginAt } from '../repositories/user.repository'
import { AuthenticatedUser, JwtPayload } from '../types/auth.types'
import { AppError } from '../types/error.types'

const ACCESS_TOKEN_EXPIRY = '1h'
const REFRESH_TOKEN_EXPIRY = '7d'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface LoginResult {
  tokens: AuthTokens
  user: AuthenticatedUser
}

function generateTokens(userId: string, role: AuthenticatedUser['role']): AuthTokens {
  const jwtPayload: JwtPayload = { userId, role }

  const accessToken = jwt.sign(jwtPayload, process.env.JWT_SECRET!, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  })

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  )

  return { accessToken, refreshToken }
}

export async function login(cuid: string, password: string): Promise<LoginResult> {
  const user = await findUserByCuid(cuid)

  // Message volontairement générique pour ne pas révéler si le CUID existe
  const INVALID_CREDENTIALS_ERROR = new AppError('Identifiant ou mot de passe incorrect', 401)

  if (!user) {
    throw INVALID_CREDENTIALS_ERROR
  }

  const isPasswordCorrect = await argon2.verify(user.password, password)
  if (!isPasswordCorrect) {
    throw INVALID_CREDENTIALS_ERROR
  }

  const tokens = generateTokens(user.id, user.role)

  // Mise à jour non bloquante — ne pas faire échouer le login si cette opération plante
  updateLastLoginAt(user.id).catch(() => undefined)

  const authenticatedUser: AuthenticatedUser = {
    id: user.id,
    cuid: user.cuid,
    name: user.name,
    role: user.role,
    color: user.color,
    isFirstLogin: user.isFirstLogin,
  }

  return { tokens, user: authenticatedUser }
}

export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string,
): Promise<void> {
  const user = await findUserById(userId)

  if (!user) {
    throw new AppError('Utilisateur introuvable', 404)
  }

  const isOldPasswordCorrect = await argon2.verify(user.password, oldPassword)
  if (!isOldPasswordCorrect) {
    throw new AppError('Mot de passe actuel incorrect', 400)
  }

  const hashedNewPassword = await argon2.hash(newPassword)
  await updateUserPassword(userId, hashedNewPassword)
}

export async function activateAccount(
  userId: string,
  newPassword: string,
): Promise<LoginResult> {
  const user = await findUserById(userId)

  if (!user) {
    throw new AppError('Utilisateur introuvable', 404)
  }

  if (!user.isFirstLogin) {
    throw new AppError('Ce compte est déjà activé', 400)
  }

  const hashedNewPassword = await argon2.hash(newPassword)
  const updatedUser = await updateUserPassword(user.id, hashedNewPassword)

  const tokens = generateTokens(updatedUser.id, updatedUser.role)

  const authenticatedUser: AuthenticatedUser = {
    id: updatedUser.id,
    cuid: updatedUser.cuid,
    name: updatedUser.name,
    role: updatedUser.role,
    color: updatedUser.color,
    isFirstLogin: updatedUser.isFirstLogin,
  }

  return { tokens, user: authenticatedUser }
}
