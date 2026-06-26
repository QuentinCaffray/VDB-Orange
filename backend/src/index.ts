import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.routes'
import taskRouter from './routes/task.routes'
import indicatorRouter from './routes/indicator.routes'
import salesRouter from './routes/sales.routes'
import userRouter from './routes/user.routes'
import teamNoteRouter from './routes/team-note.routes'
import gameRouter from './routes/game.routes'
import sseRouter from './routes/sse.routes'
import { globalErrorHandler } from './middlewares/error.middleware'
import { ensureDevAdminExists } from './lib/ensure-dev-admin'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

// SSE requiert un timeout long — désactiver le timeout par défaut d'Express
app.set('timeout', 0)

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }))
app.use(express.json())

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/tasks', taskRouter)
app.use('/api/indicators', indicatorRouter)
app.use('/api/sales', salesRouter)
app.use('/api/users', userRouter)
app.use('/api/team-notes', teamNoteRouter)
app.use('/api/game', gameRouter)
app.use('/api/events', sseRouter)

// ─── Santé ─────────────────────────────────────────────────────────────────────
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Gestion des erreurs (doit être enregistré en dernier) ────────────────────
app.use(globalErrorHandler)

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`)
  await ensureDevAdminExists()
})

export default app
