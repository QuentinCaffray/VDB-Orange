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
    testTimeout: 15000,
  },
})
