import { PrismaClient } from '@prisma/client'

// Instance unique partagée dans toute l'application
export const prisma = new PrismaClient()
