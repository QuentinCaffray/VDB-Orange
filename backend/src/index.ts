import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { prisma } from './lib/prisma'
import { ensureDevAdminExists } from './lib/ensure-dev-admin'

const PORT = process.env.PORT ?? 3001

const server = app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  await ensureDevAdminExists()
})

async function shutdown(): Promise<void> {
  server.close()
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
