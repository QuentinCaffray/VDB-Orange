import crypto from 'crypto'
import argon2 from 'argon2'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {
  findUserByCuid,
  findUserById,
  updateUserPassword,
  updateLastLoginAt,
  updateRefreshTokenHash,
  clearRefreshTokenHash,
} from '../repositories/user.repository'
import { AuthenticatedUser, JwtPayload } from '../types/auth.types'
import { AppError } from '../types/error.types'

const ACCESS_TOKEN_EXPIRY = '10m'  // P2-01: réduit de '1h' pour limiter la fenêtre post-logout
const REFRESH_TOKEN_EXPIRY = '7d'

interface AuthTokens {
  accessToken: string
  refreshToken: string
}

interface LoginResult {
  tokens: AuthTokens
  user: AuthenticatedUser
}

function hashRefreshToken(refreshToken: string): string {
  return crypto.createHash('sha256').update(refreshToken).digest('hex')
}

// Pendant la migration bcrypt → argon2 : détecte le format du hash et utilise la lib appropriée
async function verifyPassword(storedHash: string, plainPassword: string): Promise<boolean> {
  const isBcryptHash = storedHash.startsWith('$2b$') || storedHash.startsWith('$2a$')
  if (isBcryptHash) {
    return bcrypt.compare(plainPassword, storedHash)
  }
  return argon2.verify(storedHash, plainPassword)
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

  const isPasswordCorrect = await verifyPassword(user.password, password)
  if (!isPasswordCorrect) {
    throw INVALID_CREDENTIALS_ERROR
  }

  // Migration transparente : si le hash est en bcrypt, le remplacer par argon2 en tâche de fond
  const isBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$')
  if (isBcryptHash) {
    argon2.hash(password)
      .then((newHash) => updateUserPassword(user.id, newHash))
      .catch(() => undefined)
  }

  const tokens = generateTokens(user.id, user.role)

  // P2-02: stocker le hash du refresh token pour permettre la rotation et l'invalidation au logout
  await updateRefreshTokenHash(user.id, hashRefreshToken(tokens.refreshToken))

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

export async function refreshAccessToken(refreshToken: string): Promise<AuthTokens> {
  let decodedPayload: { userId: string }

  try {
    decodedPayload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string }
  } catch {
    throw new AppError('Refresh token invalide ou expiré', 401)
  }

  const user = await findUserById(decodedPayload.userId)
  if (!user) {
    throw new AppError('Utilisateur introuvable', 401)
  }

  // P2-02: vérifier que le token présenté correspond au hash stocké
  if (!user.refreshTokenHash) {
    throw new AppError('Session invalide — veuillez vous reconnecter', 401)
  }

  const isTokenHashValid = hashRefreshToken(refreshToken) === user.refreshTokenHash
  if (!isTokenHashValid) {
    // Token rejoué (probable attaque) — invalider toutes les sessions de cet utilisateur
    await clearRefreshTokenHash(user.id)
    throw new AppError('Session révoquée — veuillez vous reconnecter', 401)
  }

  // Rotation : générer un nouveau jeu de tokens et remplacer le hash stocké
  const newTokens = generateTokens(user.id, user.role)
  await updateRefreshTokenHash(user.id, hashRefreshToken(newTokens.refreshToken))

  return newTokens
}

export async function logoutByRefreshToken(refreshToken: string): Promise<void> {
  try {
    const decoded = jwt.decode(refreshToken) as { userId: string } | null
    if (decoded?.userId) {
      await clearRefreshTokenHash(decoded.userId)
    }
  } catch {
    // Token non décodable — rien à invalider en base
  }
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

  const isOldPasswordCorrect = await verifyPassword(user.password, oldPassword)
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

  // P2-02: stocker le hash du refresh token dès l'activation
  await updateRefreshTokenHash(updatedUser.id, hashRefreshToken(tokens.refreshToken))

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
