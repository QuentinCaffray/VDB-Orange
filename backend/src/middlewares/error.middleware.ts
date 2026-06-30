import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { AppError } from '../types/error.types'

export function globalErrorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    response.status(error.statusCode).json({ error: error.message })
    return
  }

  // ZodError non interceptée par validateBody (ex: schema.parse() direct dans un controller).
  // Le fallback sur error.name couvre les cas où instanceof échoue à cause d'un décalage
  // de version de module entre le dist compilé et node_modules (résolution CJS vs ESM).
  const isZodError = error instanceof ZodError || (error instanceof Error && error.name === 'ZodError')
  if (isZodError) {
    const zodError = error as ZodError
    const firstError = zodError.errors[0]
    response.status(400).json({
      error: firstError?.message ?? 'Données invalides',
      field: firstError?.path.join('.'),
    })
    return
  }

  // Erreur inattendue — on log mais on ne renvoie pas les détails au client
  console.error('Erreur non gérée :', error)
  response.status(500).json({ error: 'Erreur serveur interne' })
}
