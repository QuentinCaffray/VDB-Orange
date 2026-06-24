import { createServer } from 'http'
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.routes'
import taskRouter from './routes/task.routes'
import indicatorRouter from './routes/indicator.routes'
import salesRouter from './routes/sales.routes'
import userRouter from './routes/user.routes'
import teamNoteRouter from './routes/team-note.routes'
import { globalErrorHandler } from './middlewares/error.middleware'
import { initSocketIO } from './lib/socket'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }))
app.use(express.json())

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)
app.use('/api/tasks', taskRouter)
app.use('/api/indicators', indicatorRouter)
app.use('/api/sales', salesRouter)
app.use('/api/users', userRouter)
app.use('/api/team-notes', teamNoteRouter)

// ─── Santé ─────────────────────────────────────────────────────────────────────
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Gestion des erreurs (doit être enregistré en dernier) ────────────────────
app.use(globalErrorHandler)

const httpServer = createServer(app)
initSocketIO(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
