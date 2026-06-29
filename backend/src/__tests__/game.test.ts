import request from 'supertest'
import { prisma } from '../lib/prisma'
import app from '../app'
import { makeVendorToken, makeAdminToken } from './setup'

// ─── State partagé entre les blocs de tests ───────────────────────────────────

let activeGameId: string | null = null

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.moveRequest.deleteMany({})
  await prisma.gamePawn.deleteMany({})
  await prisma.game.deleteMany({})
})

afterAll(async () => {
  await prisma.moveRequest.deleteMany({})
  await prisma.gamePawn.deleteMany({})
  await prisma.game.deleteMany({})
})

// ─── GET /api/game (sans partie active) ───────────────────────────────────────

describe('GET /api/game (aucune partie)', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app).get('/api/game')
    expect(response.status).toBe(401)
  })

  it('renvoie null s\'il n\'y a pas de partie active', async () => {
    const response = await request(app)
      .get('/api/game')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(response.body).toBeNull()
  })
})

// ─── POST /api/game ───────────────────────────────────────────────────────────

describe('POST /api/game', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .post('/api/game')
      .send({ floorCount: 10, objective: 'Test', reward: 'Test' })
    expect(response.status).toBe(401)
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .post('/api/game')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ floorCount: 10, objective: 'Test', reward: 'Test' })
    expect(response.status).toBe(403)
  })

  it('crée une nouvelle partie et retourne son état initial (201)', async () => {
    const response = await request(app)
      .post('/api/game')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ floorCount: 5, objective: 'Objectif test', reward: 'Récompense test' })

    expect(response.status).toBe(201)
    expect(response.body.status).toBe('active')
    expect(response.body.floorCount).toBe(5)
    expect(response.body.objective).toBe('Objectif test')
    expect(Array.isArray(response.body.pawns)).toBe(true)

    activeGameId = response.body.id
  })

  it('renvoie 400 si floorCount est inférieur à 2', async () => {
    const response = await request(app)
      .post('/api/game')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ floorCount: 1, objective: 'Test', reward: 'Test' })
    expect(response.status).toBe(400)
  })

  it('renvoie 400 si l\'objectif est vide', async () => {
    const response = await request(app)
      .post('/api/game')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ floorCount: 5, objective: '', reward: 'Test' })
    expect(response.status).toBe(400)
  })
})

// ─── GET /api/game (partie active) ───────────────────────────────────────────

describe('GET /api/game (partie active)', () => {
  it('renvoie l\'état de la partie active', async () => {
    expect(activeGameId).toBeTruthy()

    const response = await request(app)
      .get('/api/game')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(response.body).not.toBeNull()
    expect(response.body.id).toBe(activeGameId)
    expect(response.body.status).toBe('active')
  })
})

// ─── PATCH /api/game/:id/pause ────────────────────────────────────────────────

describe('PATCH /api/game/:id/pause', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .patch(`/api/game/${activeGameId}/pause`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(response.status).toBe(403)
  })

  it('met la partie en pause (204) et le GET confirme le statut paused', async () => {
    const patchResponse = await request(app)
      .patch(`/api/game/${activeGameId}/pause`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(patchResponse.status).toBe(204)

    const getResponse = await request(app)
      .get('/api/game')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(getResponse.body.status).toBe('paused')
  })
})

// ─── PATCH /api/game/:id/resume ───────────────────────────────────────────────

describe('PATCH /api/game/:id/resume', () => {
  it('reprend la partie (204) et le GET confirme le statut active', async () => {
    const patchResponse = await request(app)
      .patch(`/api/game/${activeGameId}/resume`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(patchResponse.status).toBe(204)

    const getResponse = await request(app)
      .get('/api/game')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(getResponse.body.status).toBe('active')
  })
})

// ─── POST /api/game/:id/move-request ─────────────────────────────────────────

describe('POST /api/game/:id/move-request', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .post(`/api/game/${activeGameId}/move-request`)
      .send({ reason: 'Test' })
    expect(response.status).toBe(401)
  })

  it('renvoie 400 si la raison est vide', async () => {
    const response = await request(app)
      .post(`/api/game/${activeGameId}/move-request`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ reason: '' })
    expect(response.status).toBe(400)
  })

  it('un vendeur soumet une demande et reçoit 201', async () => {
    const response = await request(app)
      .post(`/api/game/${activeGameId}/move-request`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ reason: 'J\'ai atteint mes objectifs journaliers' })

    expect(response.status).toBe(201)
  })
})

// ─── GET /api/game/:id/move-requests ──────────────────────────────────────────

describe('GET /api/game/:id/move-requests', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .get(`/api/game/${activeGameId}/move-requests`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(response.status).toBe(403)
  })

  it('un admin voit les demandes en attente', async () => {
    const response = await request(app)
      .get(`/api/game/${activeGameId}/move-requests`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    // Il y a au moins une demande en attente (créée dans le test précédent)
    const pending = response.body.filter((r: { status: string }) => r.status === 'pending')
    expect(pending.length).toBeGreaterThanOrEqual(1)
  })
})

// ─── PATCH /api/game/move-requests/:requestId/resolve ────────────────────────

describe('PATCH /api/game/move-requests/:requestId/resolve', () => {
  let pendingRequestId: string | null = null

  beforeAll(async () => {
    // Récupérer l'ID d'une demande en attente
    const response = await request(app)
      .get(`/api/game/${activeGameId}/move-requests`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    const pending = response.body.filter((r: { status: string }) => r.status === 'pending')
    pendingRequestId = pending[0]?.id ?? null
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .patch(`/api/game/move-requests/${pendingRequestId}/resolve`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ approved: true })
    expect(response.status).toBe(403)
  })

  it('un admin approuve la demande (204)', async () => {
    expect(pendingRequestId).toBeTruthy()

    const response = await request(app)
      .patch(`/api/game/move-requests/${pendingRequestId}/resolve`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ approved: true, adminNote: 'Bien joué !' })

    expect(response.status).toBe(204)

    // Vérifier que la demande n'est plus en attente
    const requestsResponse = await request(app)
      .get(`/api/game/${activeGameId}/move-requests`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    const stillPending = requestsResponse.body.find((r: { id: string; status: string }) =>
      r.id === pendingRequestId && r.status === 'pending',
    )
    expect(stillPending).toBeUndefined()
  })
})

// ─── PATCH /api/game/:id/finish ───────────────────────────────────────────────

describe('PATCH /api/game/:id/finish', () => {
  it('termine la partie (204) et le GET confirme le statut finished', async () => {
    const patchResponse = await request(app)
      .patch(`/api/game/${activeGameId}/finish`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(patchResponse.status).toBe(204)

    const getResponse = await request(app)
      .get('/api/game')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    // La partie terminée peut retourner null ou l'état finished selon l'implémentation
    if (getResponse.body !== null) {
      expect(getResponse.body.status).toBe('finished')
    }
  })
})

// ─── PATCH /api/game/:id/reset ────────────────────────────────────────────────

describe('PATCH /api/game/:id/reset', () => {
  it('remet tous les pions à l\'étage 0 (204)', async () => {
    const patchResponse = await request(app)
      .patch(`/api/game/${activeGameId}/reset`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
    expect(patchResponse.status).toBe(204)

    // Vérifier directement en DB que les pions sont à l'étage 0
    const pawns = await prisma.gamePawn.findMany({
      where: { gameId: activeGameId! },
    })
    const allAtFloorZero = pawns.every((pawn) => pawn.currentFloor === 0)
    expect(allAtFloorZero).toBe(true)
  })
})
