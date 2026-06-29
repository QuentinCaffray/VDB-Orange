import request from 'supertest'
import argon2 from 'argon2'
import { prisma } from '../lib/prisma'
import app from '../app'
import { makeVendorToken, makeAdminToken, TEST_ADMIN_ID } from './setup'

// ─── Utilisateurs cibles pour les opérations admin ────────────────────────────

const TEST_TARGET_USER_ID = 'test-user-target-0000001'
const TEST_TARGET_CUID = 'TRGT0001'

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  await prisma.user.deleteMany({
    where: { id: TEST_TARGET_USER_ID },
  })

  const hashedPassword = await argon2.hash('MotDePasseTemp1!')

  await prisma.user.create({
    data: {
      id: TEST_TARGET_USER_ID,
      cuid: TEST_TARGET_CUID,
      name: 'Vendeur Cible',
      color: '#BB0000',
      role: 'vendeur',
      password: hashedPassword,
      isFirstLogin: false,
      isHidden: false,
    },
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { id: TEST_TARGET_USER_ID },
  })
})

// ─── GET /api/users ───────────────────────────────────────────────────────────

describe('GET /api/users', () => {
  it('renvoie 401 sans authentification', async () => {
    const response = await request(app).get('/api/users')
    expect(response.status).toBe(401)
  })

  it('renvoie la liste des utilisateurs visibles pour un vendeur', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    // Vérifie la structure des objets retournés
    const firstUser = response.body[0]
    expect(firstUser).toHaveProperty('id')
    expect(firstUser).toHaveProperty('name')
    expect(firstUser).toHaveProperty('role')
    expect(firstUser).toHaveProperty('color')
    // Le mot de passe ne doit jamais être exposé
    expect(firstUser.password).toBeUndefined()
  })

  it('renvoie la liste des utilisateurs pour un admin', async () => {
    const response = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
  })
})

// ─── POST /api/users ──────────────────────────────────────────────────────────

describe('POST /api/users', () => {
  const newVendorCuid = 'NWVD0001'
  let createdUserId: string | null = null

  afterEach(async () => {
    if (createdUserId) {
      await prisma.user.deleteMany({ where: { id: createdUserId } })
      createdUserId = null
    }
    // Nettoyer aussi par CUID au cas où
    const existing = await prisma.user.findFirst({ where: { cuid: newVendorCuid } })
    if (existing) await prisma.user.delete({ where: { id: existing.id } })
  })

  it('renvoie 401 sans authentification', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({ name: 'Nouveau', cuid: newVendorCuid, password: 'Temp1234!', color: '#112233' })
    expect(response.status).toBe(401)
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ name: 'Nouveau', cuid: newVendorCuid, password: 'Temp1234!', color: '#112233' })
    expect(response.status).toBe(403)
  })

  it('crée un nouveau vendeur avec les champs corrects', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: 'Nouveau Vendeur', cuid: newVendorCuid, password: 'Temp1234!', color: '#112233' })

    expect(response.status).toBe(201)
    expect(response.body.cuid).toBe(newVendorCuid)
    expect(response.body.name).toBe('Nouveau Vendeur')
    expect(response.body.role).toBe('vendeur')
    expect(response.body.password).toBeUndefined()
    createdUserId = response.body.id
  })

  it('renvoie 409 si le CUID est déjà utilisé par un compte actif', async () => {
    // Utilise le CUID d'un utilisateur existant
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: 'Doublon', cuid: TEST_TARGET_CUID, password: 'Temp1234!', color: '#445566' })

    expect(response.status).toBe(409)
    expect(response.body.error).toMatch(/déjà utilisé/)
  })

  it('renvoie 400 si le nom fait moins de 2 caractères', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: 'A', cuid: newVendorCuid, password: 'Temp1234!', color: '#112233' })

    expect(response.status).toBe(400)
  })

  it('renvoie 400 si le CUID ne respecte pas le format', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: 'Vendeur', cuid: 'mauvais-format', password: 'Temp1234!', color: '#112233' })

    expect(response.status).toBe(400)
  })
})

// ─── PATCH /api/users/:userId (profil) ───────────────────────────────────────

describe('PATCH /api/users/:userId (profil)', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_TARGET_USER_ID}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ color: '#AABBCC' })

    expect(response.status).toBe(403)
  })

  it('met à jour la couleur d\'un utilisateur', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_TARGET_USER_ID}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ color: '#AABBCC' })

    expect(response.status).toBe(200)
    expect(response.body.color).toBe('#AABBCC')
  })
})

// ─── PATCH /api/users/:userId/role ───────────────────────────────────────────

describe('PATCH /api/users/:userId/role', () => {
  it('renvoie 400 si l\'admin essaie de modifier son propre rôle', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_ADMIN_ID}/role`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ role: 'vendeur' })

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/propre rôle/)
  })

  it('change le rôle d\'un autre utilisateur', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_TARGET_USER_ID}/role`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ role: 'admin' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)

    // Remettre le rôle à vendeur pour ne pas casser les autres tests
    await prisma.user.update({
      where: { id: TEST_TARGET_USER_ID },
      data: { role: 'vendeur' },
    })
  })
})

// ─── DELETE /api/users/:userId ────────────────────────────────────────────────

describe('DELETE /api/users/:userId', () => {
  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .delete(`/api/users/${TEST_TARGET_USER_ID}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(403)
  })

  it('renvoie 400 si l\'admin essaie de supprimer son propre compte', async () => {
    const response = await request(app)
      .delete(`/api/users/${TEST_ADMIN_ID}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(400)
    expect(response.body.message).toMatch(/propre compte/)
  })

  it('supprime (soft delete) un vendeur et libère son CUID pour réutilisation', async () => {
    const recycledCuid = 'RCYL0001'
    const recycledUserId = 'test-user-recycle-000001'

    // Créer un utilisateur avec le CUID à recycler
    await prisma.user.deleteMany({ where: { id: recycledUserId } })
    await prisma.user.create({
      data: {
        id: recycledUserId,
        cuid: recycledCuid,
        name: 'À Supprimer',
        color: '#CC0000',
        role: 'vendeur',
        password: 'anything',
        isFirstLogin: false,
        isHidden: false,
      },
    })

    // Supprimer l'utilisateur
    const deleteResponse = await request(app)
      .delete(`/api/users/${recycledUserId}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(deleteResponse.status).toBe(200)
    expect(deleteResponse.body.success).toBe(true)

    // Vérifier que le CUID est libéré (l'utilisateur est caché, pas vraiment supprimé)
    const deletedUser = await prisma.user.findUnique({ where: { id: recycledUserId } })
    expect(deletedUser?.isHidden).toBe(true)
    expect(deletedUser?.cuid).not.toBe(recycledCuid) // CUID libéré → renommé en DEL_xxx

    // Recréer un nouvel utilisateur avec le même CUID → doit fonctionner
    const recreateResponse = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ name: 'Nouveau Avec CUID Recyclé', cuid: recycledCuid, password: 'Temp1234!', color: '#00BB00' })

    expect(recreateResponse.status).toBe(201)
    expect(recreateResponse.body.cuid).toBe(recycledCuid)

    // Nettoyage
    await prisma.user.deleteMany({ where: { id: { in: [recycledUserId, recreateResponse.body.id] } } })
  })
})

// ─── PATCH /api/users/:userId/reset-password ─────────────────────────────────

describe('PATCH /api/users/:userId/reset-password', () => {
  it('réinitialise le mot de passe d\'un vendeur et renvoie success', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_TARGET_USER_ID}/reset-password`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ newPassword: 'NouveauTemp1!' })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('renvoie 403 si le demandeur est un vendeur', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_TARGET_USER_ID}/reset-password`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ newPassword: 'NouveauTemp1!' })

    expect(response.status).toBe(403)
  })

  it('renvoie 400 si le nouveau mot de passe fait moins de 8 caractères', async () => {
    const response = await request(app)
      .patch(`/api/users/${TEST_TARGET_USER_ID}/reset-password`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)
      .send({ newPassword: 'court' })

    expect(response.status).toBe(400)
  })
})
