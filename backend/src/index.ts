import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth.routes'
import { globalErrorHandler } from './middlewares/error.middleware'

dotenv.config()

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.CLIENT_URL ?? 'http://localhost:5173' }))
app.use(express.json())

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter)

// ─── Santé ─────────────────────────────────────────────────────────────────────
app.get('/health', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ─── Gestion des erreurs (doit être enregistré en dernier) ────────────────────
app.use(globalErrorHandler)

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})

export default app
