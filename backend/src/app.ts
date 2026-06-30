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

// En production derrière Railway/nginx, X-Forwarded-For est positionné par le proxy.
// Sans trust proxy, express-rate-limit ne peut pas identifier les IPs correctement (ERR_ERL_UNEXPECTED_X_FORWARDED_FOR).
app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({ origin: resolveClientOrigin(), credentials: true }))
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

// ─── 404 pour les routes /api/* inconnues ──────────────────────────────────────
// Doit être AVANT le catch-all SPA : sinon Express renvoie 200/HTML pour tout /api/*
// inexistant (authentifié), ce qui masque les bugs et noie les 404 réels (P3-04).
app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Route API introuvable' })
})

// ─── Frontend statique (production uniquement) ─────────────────────────────────
// En production, Express sert le build React. __dirname = backend/dist/ → remonte à frontend/dist/
if (process.env.NODE_ENV === 'production') {
  const frontendDistPath = path.join(__dirname, '..', '..', 'frontend', 'dist')

  // sw.js ne doit jamais être caché : le navigateur doit toujours le re-télécharger
  // pour détecter les mises à jour du service worker (règle Workbox obligatoire).
  app.get('/sw.js', (_request, response, next) => {
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    next()
  })

  app.use(express.static(frontendDistPath))

  // Catch-all SPA : toute route non-API renvoie index.html (React Router gère le reste)
  app.use((_request, response) => {
    response.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.sendFile(path.join(frontendDistPath, 'index.html'))
  })
}

// ─── Gestion des erreurs (doit être enregistré en dernier) ────────────────────
app.use(globalErrorHandler)

export default app

// P2-04: en production, CLIENT_URL doit être défini explicitement — pas de fallback localhost.
// Un fallback localhost en prod ouvrirait le CORS à n'importe quel domaine local côté attaquant.
function resolveClientOrigin(): string {
  if (process.env.NODE_ENV === 'production' && !process.env.CLIENT_URL) {
    throw new Error("Variable d'environnement CLIENT_URL manquante — démarrage impossible en production")
  }
  return process.env.CLIENT_URL ?? 'http://localhost:5173'
}
