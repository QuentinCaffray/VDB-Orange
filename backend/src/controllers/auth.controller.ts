import { Request, Response, NextFunction } from 'express'
import { login, activateAccount } from '../services/auth.service'
import { LoginInput, ActivateAccountInput } from '../types/auth.types'

export async function loginHandler(
  request: Request<object, object, LoginInput>,
  response: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { cuid, password } = request.body
    const { tokens, user } = await login(cuid, password)

    response.status(200).json({ ...tokens, user })
  } catch (error) {
    next(error)
  }
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

    response.status(200).json({ ...tokens, user })
  } catch (error) {
    next(error)
  }
}
