import argon2 from 'argon2'
import {
  createVendor,
  updateUserProfile,
  adminResetUserPassword,
} from '../repositories/user.repository'
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
  const hashedPassword = await argon2.hash(newPassword)
  await adminResetUserPassword(userId, hashedPassword)
}
