import { PrismaClient, Role, TaskStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// ─── Constantes ────────────────────────────────────────────────────────────────

const BCRYPT_SALT_ROUNDS = 10
const DEFAULT_PASSWORD = 'Orange2024!'
const SEED_MONTH = 6
const SEED_YEAR = 2026
const SEED_DAYS_START = 2   // 2 juin
const SEED_DAYS_END = 22    // 22 juin (veille du "aujourd'hui")

// ─── Types ─────────────────────────────────────────────────────────────────────

interface IndicatorSales {
  HD: number
  ABO: number
  Terminaux: number
  Challenge: number
  MP: number
  Parafoudre: number
  Divertissement: number
}

interface UserSeedData {
  cuid: string
  name: string
  color: string
  role: Role
}

// ─── Données de référence ──────────────────────────────────────────────────────

const INDICATORS_TO_CREATE = [
  { name: 'HD',             type: 'daily' as const, order: 1 },
  { name: 'ABO',            type: 'daily' as const, order: 2 },
  { name: 'Terminaux',      type: 'daily' as const, order: 3 },
  { name: 'Challenge',      type: 'daily' as const, order: 4 },
  { name: 'MP',             type: 'daily' as const, order: 5 },
  { name: 'Parafoudre',     type: 'daily' as const, order: 6 },
  { name: 'Divertissement', type: 'daily' as const, order: 7 },
]

const USERS_TO_CREATE: UserSeedData[] = [
  { cuid: 'MKRB4729', name: 'Marie',  color: '#FF7900', role: Role.admin   },
  { cuid: 'SPHB3814', name: 'Sophie', color: '#58A6FF', role: Role.admin   },
  { cuid: 'LERN5042', name: 'Léa',    color: '#57C77E', role: Role.vendeur },
  { cuid: 'PLMN7263', name: 'Paul',   color: '#F2B14B', role: Role.vendeur },
  { cuid: 'EMKR9154', name: 'Emma',   color: '#B57BE8', role: Role.vendeur },
  { cuid: 'LCMS6437', name: 'Lucas',  color: '#FF8A73', role: Role.vendeur },
  { cuid: 'CHLB8521', name: 'Chloé', color: '#46CBB0', role: Role.vendeur },
  { cuid: 'THMS4698', name: 'Thomas', color: '#FF8FB8', role: Role.vendeur },
  { cuid: 'INSQ7312', name: 'Inès',  color: '#8C8AF0', role: Role.vendeur },
  { cuid: 'NOHB5847', name: 'Noah',   color: '#B6D957', role: Role.vendeur },
]

// Totaux de ventes sur le mois pour chaque vendeur (répartis ensuite sur les jours)
const VENDOR_MONTHLY_SALES: Record<string, IndicatorSales> = {
  Marie:  { HD: 14, ABO: 10, Terminaux: 15, Challenge: 8, MP: 5, Parafoudre: 7, Divertissement: 5 },
  Sophie: { HD: 12, ABO:  9, Terminaux: 12, Challenge: 7, MP: 4, Parafoudre: 6, Divertissement: 4 },
  Léa:    { HD: 13, ABO:  8, Terminaux: 12, Challenge: 6, MP: 3, Parafoudre: 5, Divertissement: 4 },
  Paul:   { HD: 10, ABO:  7, Terminaux:  9, Challenge: 5, MP: 3, Parafoudre: 4, Divertissement: 3 },
  Emma:   { HD: 11, ABO:  8, Terminaux: 10, Challenge: 6, MP: 4, Parafoudre: 5, Divertissement: 4 },
  Lucas:  { HD:  9, ABO:  6, Terminaux:  8, Challenge: 4, MP: 2, Parafoudre: 3, Divertissement: 2 },
  Chloé: { HD: 10, ABO:  7, Terminaux:  9, Challenge: 5, MP: 3, Parafoudre: 4, Divertissement: 3 },
  Thomas: { HD:  8, ABO:  5, Terminaux:  7, Challenge: 3, MP: 2, Parafoudre: 3, Divertissement: 2 },
  Inès:  { HD: 11, ABO:  8, Terminaux: 10, Challenge: 6, MP: 4, Parafoudre: 5, Divertissement: 3 },
  Noah:   { HD:  7, ABO:  5, Terminaux:  6, Challenge: 3, MP: 2, Parafoudre: 2, Divertissement: 2 },
}

// Objectifs mensuels communs à tous les vendeurs pour juin 2026
const MONTHLY_TARGETS_BY_INDICATOR: IndicatorSales = {
  HD: 20, ABO: 15, Terminaux: 15, Challenge: 12, MP: 8, Parafoudre: 10, Divertissement: 8,
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

function buildDatesForSeedPeriod(): Date[] {
  const dates: Date[] = []
  for (let day = SEED_DAYS_START; day <= SEED_DAYS_END; day++) {
    const paddedDay = String(day).padStart(2, '0')
    dates.push(new Date(`${SEED_YEAR}-${String(SEED_MONTH).padStart(2, '0')}-${paddedDay}`))
  }
  return dates
}

// Répartit un total de ventes sur N jours de façon naturelle (pas toujours le même jour)
function spreadSalesAcrossDays(totalSales: number, numberOfDays: number): number[] {
  const salesPerDay = Array<number>(numberOfDays).fill(0)
  let remainingSales = totalSales

  for (let dayIndex = 0; dayIndex < numberOfDays; dayIndex++) {
    if (remainingSales === 0) break

    const isLastDay = dayIndex === numberOfDays - 1
    if (isLastDay) {
      salesPerDay[dayIndex] = remainingSales
      break
    }

    // Vendre 1 si on a plus de jours que de ventes restantes, sinon aléatoire
    const daysRemaining = numberOfDays - dayIndex
    const mustSellToday = remainingSales >= daysRemaining
    const sellsToday = mustSellToday || Math.random() > 0.4

    if (sellsToday) {
      salesPerDay[dayIndex] = 1
      remainingSales -= 1
    }
  }

  return salesPerDay
}

// ─── Seed principal ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱 Démarrage du seed...\n')

  // Nettoyage dans l'ordre des dépendances
  await prisma.teamNote.deleteMany()
  await prisma.monthlyTarget.deleteMany()
  await prisma.dailySale.deleteMany()
  await prisma.task.deleteMany()
  await prisma.user.deleteMany()
  await prisma.indicator.deleteMany()

  // ── Indicateurs ──────────────────────────────────────────────────────────────
  const createdIndicators = await Promise.all(
    INDICATORS_TO_CREATE.map((indicator) => prisma.indicator.create({ data: indicator })),
  )
  const indicatorByName = Object.fromEntries(
    createdIndicators.map((indicator) => [indicator.name, indicator]),
  )
  console.log(`✓ ${createdIndicators.length} indicateurs créés`)

  // ── Utilisateurs ─────────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_SALT_ROUNDS)
  const createdUsers = await Promise.all(
    USERS_TO_CREATE.map((userData) =>
      prisma.user.create({
        data: { ...userData, password: hashedPassword, isFirstLogin: false },
      }),
    ),
  )
  const userByName = Object.fromEntries(
    createdUsers.map((user) => [user.name, user]),
  )
  console.log(`✓ ${createdUsers.length} utilisateurs créés (mdp: ${DEFAULT_PASSWORD})`)

  // ── Tâches ───────────────────────────────────────────────────────────────────
  const tasksToCreate = [
    {
      title: 'Retour piloté',
      status: TaskStatus.todo,
      createdById: userByName['Marie'].id,
    },
    {
      title: 'Mise à jour des étiquettes prix',
      status: TaskStatus.todo,
      createdById: userByName['Sophie'].id,
    },
    {
      title: 'Réorganiser les accessoires',
      status: TaskStatus.todo,
      createdById: userByName['Marie'].id,
    },
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
  await prisma.task.createMany({ data: tasksToCreate })
  console.log(`✓ ${tasksToCreate.length} tâches créées`)

  // ── Ventes journalières ───────────────────────────────────────────────────────
  const seedDates = buildDatesForSeedPeriod()
  const dailySalesToCreate: {
    date: Date
    userId: string
    indicatorId: string
    count: number
  }[] = []

  for (const user of createdUsers) {
    const vendorSales = VENDOR_MONTHLY_SALES[user.name]
    if (!vendorSales) continue

    for (const [indicatorName, monthlySalesTotal] of Object.entries(vendorSales)) {
      const indicator = indicatorByName[indicatorName]
      const salesPerDay = spreadSalesAcrossDays(monthlySalesTotal, seedDates.length)

      for (let dayIndex = 0; dayIndex < seedDates.length; dayIndex++) {
        const salesCount = salesPerDay[dayIndex]
        if (salesCount > 0) {
          dailySalesToCreate.push({
            date: seedDates[dayIndex],
            userId: user.id,
            indicatorId: indicator.id,
            count: salesCount,
          })
        }
      }
    }
  }
  await prisma.dailySale.createMany({ data: dailySalesToCreate })
  console.log(`✓ ${dailySalesToCreate.length} entrées de ventes journalières créées`)

  // ── Objectifs mensuels ────────────────────────────────────────────────────────
  const monthlyTargetsToCreate: {
    month: number
    year: number
    userId: string
    indicatorId: string
    target: number
  }[] = []

  for (const user of createdUsers) {
    for (const [indicatorName, targetValue] of Object.entries(MONTHLY_TARGETS_BY_INDICATOR)) {
      monthlyTargetsToCreate.push({
        month: SEED_MONTH,
        year: SEED_YEAR,
        userId: user.id,
        indicatorId: indicatorByName[indicatorName].id,
        target: targetValue,
      })
    }
  }
  await prisma.monthlyTarget.createMany({ data: monthlyTargetsToCreate })
  console.log(`✓ ${monthlyTargetsToCreate.length} objectifs mensuels créés`)

  // ── Notes équipe ─────────────────────────────────────────────────────────────
  const leaNote = await prisma.teamNote.create({
    data: {
      userId: userByName['Léa'].id,
      publicNote: 'Très bonne progression sur les accessoires. Continuer à développer la vente de protections.',
      privateNote: 'À accompagner sur la prise de rendez-vous SAV. Prévoir point individuel semaine 26.',
    },
  })
  await prisma.teamChallenge.createMany({
    data: [
      { noteId: leaNote.id, label: 'Challenge fibre', current: '9', target: '15', order: 0 },
      { noteId: leaNote.id, label: 'Terminaux premium', current: '3', target: '8', order: 1 },
    ],
  })
  console.log('✓ Notes équipe créées pour Léa (2 challenges)')

  console.log('\n✅ Seed terminé avec succès !')
}

main()
  .catch((error) => {
    console.error('❌ Erreur durant le seed :', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
