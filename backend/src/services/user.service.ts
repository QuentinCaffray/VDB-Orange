import bcrypt from 'bcryptjs'
import {
  createVendor,
  updateUserProfile,
  adminResetUserPassword,
} from '../repositories/user.repository'
import { UserSummary } from '../types/user.types'

const BCRYPT_SALT_ROUNDS = 10

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
  const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS)
  return createVendor({
    name: input.name,
    cuid: input.cuid,
    hashedPassword,
    color: input.color,
  })
}

export async function adminUpdateUserProfile(
  userId: string,
  input: UpdateUserProfileInput,
): Promise<UserSummary> {
  return updateUserProfile(userId, input)
}

export async function adminResetPassword(userId: string, newPassword: string): Promise<void> {
  const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)
  await adminResetUserPassword(userId, hashedPassword)
}
