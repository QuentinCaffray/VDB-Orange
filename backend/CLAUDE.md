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

## Conventions

- Une route = un fichier dans `routes/`
- Les controllers ne contiennent pas de logique métier, ils délèguent aux services
- Les repositories sont les seuls à appeler `prisma.xxx`
- Toujours valider les inputs avec Zod avant d'entrer dans un controller
- Les erreurs remontent via `next(error)` vers le middleware error handler global

## Modèles principaux (Prisma)

- `User` — vendeur ou manager de la boutique
- `Objective` — objectif assigné à un vendeur sur une période
- `Task` — tâche kanban avec statut et assignation
- `Board` — tableau kanban (colonnes configurables)
