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

## Principe fondamental : lisibilité avant tout

Le code doit être compréhensible par un développeur qui n'a pas participé à son écriture. Priorité absolue à la clarté sur la concision.

### Nommage

- **Noms longs et explicites** — `taskAssigneeId` plutôt que `aId`, `currentUserRole` plutôt que `role`
- **Pas d'abréviations** — `indicator` pas `ind`, `user` pas `u`, `dayIndex` pas `d`
- **Verbes pour les fonctions** — `getUserById`, `createTask`, `calculateMonthlyProgress`
- **Noms en anglais** pour le code technique, termes métier en français dans les commentaires si nécessaire

### Structure

- **Une fonction = une responsabilité** — si une fonction fait deux choses, la découper
- **Longueur max ~30 lignes** par fonction — au-delà, extraire des helpers nommés
- **Pas de logique inline complexe** — extraire dans une variable nommée plutôt qu'un one-liner opaque
- **Constantes nommées** pour toute valeur magique (`MAX_PASSWORD_LENGTH = 72` pas `72`)

### TypeScript

- **Types explicites** sur toutes les fonctions (paramètres + retour)
- **Interfaces nommées** plutôt que types inline (`UserProfile` pas `{ id: string; name: string }`)
- **Zéro `any`** — si le type est inconnu, utiliser `unknown` et le narrower

### Ce qu'on évite

- Chaînes de méthodes de plus de 3 niveaux sans variable intermédiaire
- Ternaires imbriqués
- Logique cachée dans des raccourcis (`&&` pour conditionner un effet de bord)
- Commentaires qui expliquent QUOI (le nom suffit) — seulement POURQUOI si non évident

## Conventions générales

- TypeScript strict activé partout (`"strict": true`)
- Mobile-first : toujours designer pour 375px avant d'élargir
- Les variables d'environnement sont dans `.env` (jamais commitées)
- Les secrets ne vont jamais dans le code
