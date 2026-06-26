import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const BCRYPT_SALT_ROUNDS = 10

// Crée ou met à jour le compte admin de développement au démarrage du serveur.
// Nécessite DEV_ADMIN_CUID et DEV_ADMIN_PASSWORD dans les variables d'environnement.
// Le compte est marqué isHidden: true — invisible dans tous les agrégats et sélecteurs.
export async function ensureDevAdminExists(): Promise<void> {
  const devCuid = process.env.DEV_ADMIN_CUID
  const devPassword = process.env.DEV_ADMIN_PASSWORD

  if (!devCuid || !devPassword) return

  const hashedPassword = await bcrypt.hash(devPassword, BCRYPT_SALT_ROUNDS)

  await prisma.user.upsert({
    where: { cuid: devCuid },
    create: {
      cuid: devCuid,
      name: 'Dev',
      password: hashedPassword,
      role: 'admin',
      color: '#888888',
      isFirstLogin: false,
      isHidden: true,
    },
    update: {
      isHidden: true,
      role: 'admin',
    },
  })

  console.log(`✓ Compte dev admin assuré (${devCuid})`)
}
