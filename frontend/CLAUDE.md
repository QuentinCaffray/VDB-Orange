# Frontend — React + Vite + TypeScript + Tailwind + PWA

Application mobile-first installable (PWA) pour VDB-Orange.

## Stack

- **Framework** : React 19 + Vite
- **Langage** : TypeScript (strict)
- **Styles** : Tailwind CSS v4
- **PWA** : vite-plugin-pwa (Workbox, manifest, service worker)
- **Routing** : React Router v7
- **État serveur** : TanStack Query (React Query)
- **Formulaires** : React Hook Form + Zod

## Structure des dossiers

```
frontend/
├── public/
│   └── icons/           # Icônes PWA (192x192, 512x512...)
├── src/
│   ├── assets/          # Images, fonts statiques
│   ├── components/      # Composants réutilisables
│   │   ├── ui/          # Composants de base (Button, Card, Badge...)
│   │   └── layout/      # Header, BottomNav, PageWrapper...
│   ├── pages/           # Une page = un dossier avec son index.tsx
│   ├── features/        # Fonctionnalités (objectives/, kanban/, auth/)
│   │   └── [feature]/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── api.ts   # Appels API de la feature
│   ├── hooks/           # Hooks globaux réutilisables
│   ├── lib/             # Config axios, queryClient, utils
│   ├── types/           # Types TypeScript partagés
│   └── main.tsx
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

## Commandes clés

```bash
npm run dev      # Dev server (port 5173, hot-reload)
npm run build    # Build production
npm run preview  # Preview du build production
```

## Conventions mobile-first

- **Toujours** partir du breakpoint mobile (375px) avant d'ajouter `md:` ou `lg:`
- La navigation principale est une **bottom navigation bar** (pas de sidebar)
- Touch targets minimum : 44x44px (accessibilité mobile)
- Utiliser `safe-area-inset` pour les notches iOS/Android

## Conventions de lisibilité (priorité absolue)

### Nommage des composants et hooks
```tsx
// Bien — nom complet, rôle évident
function TaskCard({ task, onTake }: TaskCardProps) { ... }
function useMonthlyObjectives(userId: string) { ... }

// Mal — trop court, rôle flou
function Card({ t, fn }: Props) { ... }
function useData(id: string) { ... }
```

### Props toujours typées avec une interface nommée
```tsx
// Bien
interface TaskCardProps {
  task: Task
  onTake: (taskId: string) => void
}

// Mal — type inline
function TaskCard({ task, onTake }: { task: Task; onTake: (id: string) => void }) { ... }
```

### Variables intermédiaires pour la lisibilité
```tsx
// Bien
const isTaskUnassigned = task.assigneeId === null
const canTakeTask = isTaskUnassigned && task.status === 'todo'

// Mal
{!task.assigneeId && task.status === 'todo' && <Button>Prendre</Button>}
```

### Handlers nommés explicitement
```tsx
// Bien
function handleTakeTask() { ... }
function handleCreateTask(formData: CreateTaskFormValues) { ... }

// Mal
const f = () => { ... }
onClick={() => doSomething(id)}
```

## Conventions composants

- Un composant = un fichier `.tsx` avec un export nommé
- Les composants `ui/` sont génériques et sans logique métier
- Les composants `features/` peuvent consommer des hooks et l'API
- Props typées avec une interface nommée `[Composant]Props`

## Appels API

- Tous les appels passent par `src/lib/axios.ts` (instance configurée avec baseURL + intercepteur JWT)
- Les hooks TanStack Query sont dans `features/[feature]/hooks/`
- Les fonctions fetch brutes sont dans `features/[feature]/api.ts`

## PWA

- Manifest configuré dans `vite.config.ts` (nom, icônes, couleurs, `display: standalone`)
- L'app doit fonctionner hors-ligne pour la consultation (cache Workbox)
- Les actions d'écriture nécessitent une connexion (pas de sync offline pour l'instant)
