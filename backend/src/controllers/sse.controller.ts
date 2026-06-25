import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types/auth.types'
import { eventBus, AppEvent } from '../lib/event-bus'

// Railway coupe les connexions inactives après ~30s — on envoie un ping toutes les 25s
const HEARTBEAT_INTERVAL_MS = 25_000

export function sseStreamHandler(request: Request, response: Response): void {
  const token = request.query.token as string

  if (!token) {
    response.status(401).json({ error: 'Token requis' })
    return
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
  } catch {
    response.status(401).json({ error: 'Token invalide ou expiré' })
    return
  }

  response.setHeader('Content-Type', 'text/event-stream')
  response.setHeader('Cache-Control', 'no-cache')
  response.setHeader('Connection', 'keep-alive')
  response.flushHeaders()

  const heartbeat = setInterval(() => {
    response.write(': ping\n\n')
  }, HEARTBEAT_INTERVAL_MS)

  function sendEvent(event: AppEvent): void {
    response.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  eventBus.subscribeToEvents(sendEvent)

  request.on('close', () => {
    clearInterval(heartbeat)
    eventBus.unsubscribeFromEvents(sendEvent)
  })
}
