# The Crew (VDB Orange)

Outil mobile du quotidien d'une boutique Orange : tâches de boutique, pointage
des ventes par vendeur, objectifs du mois, et un espace d'encadrement réservé à
la direction. En service pour une équipe d'une dizaine de vendeurs.

Conçu, développé et déployé seul. Présentation détaillée :
**[portfolio-eslabs.up.railway.app/projets/the-crew](https://portfolio-eslabs.up.railway.app/projets/the-crew)**

## Ce qu'il fait

- **Tâches** — kanban de boutique (à faire / en cours / fait), tâches
  récurrentes générées depuis des modèles, un `409` si deux vendeurs prennent
  la même tâche.
- **Pointage des ventes** — chaque vendeur saisit ses ventes du jour ; sept
  indicateurs suivis. Pointage limité à trente jours en arrière, historique
  figé — la triche est structurellement impossible.
- **Objectifs** — progression par indicateur vers la cible du mois, vue équipe
  avec jauges empilées par vendeur.
- **Encadrement** — notes de coaching partagées avec le vendeur d'un côté,
  notes privées jamais exposées à l'API vendeur de l'autre.
- **Temps réel** — un EventBus en mémoire alimente un flux Server-Sent Events :
  les écrans des autres se mettent à jour sans rechargement. Reconnexion
  automatique, heartbeat pour tenir la connexion derrière Railway.

## Pile

| Couche | Technologies |
|---|---|
| Frontend | React 19 · TypeScript · Vite · TailwindCSS v4 · TanStack Query · React Hook Form · Zod · PWA (`vite-plugin-pwa`) |
| Backend | Node · Express 5 · Prisma · PostgreSQL 16 · SSE (EventBus maison) |
| Sécurité | Argon2 · JWT rotatif (refresh token hashé en base) · Helmet · rate-limiting · cookies HttpOnly |
| Tests | Vitest · Testing Library · MSW (frontend) · Vitest (backend) |
| Infra | Docker Compose (Postgres) en dev · Railway en prod |

Monorepo : [`backend/`](backend) · [`frontend/`](frontend). Documentation
produit dans [`PRD.md`](PRD.md) et [`PLANNING.md`](PLANNING.md).

## Développement

```bash
# Postgres + backend + frontend, en une commande
npm install
npm run dev
```

Le script `dev` lance `docker compose up` (Postgres), puis les serveurs backend
et frontend en parallèle. Voir `docker-compose.yml` pour les identifiants de
base locale.

```bash
npm run db:reset   # réinitialise la base (migrations + seed)
npm test           # tests backend + frontend
```

## Variables d'environnement

À renseigner dans `backend/.env` (voir `backend/.env.example`) : `DATABASE_URL`,
`JWT_SECRET`, `ALLOWED_ORIGINS`, `PORT`.
