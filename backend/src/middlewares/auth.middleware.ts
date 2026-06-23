import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types/auth.types'

export function requireAuth(request: Request, response: Response, next: NextFunction): void {
  const authorizationHeader = request.headers.authorization

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    response.status(401).json({ error: 'Token manquant ou mal formé' })
    return
  }

  const token = authorizationHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    request.authenticatedUser = payload
    next()
  } catch {
    response.status(401).json({ error: 'Token invalide ou expiré' })
  }
}

export function requireAdmin(request: Request, response: Response, next: NextFunction): void {
  if (!request.authenticatedUser) {
    response.status(401).json({ error: 'Non authentifié' })
    return
  }

  if (request.authenticatedUser.role !== 'admin') {
    response.status(403).json({ error: 'Accès réservé à l\'administration' })
    return
  }

  next()
}
