import request from 'supertest'
import { prisma } from '../lib/prisma'
import app from '../app'
import { makeVendorToken, makeAdminToken } from './setup'

// ─── Indicateur de test ───────────────────────────────────────────────────────

const TEST_INDICATOR_NAME = '__Test_Indicateur__'
let testIndicatorId: string

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const indicator = await prisma.indicator.create({
    data: {
      name: TEST_INDICATOR_NAME,
      type: 'daily',
      order: 999,
      isActive: true,
    },
  })
  testIndicatorId = indicator.id
})

afterAll(async () => {
  await prisma.indicator.deleteMany({
    where: { name: { startsWith: '__Test_' } },
  })
})

// ─── GET /api/indicators ──────────────────────────────────────────────────────

describe('GET /api/indicators', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app).get('/api/indicators')
    expect(response.status).toBe(401)
  })

  it('renvoie la liste des indicateurs actifs pour un vendeur', async () => {
    const response = await request(app)
      .get('/api/indicators')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)

    const testIndicator = response.body.find((i: { name: string }) => i.name === TEST_INDICATOR_NAME)
    expect(testIndicator).toBeDefined()
    expect(testIndicator).toHaveProperty('id')
    expect(testIndicator).toHaveProperty('type')
    expect(testIndicator).toHaveProperty('order')
    expect(testIndicator.isActive).toBe(true)
  })

  it('les indicateurs inactifs ne sont pas visibles par défaut', async () => {
    // Désactiver temporairement l'indicateur de test
    await prisma.indicator.update({
      where: { id: testIndicatorId },
      data: { isActive: false },
    })

    const response = await request(app)
      .get('/api/indicators')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    const testIndicator = response.body.find((i: { name: string }) => i.name === TEST_INDICATOR_NAME)
    expect(testIndicator).toBeUndefined()

    // Réactiver pour les tests suivants
    await prisma.indicator.update({
      where: { id: testIndicatorId },
      data: { isActive: true },
    })
  })

  it('un admin peut voir les indicateurs inactifs avec ?includeInactive=true', async () => {
    await prisma.indicator.update({
      where: { id: testIndicatorId },
      data: { isActive: false },
    })

    const response = await request(app)
      .get('/api/indicators?includeInactive=true')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    const testIndicator = response.body.find((i: { name: string }) => i.name === TEST_INDICATOR_NAME)
    expect(testIndicator).toBeDefined()

    await prisma.indicator.update({
      where: { id: testIndicatorId },
      data: { isActive: true },
    })
  })
})

// ─── POST /api/indicators ─────────────────────────────────────────────────────

describe('POST /api/indicators', () => {
  let createdIndicatorId: string | null = null

  afterEach(async () => {
    if (createdIndicatorId) {
      await prisma.indicator.deleteMany({ where: { id: createdIndicatorId } })
      createdIndicatorId = null
    }
  })

  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .send({ name: '__Test_Nouveau__', type: 'daily', order: 1 })
    expect(response.status).toBe(401)
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ name: '__Test_Nouveau__', type: 'daily', order: 1 })
    expect(response.status).toBe(403)
  })

  it('crée un indicateur daily avec les champs corrects', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: '__Test_Nouveau_Daily__', type: 'daily', order: 100 })

    expect(response.status).toBe(201)
    expect(response.body.name).toBe('__Test_Nouveau_Daily__')
    expect(response.body.type).toBe('daily')
    expect(response.body.order).toBe(100)
    expect(response.body.isActive).toBe(true)
    createdIndicatorId = response.body.id
  })

  it('crée un indicateur monthly', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: '__Test_Nouveau_Monthly__', type: 'monthly', order: 101 })

    expect(response.status).toBe(201)
    expect(response.body.type).toBe('monthly')
    createdIndicatorId = response.body.id
  })

  it('renvoie 400 si le nom est vide', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: '', type: 'daily', order: 1 })
    expect(response.status).toBe(400)
  })

  it('renvoie 400 si le type est invalide', async () => {
    const response = await request(app)
      .post('/api/indicators')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: '__Test__', type: 'invalid', order: 1 })
    expect(response.status).toBe(400)
  })
})

// ─── PATCH /api/indicators/:id ────────────────────────────────────────────────

describe('PATCH /api/indicators/:id', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .patch(`/api/indicators/${testIndicatorId}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ name: '__Test_Modifié__' })
    expect(response.status).toBe(403)
  })

  it('met à jour le nom d\'un indicateur', async () => {
    const response = await request(app)
      .patch(`/api/indicators/${testIndicatorId}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: '__Test_Indicateur_Modifié__' })

    expect(response.status).toBe(200)
    expect(response.body.name).toBe('__Test_Indicateur_Modifié__')

    // Remettre le nom original
    await prisma.indicator.update({
      where: { id: testIndicatorId },
      data: { name: TEST_INDICATOR_NAME },
    })
  })

  it('peut désactiver un indicateur (isActive: false)', async () => {
    const response = await request(app)
      .patch(`/api/indicators/${testIndicatorId}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ isActive: false })

    expect(response.status).toBe(200)
    expect(response.body.isActive).toBe(false)

    // Réactiver
    await prisma.indicator.update({
      where: { id: testIndicatorId },
      data: { isActive: true },
    })
  })

  it('peut modifier l\'ordre d\'un indicateur', async () => {
    const response = await request(app)
      .patch(`/api/indicators/${testIndicatorId}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ order: 50 })

    expect(response.status).toBe(200)
    expect(response.body.order).toBe(50)
  })
})

// ─── DELETE /api/indicators/:id ───────────────────────────────────────────────

describe('DELETE /api/indicators/:id', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .delete(`/api/indicators/${testIndicatorId}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
    expect(response.status).toBe(403)
  })

  it('supprime définitivement un indicateur (hard delete) et renvoie 204', async () => {
    const ephemeralIndicator = await prisma.indicator.create({
      data: { name: '__Test_A_Supprimer__', type: 'daily', order: 998, isActive: true },
    })

    const response = await request(app)
      .delete(`/api/indicators/${ephemeralIndicator.id}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(204)

    // L'indicateur ne doit plus exister dans la base (hard delete)
    const afterDelete = await prisma.indicator.findUnique({ where: { id: ephemeralIndicator.id } })
    expect(afterDelete).toBeNull()
  })
})
