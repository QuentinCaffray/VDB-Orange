import { PrismaClient, Role, TaskStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const INDICATORS = [
  { name: 'HD', order: 1 },
  { name: 'ABO', order: 2 },
  { name: 'Terminaux', order: 3 },
  { name: 'Challenge', order: 4 },
  { name: 'MP', order: 5 },
  { name: 'Parafoudre', order: 6 },
  { name: 'Divertissement', order: 7 },
]

const USERS = [
  { cuid: 'MKRB4729', name: 'Marie', color: '#FF7900', role: Role.admin },
  { cuid: 'SPHB3814', name: 'Sophie', color: '#58A6FF', role: Role.admin },
  { cuid: 'LERN5042', name: 'Léa', color: '#57C77E', role: Role.vendeur },
  { cuid: 'PLMN7263', name: 'Paul', color: '#F2B14B', role: Role.vendeur },
  { cuid: 'EMKR9154', name: 'Emma', color: '#B57BE8', role: Role.vendeur },
  { cuid: 'LCMS6437', name: 'Lucas', color: '#FF8A73', role: Role.vendeur },
  { cuid: 'CHLB8521', name: 'Chloé', color: '#46CBB0', role: Role.vendeur },
  { cuid: 'THMS4698', name: 'Thomas', color: '#FF8FB8', role: Role.vendeur },
  { cuid: 'INSQ7312', name: 'Inès', color: '#8C8AF0', role: Role.vendeur },
  { cuid: 'NOHB5847', name: 'Noah', color: '#B6D957', role: Role.vendeur },
]

// Objectifs mensuels par indicateur (targets pour juin 2026)
const MONTHLY_TARGETS: Record<string, number> = {
  HD: 20,
  ABO: 15,
  Terminaux: 15,
  Challenge: 12,
  MP: 8,
  Parafoudre: 10,
  Divertissement: 8,
}

// Ventes journalières simulées par vendeur (distribution sur juin)
// Format: [HD, ABO, Terminaux, Challenge, MP, Parafoudre, Divertissement]
const SALES_TOTALS: Record<string, number[]> = {
  Marie:   [14, 10, 15, 8,  5, 7, 5],
  Sophie:  [12,  9, 12, 7,  4, 6, 4],
  Léa:     [13,  8, 12, 6,  3, 5, 4],
  Paul:    [10,  7,  9, 5,  3, 4, 3],
  Emma:    [11,  8, 10, 6,  4, 5, 4],
  Lucas:   [ 9,  6,  8, 4,  2, 3, 2],
  Chloé:   [10,  7,  9, 5,  3, 4, 3],
  Thomas:  [ 8,  5,  7, 3,  2, 3, 2],
  Inès:    [11,  8, 10, 6,  4, 5, 3],
  Noah:    [ 7,  5,  6, 3,  2, 2, 2],
}

function daysInJune2026(): Date[] {
  const days: Date[] = []
  // On simule des ventes du 2 au 22 juin (J-1 à aujourd'hui sauf le 1er)
  for (let d = 2; d <= 22; d++) {
    days.push(new Date(`2026-06-${String(d).padStart(2, '0')}`))
  }
  return days
}

function distribute(total: number, days: number): number[] {
  // Répartit un total sur N jours de façon pseudo-réaliste
  const result = Array(days).fill(0)
  let remaining = total
  for (let i = 0; i < days && remaining > 0; i++) {
    const give = i === days - 1 ? remaining : Math.min(Math.floor(Math.random() * 2) + (remaining > days - i ? 1 : 0), remaining)
    result[i] = give
    remaining -= give
  }
  return result
}

async function main() {
  console.log('🌱 Seeding database...')

  await prisma.teamNote.deleteMany()
  await prisma.monthlyTarget.deleteMany()
  await prisma.dailySale.deleteMany()
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()
  await prisma.indicator.deleteMany()

  // Indicateurs
  const indicators = await Promise.all(
    INDICATORS.map((ind) => prisma.indicator.create({ data: ind })),
  )
  console.log(`✓ ${indicators.length} indicateurs créés`)

  // Utilisateurs
  const hashedPassword = await bcrypt.hash('Orange2024!', 10)
  const users = await Promise.all(
    USERS.map((u) =>
      prisma.user.create({
        data: { ...u, password: hashedPassword, isFirstLogin: false },
      }),
    ),
  )
  console.log(`✓ ${users.length} utilisateurs créés`)

  const userByName = Object.fromEntries(users.map((u) => [u.name, u]))
  const indicatorByName = Object.fromEntries(indicators.map((i) => [i.name, i]))

  // Tâches
  const taskData = [
    { title: 'Retour piloté', status: TaskStatus.todo, createdById: userByName['Marie'].id },
    { title: 'Mise à jour des étiquettes prix', status: TaskStatus.todo, createdById: userByName['Sophie'].id },
    { title: 'Réorganiser les accessoires', status: TaskStatus.todo, createdById: userByName['Marie'].id },
    {
      title: 'Réception commande iPhone 16',
      status: TaskStatus.doing,
      createdById: userByName['Marie'].id,
      assigneeId: userByName['Léa'].id,
    },
    {
      title: 'Formation tablette en rayon',
      status: TaskStatus.doing,
      createdById: userByName['Sophie'].id,
      assigneeId: userByName['Paul'].id,
    },
    {
      title: 'Nettoyage vitrine',
      status: TaskStatus.done,
      createdById: userByName['Chloé'].id,
      assigneeId: userByName['Chloé'].id,
      doneAt: new Date('2026-06-22T10:15:00'),
    },
    {
      title: 'Mise en place PLV Livebox',
      status: TaskStatus.done,
      createdById: userByName['Marie'].id,
      assigneeId: userByName['Lucas'].id,
      doneAt: new Date('2026-06-22T14:30:00'),
    },
    {
      title: 'Inventaire accessoires',
      status: TaskStatus.done,
      createdById: userByName['Thomas'].id,
      assigneeId: userByName['Thomas'].id,
      doneAt: new Date('2026-06-21T16:00:00'),
    },
    {
      title: 'Commande fournitures bureau',
      status: TaskStatus.done,
      createdById: userByName['Sophie'].id,
      assigneeId: userByName['Emma'].id,
      doneAt: new Date('2026-06-20T11:00:00'),
    },
    {
      title: 'Mise à jour affichage tarifaire',
      status: TaskStatus.done,
      createdById: userByName['Marie'].id,
      assigneeId: userByName['Inès'].id,
      doneAt: new Date('2026-06-19T09:30:00'),
    },
  ]
  await prisma.task.createMany({ data: taskData })
  console.log(`✓ ${taskData.length} tâches créées`)

  // Ventes journalières (juin 2026, du 2 au 22)
  const days = daysInJune2026()
  const indicatorNames = INDICATORS.map((i) => i.name)
  const salesData: {
    date: Date
    userId: string
    indicatorId: string
    count: number
  }[] = []

  for (const user of users) {
    const totals = SALES_TOTALS[user.name]
    if (!totals) continue
    for (let idx = 0; idx < indicatorNames.length; idx++) {
      const indicator = indicatorByName[indicatorNames[idx]]
      const distribution = distribute(totals[idx], days.length)
      for (let d = 0; d < days.length; d++) {
        if (distribution[d] > 0) {
          salesData.push({
            date: days[d],
            userId: user.id,
            indicatorId: indicator.id,
            count: distribution[d],
          })
        }
      }
    }
  }
  await prisma.dailySale.createMany({ data: salesData })
  console.log(`✓ ${salesData.length} entrées de ventes créées`)

  // Objectifs mensuels — juin 2026
  const targetsData: {
    month: number
    year: number
    userId: string
    indicatorId: string
    target: number
  }[] = []
  for (const user of users) {
    for (const [indName, target] of Object.entries(MONTHLY_TARGETS)) {
      targetsData.push({
        month: 6,
        year: 2026,
        userId: user.id,
        indicatorId: indicatorByName[indName].id,
        target,
      })
    }
  }
  await prisma.monthlyTarget.createMany({ data: targetsData })
  console.log(`✓ ${targetsData.length} objectifs mensuels créés`)

  // Note équipe pour Léa
  await prisma.teamNote.create({
    data: {
      userId: userByName['Léa'].id,
      publicNote: 'Très bonne progression sur les accessoires. Continuer à développer la vente de protections.',
      privateNote: 'À accompagner sur la prise de rendez-vous SAV. Prévoir point individuel semaine 26.',
      challengeLabel: 'Challenge fibre',
      challengeCurrent: 9,
      challengeTarget: 15,
    },
  })
  console.log('✓ Note équipe créée pour Léa')

  console.log('\n✅ Seed terminé !')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
