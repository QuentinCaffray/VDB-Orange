import { Role } from '@prisma/client'
import { prisma } from '../lib/prisma'

export async function findUserByCuid(cuid: string) {
  return prisma.user.findUnique({
    where: { cuid },
  })
}

export async function findUserById(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
  })
}

export async function findAllUsers() {
  return prisma.user.findMany({
    where: { isHidden: false },
    select: { id: true, cuid: true, name: true, role: true, color: true, isFirstLogin: true, lastLoginAt: true },
    orderBy: { name: 'asc' },
  })
}

export async function updateLastLoginAt(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  })
}

export async function updateUserPassword(
  userId: string,
  hashedNewPassword: string,
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      password: hashedNewPassword,
      isFirstLogin: false,
    },
  })
}

export async function updateUserColor(userId: string, color: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { color },
  })
}

const USER_PUBLIC_SELECT = { id: true, cuid: true, name: true, role: true, color: true }

export async function createVendor(data: {
  name: string
  cuid: string
  hashedPassword: string
  color: string
}) {
  return prisma.user.create({
    data: {
      name: data.name,
      cuid: data.cuid,
      password: data.hashedPassword,
      color: data.color,
      role: 'vendeur',
      isFirstLogin: true,
    },
    select: USER_PUBLIC_SELECT,
  })
}

export async function updateUserProfile(
  userId: string,
  data: { cuid?: string; color?: string },
) {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: USER_PUBLIC_SELECT,
  })
}

export async function adminResetUserPassword(
  userId: string,
  hashedPassword: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword, isFirstLogin: true },
  })
}

export async function updateUserRole(userId: string, role: Role): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  })
}

export async function softDeleteUser(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { isHidden: true },
  })
}
