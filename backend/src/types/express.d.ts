import { JwtPayload } from './auth.types'

// Étend le type Request d'Express pour inclure l'utilisateur authentifié
declare global {
  namespace Express {
    interface Request {
      authenticatedUser?: JwtPayload
    }
  }
}
