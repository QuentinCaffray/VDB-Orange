import { Server as SocketIOServer } from 'socket.io'
import type { Server as HttpServer } from 'http'

let io: SocketIOServer | null = null

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  })
  return io
}

export function getSocketIO(): SocketIOServer {
  if (!io) throw new Error('Socket.IO non initialisé')
  return io
}
