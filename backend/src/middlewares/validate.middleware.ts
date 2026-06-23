import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

// Middleware générique : valide req.body contre un schéma Zod avant d'entrer dans le controller
export function validateBody(schema: ZodSchema) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const result = schema.safeParse(request.body)

    if (!result.success) {
      const firstError = result.error.errors[0]
      response.status(400).json({
        error: firstError?.message ?? 'Données invalides',
        field: firstError?.path.join('.'),
      })
      return
    }

    request.body = result.data
    next()
  }
}
