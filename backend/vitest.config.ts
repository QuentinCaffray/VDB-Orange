import { defineConfig } from 'vitest/config'
import dotenv from 'dotenv'

// Charger les variables d'environnement avant que Prisma soit instancié
dotenv.config()

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/__tests__/setup.ts'],
    singleFork: true,
    fileParallelism: false, // Exécution séquentielle pour éviter les conflits sur la DB partagée
    testTimeout: 15000,
  },
})
