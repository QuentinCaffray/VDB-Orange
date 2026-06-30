import { Request, Response, NextFunction } from 'express'
import {
  login,
  activateAccount,
  changePassword,
  refreshAccessToken,
  logoutByRefreshToken,
} from '../services/auth.service'
import { LoginInput, ActivateAccountInput, ChangePasswordInput } from '../types/auth.types'

const REFRESH_TOKEN_COOKIE_NAME = 'refresh_token'
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

function setRefreshTokenCookie(response: Response, refreshToken: string): void {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: REFRESH_TOKEN_MAX_AGE_MS,
    path: '/api/auth',
  })
}

export async function loginHandler(
  request: Request<object, object, LoginInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cuid, password } = request.body
    const { tokens, user } = await login(cuid, password)

    setRefreshTokenCookie(response, tokens.refreshToken)
    response.status(200).json({ accessToken: tokens.accessToken, user })
  } catch (error) {
    next(error)
  }
}

export async function refreshTokenHandler(
  request: Request,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME] as string | undefined

    if (!refreshToken) {
      response.status(401).json({ error: 'Session expirée' })
      return
    }

    // P2-02: la rotation génère un nouveau refresh token — mettre à jour le cookie
    const newTokens = await refreshAccessToken(refreshToken)
    setRefreshTokenCookie(response, newTokens.refreshToken)

    response.json({ accessToken: newTokens.accessToken })
  } catch (error) {
    next(error)
  }
}

export async function logoutHandler(
  request: Request,
  response: Response,
): Promise<void> {
  const refreshToken = request.cookies[REFRESH_TOKEN_COOKIE_NAME] as string | undefined

  if (refreshToken) {
    // P2-02: invalider le hash en base pour bloquer tout rejeu du cookie après déconnexion
    await logoutByRefreshToken(refreshToken).catch(() => undefined)
  }

  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/api/auth',
  })
  response.status(200).json({ success: true })
}

export async function activateAccountHandler(
  request: Request<object, object, ActivateAccountInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { newPassword } = request.body
    const authenticatedUser = request.authenticatedUser!

    const { tokens, user } = await activateAccount(authenticatedUser.userId, newPassword)

    setRefreshTokenCookie(response, tokens.refreshToken)
    response.status(200).json({ accessToken: tokens.accessToken, user })
  } catch (error) {
    next(error)
  }
}

export async function changePasswordHandler(
  request: Request<object, object, ChangePasswordInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { oldPassword, newPassword } = request.body
    const authenticatedUser = request.authenticatedUser!
    await changePassword(authenticatedUser.userId, oldPassword, newPassword)
    response.status(200).json({ success: true })
  } catch (error) {
    next(error)
  }
}
