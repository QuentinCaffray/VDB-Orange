import request from 'supertest'
import express, { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware'
import { validateBody } from '../middlewares/validate.middleware'
import { globalErrorHandler } from '../middlewares/error.middleware'
import { AppError } from '../types/error.types'
import { TEST_VENDOR_ID, makeVendorToken, makeAdminToken } from './setup'

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'

// ─── App minimale pour tester les middlewares en isolation ────────────────────

const testSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  count: z.number().int('Doit être un entier'),
})

function buildTestApp() {
  const testApp = express()
  testApp.use(express.json())

  testApp.get('/protected', requireAuth, (_req: Request, res: Response) => {
    res.status(200).json({ authenticated: true })
  })

  testApp.get('/admin-only', requireAuth, requireAdmin, (_req: Request, res: Response) => {
    res.status(200).json({ admin: true })
  })

  testApp.post('/validated', validateBody(testSchema), (_req: Request, res: Response) => {
    res.status(200).json({ valid: true })
  })

  testApp.get('/app-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new AppError('Ressource introuvable', 404))
  })

  testApp.get('/unknown-error', (_req: Request, _res: Response, next: NextFunction) => {
    next(new Error('Erreur inattendue interne'))
  })

  testApp.use(globalErrorHandler)
  return testApp
}

const testApp = buildTestApp()

// ─── requireAuth ──────────────────────────────────────────────────────────────

describe('requireAuth', () => {
  it('renvoie 401 si aucun header Authorization', async () => {
    const response = await request(testApp).get('/protected')
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Token manquant ou mal formé')
  })

  it('renvoie 401 si le header ne commence pas par "Bearer "', async () => {
    const response = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Basic abc123')
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Token manquant ou mal formé')
  })

  it('renvoie 401 si le token est une chaîne invalide', async () => {
    const response = await request(testApp)
      .get('/protected')
      .set('Authorization', 'Bearer token_completement_invalide')
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Token invalide ou expiré')
  })

  it('renvoie 401 si le token est signé avec un mauvais secret', async () => {
    const foreignToken = jwt.sign({ userId: TEST_VENDOR_ID, role: 'vendeur' }, 'mauvais-secret')
    const response = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${foreignToken}`)
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Token invalide ou expiré')
  })

  it('renvoie 401 si le userId du token ne correspond à aucun utilisateur', async () => {
    const orphanToken = jwt.sign(
      { userId: 'utilisateur-fantome-00000', role: 'vendeur' },
      JWT_SECRET,
    )
    const response = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${orphanToken}`)
    expect(response.status).toBe(401)
    expect(response.body.error).toBe('Compte supprimé ou inexistant')
  })

  it('laisse passer avec un token valide et un utilisateur existant', async () => {
    const response = await request(testApp)
      .get('/protected')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(response.status).toBe(200)
    expect(response.body.authenticated).toBe(true)
  })
})

// ─── requireAdmin ─────────────────────────────────────────────────────────────

describe('requireAdmin', () => {
  it('renvoie 403 si le rôle est vendeur', async () => {
    const response = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(response.status).toBe(403)
    expect(response.body.error).toMatch(/administration/)
  })

  it('laisse passer si le rôle est admin', async () => {
    const response = await request(testApp)
      .get('/admin-only')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(response.status).toBe(200)
    expect(response.body.admin).toBe(true)
  })
})

// ─── validateBody ─────────────────────────────────────────────────────────────

describe('validateBody', () => {
  it('laisse passer si le body correspond au schéma', async () => {
    const response = await request(testApp)
      .post('/validated')
      .send({ name: 'Test', count: 5 })
    expect(response.status).toBe(200)
    expect(response.body.valid).toBe(true)
  })

  it('renvoie 400 avec le champ concerné si un champ requis est absent', async () => {
    const response = await request(testApp)
      .post('/validated')
      .send({ count: 3 })
    expect(response.status).toBe(400)
    // Zod retourne "Required" pour un champ absent ; le message personnalisé min(1) s'applique à une chaîne vide
    expect(response.body.error).toBeTruthy()
    expect(response.body.field).toBe('name')
  })

  it('renvoie 400 si le type est incorrect', async () => {
    const response = await request(testApp)
      .post('/validated')
      .send({ name: 'Test', count: 'pas-un-nombre' })
    expect(response.status).toBe(400)
    expect(response.body.field).toBe('count')
  })

  it('renvoie 400 si le body est vide', async () => {
    const response = await request(testApp).post('/validated').send({})
    expect(response.status).toBe(400)
  })
})

// ─── globalErrorHandler ───────────────────────────────────────────────────────

describe('globalErrorHandler', () => {
  it('renvoie le statusCode et le message d\'une AppError', async () => {
    const response = await request(testApp).get('/app-error')
    expect(response.status).toBe(404)
    expect(response.body.error).toBe('Ressource introuvable')
  })

  it('renvoie 500 pour une erreur générique sans exposer les détails internes', async () => {
    const response = await request(testApp).get('/unknown-error')
    expect(response.status).toBe(500)
    expect(response.body.error).toBe('Erreur serveur interne')
  })
})
