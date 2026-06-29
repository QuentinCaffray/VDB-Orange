import request from 'supertest'
import argon2 from 'argon2'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import app from '../app'

const JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret'

function makeToken(userId: string, role: string = 'vendeur'): string {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '1h' })
}

// ─── Utilisateurs de test dédiés à l'auth ────────────────────────────────────

const TEST_AUTH_USER_ID = 'test-auth-user-000000001'
const TEST_FIRST_LOGIN_USER_ID = 'test-first-login-user001'
const TEST_AUTH_CUID = 'AUTH0001'
const TEST_FIRST_LOGIN_CUID = 'FLGN0001'
const TEST_PASSWORD = 'MotDePasse123!'

// ─── Setup / Teardown ─────────────────────────────────────────────────────────

beforeAll(async () => {
  // Nettoyage préventif si un précédent run a échoué sans cleanup
  await prisma.user.deleteMany({
    where: { id: { in: [TEST_AUTH_USER_ID, TEST_FIRST_LOGIN_USER_ID] } },
  })

  const hashedPassword = await argon2.hash(TEST_PASSWORD)

  await prisma.user.create({
    data: {
      id: TEST_AUTH_USER_ID,
      cuid: TEST_AUTH_CUID,
      name: 'Auth Test User',
      color: '#AA0000',
      role: 'vendeur',
      password: hashedPassword,
      isFirstLogin: false,
      isHidden: false,
    },
  })

  await prisma.user.create({
    data: {
      id: TEST_FIRST_LOGIN_USER_ID,
      cuid: TEST_FIRST_LOGIN_CUID,
      name: 'First Login User',
      color: '#00AA00',
      role: 'vendeur',
      password: hashedPassword,
      isFirstLogin: true,
      isHidden: false,
    },
  })
})

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { id: { in: [TEST_AUTH_USER_ID, TEST_FIRST_LOGIN_USER_ID] } },
  })
})

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

describe('POST /api/auth/login', () => {
  it('renvoie un accessToken et les infos utilisateur avec des identifiants valides', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ cuid: TEST_AUTH_CUID, password: TEST_PASSWORD })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeDefined()
    expect(response.body.user.cuid).toBe(TEST_AUTH_CUID)
    expect(response.body.user.role).toBe('vendeur')
    expect(response.body.user.password).toBeUndefined()
    // Le cookie httpOnly refresh_token doit être posé
    const setCookieHeader = response.headers['set-cookie'] as string[] | undefined
    expect(setCookieHeader?.some((cookie) => cookie.startsWith('refresh_token='))).toBe(true)
  })

  it('renvoie 401 si le CUID est inconnu', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ cuid: 'UNKN0000', password: TEST_PASSWORD })

    expect(response.status).toBe(401)
    expect(response.body.error).toMatch(/incorrect/)
  })

  it('renvoie 401 si le mot de passe est incorrect', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ cuid: TEST_AUTH_CUID, password: 'mauvais-mot-de-passe' })

    expect(response.status).toBe(401)
    expect(response.body.error).toMatch(/incorrect/)
  })

  it('renvoie 400 si le CUID ne respecte pas le format 4 lettres + 4 chiffres', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ cuid: 'cuid-invalide', password: TEST_PASSWORD })

    expect(response.status).toBe(400)
  })

  it('renvoie 400 si le mot de passe est absent', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ cuid: TEST_AUTH_CUID })

    expect(response.status).toBe(400)
  })

  it('renvoie 400 si le body est vide', async () => {
    const response = await request(app).post('/api/auth/login').send({})
    expect(response.status).toBe(400)
  })
})

// ─── POST /api/auth/refresh ───────────────────────────────────────────────────

describe('POST /api/auth/refresh', () => {
  it('renvoie un nouveau accessToken si le cookie refresh_token est valide', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ cuid: TEST_AUTH_CUID, password: TEST_PASSWORD })

    const setCookieHeader = loginResponse.headers['set-cookie'] as string[]

    const refreshResponse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', setCookieHeader)

    expect(refreshResponse.status).toBe(200)
    expect(refreshResponse.body.accessToken).toBeDefined()
    expect(typeof refreshResponse.body.accessToken).toBe('string')
  })

  it('renvoie 401 si aucun cookie refresh_token n\'est présent', async () => {
    const response = await request(app).post('/api/auth/refresh')
    expect(response.status).toBe(401)
    expect(response.body.error).toMatch(/expir/)
  })

  it('renvoie 401 si le refresh_token est un token invalide', async () => {
    const response = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refresh_token=token_completement_invalide; Path=/api/auth; HttpOnly'])

    expect(response.status).toBe(401)
  })
})

// ─── POST /api/auth/logout ────────────────────────────────────────────────────

describe('POST /api/auth/logout', () => {
  it('efface le cookie refresh_token et renvoie { success: true }', async () => {
    const response = await request(app).post('/api/auth/logout')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    // L'header Set-Cookie doit contenir une directive d'expiration pour refresh_token
    const setCookieHeader = response.headers['set-cookie'] as string[] | undefined
    expect(setCookieHeader?.some((cookie) => cookie.startsWith('refresh_token='))).toBe(true)
  })
})

// ─── POST /api/auth/activate ─────────────────────────────────────────────────

describe('POST /api/auth/activate', () => {
  // Chaque test repart d'un compte isFirstLogin: true avec le mot de passe initial
  beforeEach(async () => {
    const hashedPassword = await argon2.hash(TEST_PASSWORD)
    await prisma.user.update({
      where: { id: TEST_FIRST_LOGIN_USER_ID },
      data: { isFirstLogin: true, password: hashedPassword },
    })
  })

  it('définit le mot de passe définitif et renvoie un accessToken', async () => {
    const accessToken = makeToken(TEST_FIRST_LOGIN_USER_ID)

    const response = await request(app)
      .post('/api/auth/activate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newPassword: 'NouveauMdp456!', confirmPassword: 'NouveauMdp456!' })

    expect(response.status).toBe(200)
    expect(response.body.accessToken).toBeDefined()
    expect(response.body.user.isFirstLogin).toBe(false)
  })

  it('renvoie 400 si le compte est déjà activé (isFirstLogin: false)', async () => {
    const accessToken = makeToken(TEST_AUTH_USER_ID)

    const response = await request(app)
      .post('/api/auth/activate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newPassword: 'NouveauMdp456!', confirmPassword: 'NouveauMdp456!' })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/déjà activé/)
  })

  it('renvoie 400 si les deux mots de passe ne correspondent pas', async () => {
    const accessToken = makeToken(TEST_FIRST_LOGIN_USER_ID)

    const response = await request(app)
      .post('/api/auth/activate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newPassword: 'NouveauMdp456!', confirmPassword: 'AutreMdp789!' })

    expect(response.status).toBe(400)
    expect(response.body.field).toBe('confirmPassword')
  })

  it('renvoie 400 si le nouveau mot de passe fait moins de 8 caractères', async () => {
    const accessToken = makeToken(TEST_FIRST_LOGIN_USER_ID)

    const response = await request(app)
      .post('/api/auth/activate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ newPassword: 'court', confirmPassword: 'court' })

    expect(response.status).toBe(400)
  })

  it('renvoie 401 si aucun token n\'est fourni', async () => {
    const response = await request(app)
      .post('/api/auth/activate')
      .send({ newPassword: 'NouveauMdp456!', confirmPassword: 'NouveauMdp456!' })

    expect(response.status).toBe(401)
  })
})

// ─── POST /api/auth/change-password ──────────────────────────────────────────

describe('POST /api/auth/change-password', () => {
  // Restaurer le mot de passe initial après chaque test pour ne pas polluer les suivants
  afterEach(async () => {
    const hashedPassword = await argon2.hash(TEST_PASSWORD)
    await prisma.user.update({
      where: { id: TEST_AUTH_USER_ID },
      data: { password: hashedPassword },
    })
  })

  function getAuthToken(): string {
    return makeToken(TEST_AUTH_USER_ID)
  }

  it('change le mot de passe avec succès', async () => {
    const accessToken = getAuthToken()

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: TEST_PASSWORD,
        newPassword: 'NouveauMdp456!',
        confirmPassword: 'NouveauMdp456!',
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
  })

  it('renvoie 400 si l\'ancien mot de passe est incorrect', async () => {
    const accessToken = getAuthToken()

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: 'mot-de-passe-errone',
        newPassword: 'NouveauMdp456!',
        confirmPassword: 'NouveauMdp456!',
      })

    expect(response.status).toBe(400)
    expect(response.body.error).toMatch(/actuel incorrect/)
  })

  it('renvoie 400 si les nouveaux mots de passe ne correspondent pas', async () => {
    const accessToken = getAuthToken()

    const response = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        oldPassword: TEST_PASSWORD,
        newPassword: 'NouveauMdp456!',
        confirmPassword: 'AutreMdp789!',
      })

    expect(response.status).toBe(400)
    expect(response.body.field).toBe('confirmPassword')
  })

  it('renvoie 401 sans token d\'authentification', async () => {
    const response = await request(app)
      .post('/api/auth/change-password')
      .send({
        oldPassword: TEST_PASSWORD,
        newPassword: 'NouveauMdp456!',
        confirmPassword: 'NouveauMdp456!',
      })

    expect(response.status).toBe(401)
  })
})
