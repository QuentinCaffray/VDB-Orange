import request from 'supertest'
import { prisma } from '../lib/prisma'
import app from '../app'
import { makeVendorToken, makeAdminToken, TEST_VENDOR_ID, TEST_ADMIN_ID } from './setup'

// ─── Indicateur de test pour les ventes ──────────────────────────────────────

let testIndicatorId: string
const TEST_DATE = '2026-01-15'
const TEST_MONTH = 1
const TEST_YEAR = 2026

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  const indicator = await prisma.indicator.create({
    data: {
      name: '__Test_Sales_Indicateur__',
      type: 'daily',
      order: 997,
      isActive: true,
    },
  })
  testIndicatorId = indicator.id
})

afterAll(async () => {
  await prisma.dailySale.deleteMany({
    where: { indicatorId: testIndicatorId },
  })
  await prisma.monthlyTarget.deleteMany({
    where: { indicatorId: testIndicatorId },
  })
  await prisma.indicator.deleteMany({
    where: { name: '__Test_Sales_Indicateur__' },
  })
})

beforeEach(async () => {
  // Nettoyer les ventes du test entre chaque test pour repartir d'un état propre
  await prisma.dailySale.deleteMany({
    where: { indicatorId: testIndicatorId },
  })
})

// ─── GET /api/sales/daily ─────────────────────────────────────────────────────

describe('GET /api/sales/daily', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app).get('/api/sales/daily')
    expect(response.status).toBe(401)
  })

  it('renvoie un tableau (vide ou non) pour la date du jour par défaut', async () => {
    const response = await request(app)
      .get('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  it('renvoie les ventes pour une date donnée', async () => {
    // Utiliser l'API pour créer la vente — garantit la cohérence du format de date
    await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 1 })

    const response = await request(app)
      .get(`/api/sales/daily?date=${TEST_DATE}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    const testSale = response.body.find((s: { indicatorId: string }) => s.indicatorId === testIndicatorId)
    expect(testSale).toBeDefined()
    expect(testSale.count).toBe(1)
  })

  it('renvoie 400 si le format de date est invalide', async () => {
    const response = await request(app)
      .get('/api/sales/daily?date=pas-une-date')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/date/)
  })
})

// ─── PATCH /api/sales/daily (delta) ──────────────────────────────────────────

describe('PATCH /api/sales/daily (delta)', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .patch('/api/sales/daily')
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 1 })
    expect(response.status).toBe(401)
  })

  it('incrémente le compteur de vente (+1)', async () => {
    const response = await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 1 })

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(1)
    expect(response.body.indicatorId).toBe(testIndicatorId)
  })

  it('décrémente le compteur de vente (-1)', async () => {
    // D'abord pointer une vente
    await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 1 })

    // Puis la corriger
    const response = await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: -1 })

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(0)
  })

  it('renvoie 403 si un vendeur tente de pointer pour un autre utilisateur', async () => {
    const response = await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 1, userId: TEST_ADMIN_ID })

    expect(response.status).toBe(403)
  })

  it('un admin peut pointer pour un autre utilisateur', async () => {
    const response = await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 1, userId: TEST_VENDOR_ID })

    expect(response.status).toBe(200)
    expect(response.body.userId).toBe(TEST_VENDOR_ID)
  })

  it('renvoie 400 si le delta n\'est pas +1 ou -1', async () => {
    const response = await request(app)
      .patch('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, delta: 5 })

    expect(response.status).toBe(400)
  })
})

// ─── PUT /api/sales/daily (valeur absolue) ────────────────────────────────────

describe('PUT /api/sales/daily (correction absolue)', () => {
  it('pose un total absolu pour la journée', async () => {
    const response = await request(app)
      .put('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, count: 7 })

    expect(response.status).toBe(200)
    expect(response.body.count).toBe(7)
  })

  it('renvoie 400 si le count est négatif', async () => {
    const response = await request(app)
      .put('/api/sales/daily')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, date: TEST_DATE, count: -1 })

    expect(response.status).toBe(400)
  })
})

// ─── GET /api/sales/monthly ───────────────────────────────────────────────────

describe('GET /api/sales/monthly', () => {
  it('renvoie la progression mensuelle du vendeur connecté', async () => {
    const response = await request(app)
      .get(`/api/sales/monthly?month=${TEST_MONTH}&year=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })

  it('renvoie 403 si un vendeur tente de voir la progression d\'un autre', async () => {
    const response = await request(app)
      .get(`/api/sales/monthly?userId=${TEST_ADMIN_ID}&month=${TEST_MONTH}&year=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(403)
  })

  it('un admin peut voir la progression de n\'importe quel vendeur', async () => {
    const response = await request(app)
      .get(`/api/sales/monthly?userId=${TEST_VENDOR_ID}&month=${TEST_MONTH}&year=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
})

// ─── GET /api/sales/monthly/team ─────────────────────────────────────────────

describe('GET /api/sales/monthly/team', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .get(`/api/sales/monthly/team?month=${TEST_MONTH}&year=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(403)
  })

  it('renvoie la progression agrégée de l\'équipe pour un admin', async () => {
    const response = await request(app)
      .get(`/api/sales/monthly/team?month=${TEST_MONTH}&year=${TEST_YEAR}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
})

// ─── PUT /api/sales/targets ───────────────────────────────────────────────────

describe('PUT /api/sales/targets', () => {
  afterEach(async () => {
    await prisma.monthlyTarget.deleteMany({
      where: { indicatorId: testIndicatorId },
    })
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .put('/api/sales/targets')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ userId: TEST_VENDOR_ID, indicatorId: testIndicatorId, month: TEST_MONTH, year: TEST_YEAR, target: 10 })

    expect(response.status).toBe(403)
  })

  it('un admin peut définir l\'objectif mensuel d\'un vendeur', async () => {
    const response = await request(app)
      .put('/api/sales/targets')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ userId: TEST_VENDOR_ID, indicatorId: testIndicatorId, month: TEST_MONTH, year: TEST_YEAR, target: 20 })

    expect(response.status).toBe(204)
  })

  it('renvoie 400 si l\'objectif est négatif', async () => {
    const response = await request(app)
      .put('/api/sales/targets')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ userId: TEST_VENDOR_ID, indicatorId: testIndicatorId, month: TEST_MONTH, year: TEST_YEAR, target: -5 })

    expect(response.status).toBe(400)
  })
})

// ─── PUT /api/sales/targets/all-vendors ──────────────────────────────────────

describe('PUT /api/sales/targets/all-vendors', () => {
  afterEach(async () => {
    await prisma.monthlyTarget.deleteMany({
      where: { indicatorId: testIndicatorId },
    })
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .put('/api/sales/targets/all-vendors')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ indicatorId: testIndicatorId, month: TEST_MONTH, year: TEST_YEAR, target: 15 })

    expect(response.status).toBe(403)
  })

  it('un admin peut définir le même objectif pour tous les vendeurs', async () => {
    const response = await request(app)
      .put('/api/sales/targets/all-vendors')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ indicatorId: testIndicatorId, month: TEST_MONTH, year: TEST_YEAR, target: 15 })

    expect(response.status).toBe(204)
  })
})
