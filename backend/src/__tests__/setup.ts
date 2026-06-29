import { prisma } from '../lib/prisma'
import { Role } from '@prisma/client'
import jwt from 'jsonwebtoken'

// IDs fixes pour identifier et nettoyer les données de test facilement
export const TEST_VENDOR_ID = 'test-vendor-00000000000001'
export const TEST_ADMIN_ID = 'test-admin-000000000000001'

// Identifiants de connexion au format attendu (4L+4D)
const TEST_VENDOR_CUID = 'TSTV0001'
const TEST_ADMIN_CUID = 'TSTA0001'

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'

export function makeVendorToken(): string {
  return jwt.sign({ userId: TEST_VENDOR_ID, role: Role.vendeur }, JWT_SECRET, { expiresIn: '1h' })
}

export function makeAdminToken(): string {
  return jwt.sign({ userId: TEST_ADMIN_ID, role: Role.admin }, JWT_SECRET, { expiresIn: '1h' })
}

beforeAll(async () => {
  await prisma.user.upsert({
    where: { id: TEST_VENDOR_ID },
    create: {
      id: TEST_VENDOR_ID,
      cuid: TEST_VENDOR_CUID,
      name: 'Test Vendeur',
      color: '#FF5500',
      role: Role.vendeur,
      password: 'hashed-password-not-used-in-tests',
      isHidden: false,
      isFirstLogin: false,
    },
    update: {},
  })

  await prisma.user.upsert({
    where: { id: TEST_ADMIN_ID },
    create: {
      id: TEST_ADMIN_ID,
      cuid: TEST_ADMIN_CUID,
      name: 'Test Admin',
      color: '#0055FF',
      role: Role.admin,
      password: 'hashed-password-not-used-in-tests',
      isHidden: false,
      isFirstLogin: false,
    },
    update: {},
  })
})

afterAll(async () => {
  await prisma.task.deleteMany({
    where: {
      OR: [{ createdById: TEST_VENDOR_ID }, { createdById: TEST_ADMIN_ID }],
    },
  })
  await prisma.user.deleteMany({
    where: { id: { in: [TEST_VENDOR_ID, TEST_ADMIN_ID] } },
  })
  await prisma.$disconnect()
})

beforeEach(async () => {
  await prisma.task.deleteMany({
    where: {
      OR: [{ createdById: TEST_VENDOR_ID }, { createdById: TEST_ADMIN_ID }],
    },
  })
})
