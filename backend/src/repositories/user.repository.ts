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
