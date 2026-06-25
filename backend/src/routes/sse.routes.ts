import { Router } from 'express'
import { sseStreamHandler } from '../controllers/sse.controller'

const sseRouter = Router()

// GET /api/events/stream?token=<jwt> — flux SSE global (auth par query param car EventSource ne gère pas les headers)
sseRouter.get('/stream', sseStreamHandler)

export default sseRouter
