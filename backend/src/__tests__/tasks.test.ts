import { describe, it, expect, afterEach } from 'vitest'
import request from 'supertest'
import { TaskStatus } from '@prisma/client'
import app from '../app'
import { prisma } from '../lib/prisma'
import { TEST_VENDOR_ID, TEST_ADMIN_ID, makeVendorToken, makeAdminToken } from './setup'

// ─── Helpers ────────────────────────────────────────────────────────────────────

async function createTask(overrides: {
  title?: string
  status?: TaskStatus
  assigneeId?: string | null
  doneAt?: Date | null
} = {}) {
  return prisma.task.create({
    data: {
      title: overrides.title ?? 'Tâche de test',
      createdById: TEST_VENDOR_ID,
      status: overrides.status ?? TaskStatus.todo,
      assigneeId: overrides.assigneeId ?? null,
      doneAt: overrides.doneAt ?? null,
    },
    include: {
      assignee: { select: { id: true, name: true, color: true } },
    },
  })
}

// Crée un template de tâche récurrente directement en base (pas d'endpoint public
// de lecture/complétion — seule sa génération quotidienne via GET /api/tasks est testée ici)
async function createRecurringTaskTemplate(overrides: { title?: string; isActive?: boolean } = {}) {
  return prisma.recurringTask.create({
    data: {
      title: overrides.title ?? 'Tâche récurrente de test',
      isActive: overrides.isActive ?? true,
    },
  })
}

// Supprime un template et les instances Task générées à partir de lui.
// Nécessaire car onDelete: SetNull ne supprime pas les tâches générées (voir schéma Prisma).
async function deleteRecurringTaskTemplateAndItsGeneratedTasks(recurringTaskId: string): Promise<void> {
  await prisma.task.deleteMany({ where: { recurringTaskId } })
  await prisma.recurringTask.delete({ where: { id: recurringTaskId } })
}

// ─── Tests ──────────────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('retourne 401 sans authentification', async () => {
    const response = await request(app).get('/api/tasks')
    expect(response.status).toBe(401)
  })

  it('retourne la liste de toutes les tâches', async () => {
    await createTask({ title: 'Tâche A' })
    await createTask({ title: 'Tâche B' })

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThanOrEqual(2)
  })

  it('inclut les infos de l\'assigné quand la tâche est prise', async () => {
    await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    const taskWithAssignee = response.body.find((t: { assignee: unknown }) => t.assignee !== null)
    expect(taskWithAssignee).toBeDefined()
    expect(taskWithAssignee.assignee.id).toBe(TEST_VENDOR_ID)
  })

  it('inclut les tâches terminées avec doneAt', async () => {
    await createTask({ status: TaskStatus.done, doneAt: new Date(), assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    const doneTask = response.body.find((t: { status: string }) => t.status === 'done')
    expect(doneTask).toBeDefined()
    expect(doneTask.doneAt).not.toBeNull()
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  it('retourne 401 sans authentification', async () => {
    const response = await request(app).post('/api/tasks').send({ title: 'Nouvelle tâche' })
    expect(response.status).toBe(401)
  })

  it('crée une tâche avec un titre', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ title: 'Préparer la vitrine' })

    expect(response.status).toBe(201)
    expect(response.body).toMatchObject({
      title: 'Préparer la vitrine',
      status: 'todo',
      assignee: null,
      doneAt: null,
    })
    expect(response.body.id).toBeDefined()
  })

  it('crée une tâche avec description et date limite', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({
        title: 'Inventaire stock',
        description: 'Compter les téléphones en stock',
        dueDate: '2026-07-15',
      })

    expect(response.status).toBe(201)
    expect(response.body.description).toBe('Compter les téléphones en stock')
    expect(response.body.dueDate).toBe('2026-07-15')
  })

  it('retourne 400 sans titre', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({})

    expect(response.status).toBe(400)
  })

  it('retourne 400 si le titre dépasse 100 caractères', async () => {
    const response = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .send({ title: 'A'.repeat(101) })

    expect(response.status).toBe(400)
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/tasks/:id/take', () => {
  it('retourne 401 sans authentification', async () => {
    const task = await createTask()
    const response = await request(app).patch(`/api/tasks/${task.id}/take`)
    expect(response.status).toBe(401)
  })

  it('assigne la tâche à l\'utilisateur courant et passe en doing', async () => {
    const task = await createTask()

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/take`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('doing')
    expect(response.body.assignee).toMatchObject({ id: TEST_VENDOR_ID })
  })

  it('retourne 409 si la tâche est déjà prise', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/take`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(409)
  })

  it('retourne 404 pour un ID inexistant', async () => {
    const response = await request(app)
      .patch('/api/tasks/id-qui-nexiste-pas/take')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/tasks/:id/done', () => {
  it('retourne 401 sans authentification', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })
    const response = await request(app).patch(`/api/tasks/${task.id}/done`)
    expect(response.status).toBe(401)
  })

  it('marque la tâche comme terminée et définit doneAt', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })
    const beforeCompletion = new Date()

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/done`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    const afterCompletion = new Date()

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('done')
    expect(response.body.doneAt).not.toBeNull()

    const doneAt = new Date(response.body.doneAt as string)
    expect(doneAt.getTime()).toBeGreaterThanOrEqual(beforeCompletion.getTime())
    expect(doneAt.getTime()).toBeLessThanOrEqual(afterCompletion.getTime())
  })

  it('retourne doneAt au format ISO string', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/done`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    // Format attendu : "2026-06-29T14:30:00.000Z"
    expect(response.body.doneAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
  })

  it('autorise un admin à terminer la tâche de quelqu\'un d\'autre', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/done`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('done')
  })

  it('retourne 403 si l\'utilisateur n\'est pas l\'assigné ni admin', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_ADMIN_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/done`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(403)
  })

  it('retourne 409 si la tâche n\'est pas en doing', async () => {
    const task = await createTask() // status: todo

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/done`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(409)
  })

  it('retourne 404 pour un ID inexistant', async () => {
    const response = await request(app)
      .patch('/api/tasks/id-qui-nexiste-pas/done')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('PATCH /api/tasks/:id/release', () => {
  it('retourne 401 sans authentification', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })
    const response = await request(app).patch(`/api/tasks/${task.id}/release`)
    expect(response.status).toBe(401)
  })

  it('remet la tâche en todo et enlève l\'assigné', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/release`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('todo')
    expect(response.body.assignee).toBeNull()
  })

  it('autorise un admin à libérer la tâche de quelqu\'un d\'autre', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/release`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('todo')
  })

  it('retourne 403 si l\'utilisateur n\'est pas l\'assigné ni admin', async () => {
    const task = await createTask({ status: TaskStatus.doing, assigneeId: TEST_ADMIN_ID })

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/release`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(403)
  })

  it('retourne 409 si la tâche n\'est pas en doing', async () => {
    const task = await createTask() // status: todo

    const response = await request(app)
      .patch(`/api/tasks/${task.id}/release`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(409)
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('DELETE /api/tasks/:id', () => {
  it('retourne 401 sans authentification', async () => {
    const task = await createTask()
    const response = await request(app).delete(`/api/tasks/${task.id}`)
    expect(response.status).toBe(401)
  })

  it('retourne 403 pour un vendeur', async () => {
    const task = await createTask()

    const response = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(403)
  })

  it('supprime la tâche en tant qu\'admin', async () => {
    const task = await createTask()

    const response = await request(app)
      .delete(`/api/tasks/${task.id}`)
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(204)

    const deletedTask = await prisma.task.findUnique({ where: { id: task.id } })
    expect(deletedTask).toBeNull()
  })

  it('retourne 404 pour un ID inexistant', async () => {
    const response = await request(app)
      .delete('/api/tasks/id-qui-nexiste-pas')
      .set('Authorization', `Bearer ${makeAdminToken()}`)

    expect(response.status).toBe(404)
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('GET /api/tasks/history', () => {
  it('retourne 401 sans authentification', async () => {
    const response = await request(app)
      .get('/api/tasks/history')
      .query({ date: '2026-06-29' })
    expect(response.status).toBe(401)
  })

  it('retourne les tâches terminées à la date indiquée', async () => {
    const today = new Date()
    await createTask({ status: TaskStatus.done, doneAt: today, assigneeId: TEST_VENDOR_ID })

    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const todayString = `${year}-${month}-${day}`

    const response = await request(app)
      .get('/api/tasks/history')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .query({ date: todayString })

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThanOrEqual(1)
    expect(response.body[0].status).toBe('done')
  })

  it('ne retourne pas les tâches terminées un autre jour', async () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const taskFromYesterday = await createTask({
      status: TaskStatus.done,
      doneAt: yesterday,
      assigneeId: TEST_VENDOR_ID,
    })

    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    const response = await request(app)
      .get('/api/tasks/history')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .query({ date: `${year}-${month}-${day}` })

    expect(response.status).toBe(200)
    // La tâche d'hier ne doit PAS apparaître dans les résultats d'aujourd'hui
    const foundTask = response.body.find((t: { id: string }) => t.id === taskFromYesterday.id)
    expect(foundTask).toBeUndefined()
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('GET /api/tasks/history/active-dates', () => {
  it('retourne 401 sans authentification', async () => {
    const response = await request(app)
      .get('/api/tasks/history/active-dates')
      .query({ month: 6, year: 2026 })
    expect(response.status).toBe(401)
  })

  it('retourne les dates du mois ayant des tâches terminées', async () => {
    const today = new Date()
    await createTask({ status: TaskStatus.done, doneAt: today, assigneeId: TEST_VENDOR_ID })

    const response = await request(app)
      .get('/api/tasks/history/active-dates')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .query({ month: today.getMonth() + 1, year: today.getFullYear() })

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body)).toBe(true)
    expect(response.body.length).toBeGreaterThan(0)
  })

  it('retourne un tableau vide si aucune tâche terminée ce mois', async () => {
    const response = await request(app)
      .get('/api/tasks/history/active-dates')
      .set('Authorization', `Bearer ${makeVendorToken()}`)
      .query({ month: 1, year: 2000 })

    expect(response.status).toBe(200)
    expect(response.body).toEqual([])
  })
})

// ────────────────────────────────────────────────────────────────────────────────

describe('GET /api/tasks — génération quotidienne des instances de tâches récurrentes', () => {
  const createdRecurringTaskIds: string[] = []

  afterEach(async () => {
    for (const recurringTaskId of createdRecurringTaskIds) {
      await deleteRecurringTaskTemplateAndItsGeneratedTasks(recurringTaskId)
    }
    createdRecurringTaskIds.length = 0
  })

  it('crée une instance todo pour un template actif qui n\'en a pas encore pour aujourd\'hui', async () => {
    const template = await createRecurringTaskTemplate({ title: 'Qualifs' })
    createdRecurringTaskIds.push(template.id)

    const response = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(response.status).toBe(200)

    const generatedInstance = await prisma.task.findFirst({ where: { recurringTaskId: template.id } })
    expect(generatedInstance).not.toBeNull()
    expect(generatedInstance?.title).toBe('Qualifs')
    expect(generatedInstance?.status).toBe(TaskStatus.todo)
    expect(generatedInstance?.createdById).toBeNull()

    // La tâche générée doit aussi apparaître dans la réponse, comme une tâche manuelle
    const taskInResponse = response.body.find((task: { title: string }) => task.title === 'Qualifs')
    expect(taskInResponse).toBeDefined()
    expect(taskInResponse.status).toBe('todo')
  })

  it('ne crée pas d\'instance pour un template inactif', async () => {
    const template = await createRecurringTaskTemplate({ title: 'Template inactif', isActive: false })
    createdRecurringTaskIds.push(template.id)

    await request(app).get('/api/tasks').set('Authorization', `Bearer ${makeVendorToken()}`)

    const generatedInstance = await prisma.task.findFirst({ where: { recurringTaskId: template.id } })
    expect(generatedInstance).toBeNull()
  })

  it('ne crée pas de doublon si appelé deux fois de suite (idempotence)', async () => {
    const template = await createRecurringTaskTemplate({ title: 'Collecte et SAVI' })
    createdRecurringTaskIds.push(template.id)

    await request(app).get('/api/tasks').set('Authorization', `Bearer ${makeVendorToken()}`)
    await request(app).get('/api/tasks').set('Authorization', `Bearer ${makeVendorToken()}`)

    const generatedInstances = await prisma.task.findMany({ where: { recurringTaskId: template.id } })
    expect(generatedInstances.length).toBe(1)
  })

  it('une instance générée peut être prise puis terminée exactement comme une tâche manuelle', async () => {
    const template = await createRecurringTaskTemplate({ title: 'Rangement BO/reserve' })
    createdRecurringTaskIds.push(template.id)

    await request(app).get('/api/tasks').set('Authorization', `Bearer ${makeVendorToken()}`)
    const generatedInstance = await prisma.task.findFirstOrThrow({ where: { recurringTaskId: template.id } })

    const takeResponse = await request(app)
      .patch(`/api/tasks/${generatedInstance.id}/take`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(takeResponse.status).toBe(200)
    expect(takeResponse.body.status).toBe('doing')
    expect(takeResponse.body.assignee).toMatchObject({ id: TEST_VENDOR_ID })

    const completeResponse = await request(app)
      .patch(`/api/tasks/${generatedInstance.id}/done`)
      .set('Authorization', `Bearer ${makeVendorToken()}`)

    expect(completeResponse.status).toBe(200)
    expect(completeResponse.body.status).toBe('done')
    expect(completeResponse.body.doneAt).not.toBeNull()
  })
})
