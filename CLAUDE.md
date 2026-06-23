# VDB-Orange — Suivi des objectifs vendeurs

Application web mobile-first (PWA) pour gérer les objectifs et les tâches d'une boutique avec plusieurs vendeurs.

## Stack technique

| Couche      | Technologie                              |
|-------------|------------------------------------------|
| Frontend    | React + Vite + TypeScript + Tailwind CSS |
| PWA         | vite-plugin-pwa (Workbox)                |
| Backend     | Node.js + Express + TypeScript           |
| ORM         | Prisma                                   |
| Base de données | PostgreSQL                           |
| Infra local | Docker + docker-compose                  |

## Structure du monorepo

```
VDB-Orange/
├── frontend/          # App React PWA
├── backend/           # API REST Express
├── docker-compose.yml # PostgreSQL + services
└── CLAUDE.md
```

## Lancer le projet en local

```bash
# Démarrer la base de données
docker-compose up -d

# Backend (port 3001)
cd backend && npm run dev

# Frontend (port 5173)
cd frontend && npm run dev
```

## Fonctionnalités principales

1. **Objectifs vendeurs** — suivi des objectifs individuels et collectifs par période (jour/semaine/mois)
2. **Kanban tâches** — gestion des tâches de la boutique avec colonnes personnalisables
3. **Tableau de bord** — vue synthétique des performances de l'équipe

## Conventions générales

- TypeScript strict activé partout (`"strict": true`)
- Mobile-first : toujours designer pour 375px avant d'élargir
- Les variables d'environnement sont dans `.env` (jamais commitées)
- Les secrets ne vont jamais dans le code
