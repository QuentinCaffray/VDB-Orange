import request from 'supertest'
import { prisma } from '../lib/prisma'
import app from '../app'
import { makeVendorToken, makeAdminToken, TEST_VENDOR_ID, TEST_ADMIN_ID } from './setup'

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

afterAll(async () => {
  await prisma.teamChallenge.deleteMany({
    where: { teamNote: { userId: { in: [TEST_VENDOR_ID, TEST_ADMIN_ID] } } },
  })
  await prisma.teamNote.deleteMany({
    where: { userId: { in: [TEST_VENDOR_ID, TEST_ADMIN_ID] } },
  })
})

// ─── GET /api/team-notes ──────────────────────────────────────────────────────

describe('GET /api/team-notes', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app).get('/api/team-notes')
    expect(response.status).toBe(401)
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .get('/api/team-notes')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(response.status).toBe(403)
  })

  it('renvoie la liste des notes de toute l\'équipe pour un admin', async () => {
    const response = await request(app)
      .get('/api/team-notes')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
})

// ─── GET /api/team-notes/me ───────────────────────────────────────────────────

describe('GET /api/team-notes/me', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app).get('/api/team-notes/me')
    expect(response.status).toBe(401)
  })

  it('renvoie la note publique et les challenges du vendeur connecté', async () => {
    const response = await request(app)
      .get('/api/team-notes/me')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('publicNote')
    expect(response.body).toHaveProperty('challenges')
    // La note privée ne doit pas être exposée au vendeur
    expect(response.body.privateNote).toBeUndefined()
  })
})

// ─── PUT /api/team-notes/:userId ─────────────────────────────────────────────

describe('PUT /api/team-notes/:userId', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .put(`/api/team-notes/${TEST_VENDOR_ID}`)
      .send({ publicNote: 'Bonne semaine' })
    expect(response.status).toBe(401)
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .put(`/api/team-notes/${TEST_VENDOR_ID}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ publicNote: 'Bonne semaine' })
    expect(response.status).toBe(403)
  })

  it('crée ou met à jour la note publique d\'un vendeur (renvoie 204)', async () => {
    const response = await request(app)
      .put(`/api/team-notes/${TEST_VENDOR_ID}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ publicNote: 'Excellent travail cette semaine !' })

    expect(response.status).toBe(204)

    // Vérifier que la note a bien été enregistrée via le GET admin
    const notesResponse = await request(app)
      .get('/api/team-notes')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    const vendorNote = notesResponse.body.find((n: { userId: string }) => n.userId === TEST_VENDOR_ID)
    expect(vendorNote?.publicNote).toBe('Excellent travail cette semaine !')
  })

  it('met à jour la note privée et les challenges', async () => {
    const response = await request(app)
      .put(`/api/team-notes/${TEST_VENDOR_ID}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({
        publicNote: 'En progression',
        privateNote: 'Attention aux retards',
        challenges: [
          { label: 'Challenge A', current: '2', target: '5' },
          { label: 'Challenge B', current: '0', target: '3' },
        ],
      })

    expect(response.status).toBe(204)

    // Vérifier l'état persisté
    const notesResponse = await request(app)
      .get('/api/team-notes')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    const vendorNote = notesResponse.body.find((n: { userId: string }) => n.userId === TEST_VENDOR_ID)
    expect(vendorNote?.privateNote).toBe('Attention aux retards')
    expect(vendorNote?.challenges).toHaveLength(2)
    expect(vendorNote?.challenges[0].label).toBe('Challenge A')
  })

  it('renvoie 400 si un challenge n\'a pas de label', async () => {
    const response = await request(app)
      .put(`/api/team-notes/${TEST_VENDOR_ID}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({
        challenges: [{ label: '', current: '0', target: '5' }],
      })

    expect(response.status).toBe(400)
  })
})

// ─── PATCH /api/team-notes/me/challenges/:challengeId ────────────────────────

describe('PATCH /api/team-notes/me/challenges/:challengeId', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .patch('/api/team-notes/me/challenges/fake-id')
      .send({ current: '3' })
    expect(response.status).toBe(401)
  })

  it('un vendeur peut mettre à jour le current de son propre challenge (renvoie 204)', async () => {
    // Créer d'abord une note avec un challenge via l'admin
    await request(app)
      .put(`/api/team-notes/${TEST_VENDOR_ID}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({
        challenges: [{ label: 'Mon Objectif', current: '1', target: '10' }],
      })

    // Récupérer l'ID du challenge via le GET admin
    const notesResponse = await request(app)
      .get('/api/team-notes')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    const vendorNote = notesResponse.body.find((n: { userId: string }) => n.userId === TEST_VENDOR_ID)
    const challengeId = vendorNote?.challenges[0]?.id
    expect(challengeId).toBeDefined()

    // Le vendeur met à jour son propre challenge
    const response = await request(app)
      .patch(`/api/team-notes/me/challenges/${challengeId}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ current: '5' })

    expect(response.status).toBe(204)
  })

  it('renvoie 400 si la valeur current est vide', async () => {
    const response = await request(app)
      .patch('/api/team-notes/me/challenges/fake-id')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ current: '' })

    expect(response.status).toBe(400)
  })
})
