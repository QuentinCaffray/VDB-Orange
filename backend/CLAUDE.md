# Backend — Node.js + Express + TypeScript + Prisma

API REST pour l'application VDB-Orange.

## Stack

- **Runtime** : Node.js 20+
- **Framework** : Express 5
- **Langage** : TypeScript (strict)
- **ORM** : Prisma + PostgreSQL
- **Validation** : Zod
- **Auth** : JWT (access token + refresh token)

## Structure des dossiers

```
backend/
├── src/
│   ├── routes/        # Définition des routes Express
│   ├── controllers/   # Logique de traitement des requêtes
│   ├── services/      # Logique métier (pas d'accès DB direct)
│   ├── repositories/  # Accès Prisma uniquement ici
│   ├── middlewares/   # Auth, validation, error handler
│   ├── types/         # Types TypeScript partagés
│   └── index.ts       # Point d'entrée
├── prisma/
│   ├── schema.prisma  # Schéma de la base de données
│   └── migrations/    # Migrations générées par Prisma
├── .env               # Variables d'environnement (non commitées)
└── tsconfig.json
```

## Commandes clés

```bash
npm run dev           # Démarrage avec hot-reload (tsx watch)
npm run build         # Compilation TypeScript
npm run start         # Démarrage production

npx prisma migrate dev    # Créer et appliquer une migration
npx prisma studio         # Interface visuelle de la DB
npx prisma generate       # Regénérer le client Prisma
```

## Variables d'environnement (.env)

```
DATABASE_URL="postgresql://user:password@localhost:5432/vdb_orange"
JWT_SECRET="..."
JWT_REFRESH_SECRET="..."
PORT=3001
NODE_ENV=development
```

## Conventions d'architecture

- Une route = un fichier dans `routes/`
- Les controllers ne contiennent pas de logique métier, ils délèguent aux services
- Les repositories sont les seuls à appeler `prisma.xxx`
- Toujours valider les inputs avec Zod avant d'entrer dans un controller
- Les erreurs remontent via `next(error)` vers le middleware error handler global

## Conventions de lisibilité (priorité absolue)

### Nommage
```typescript
// Bien — nom complet et explicite
async function findTasksByStatus(status: TaskStatus): Promise<Task[]> { ... }

// Mal — abréviation opaque
async function findTasks(s: TaskStatus) { ... }
```

### Types explicites partout
```typescript
// Bien
async function createTask(data: CreateTaskInput): Promise<Task> { ... }

// Mal — retour implicite
async function createTask(data: CreateTaskInput) { ... }
```

### Constantes nommées
```typescript
// Bien
const BCRYPT_SALT_ROUNDS = 10
const JWT_EXPIRY_SECONDS = 60 * 60 // 1 heure

// Mal
await bcrypt.hash(password, 10)
```

### Pas de ternaires imbriqués
```typescript
// Bien
const isOwner = task.assigneeId === currentUserId
const isAdmin = currentUserRole === 'admin'
const canMarkAsDone = isOwner || isAdmin

// Mal
const canMarkAsDone = task.assigneeId === currentUserId || currentUserRole === 'admin'
```

## Modèles principaux (Prisma)

- `User` — vendeur ou manager de la boutique (rôle : `vendeur` | `admin`)
- `Task` — tâche kanban avec statut (`todo` | `doing` | `done`) et assignation
- `Indicator` — indicateur de vente (HD, ABO, Terminaux…)
- `DailySale` — vente saisie par un vendeur pour un indicateur à une date
- `MonthlyTarget` — objectif mensuel par vendeur et par indicateur
- `TeamNote` — notes publiques et privées de l'encadrement sur un vendeur
