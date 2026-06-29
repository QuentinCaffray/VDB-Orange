import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import authRouter from './routes/auth.routes'
import taskRouter from './routes/task.routes'
import indicatorRouter from './routes/indicator.routes'
import salesRouter from './routes/sales.routes'
import userRouter from './routes/user.routes'
import teamNoteRouter from './routes/team-note.routes'
import gameRouter from './routes/game.routes'
import sseRouter from './routes/sse.routes'
import { globalErrorHandler } from './middlewares/error.middleware'

const app = express()

// SSE requiert un timeout long — désactiver le timeout par défaut d'Express
app.set('timeout', 0)

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173', credentials: true }))
app.use(cookieParser())
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

// ─── Frontend statique (production uniquement) ─────────────────────────────────
// En production, Express sert le build React. __dirname = backend/dist/ → remonte à frontend/dist/
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist')
  app.use(express.static(frontendDistPath))
  // Catch-all SPA : toute route non-API renvoie index.html (React Router gère le reste)
  app.use((_request, response) => {
    response.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

// ─── Gestion des erreurs (doit être enregistré en dernier) ────────────────────
app.use(globalErrorHandler)

export default app
