import argon2 from 'argon2'
import { Prisma } from '@prisma/client'
import {
  createVendor,
  freeHiddenUserCuid,
  updateUserProfile,
  adminResetUserPassword,
} from '../repositories/user.repository'
import { AppError } from '../types/error.types'
import { UserSummary } from '../types/user.types'

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

export async function adminCreateVendor(input: CreateVendorInput): Promise<UserSummary> {
  const hashedPassword = await argon2.hash(input.password)
  await freeHiddenUserCuid(input.cuid)
  try {
    return await createVendor({
      name: input.name,
      cuid: input.cuid,
      hashedPassword,
      color: input.color,
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError('Ce CUID est déjà utilisé par un autre compte actif', 409)
    }
    throw error
  }
}

export async function adminUpdateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserSummary> {
  return updateUserProfile(userId, input)
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await argon2.hash(newPassword)
  await adminResetUserPassword(userId, hashedPassword)
}
