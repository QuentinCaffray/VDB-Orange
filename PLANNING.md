# Planning de développement — VDB-Orange (The Crew)

Application web mobile-first (PWA) de suivi d'objectifs vendeurs et gestion de tâches kanban pour une boutique Orange (~10 vendeurs).

## Durée : 2 semaines · 10 jours ouvrés

---

## Semaine 1

### J1 — Lun 23/06 · Setup & design tokens ✅
- Init monorepo (Vite + React + TypeScript, Express + TypeScript)
- Docker Compose PostgreSQL
- Intégration Nunito + Caveat (Google Fonts)
- Variables CSS design tokens (couleurs Orange, fonds, bordures, ombres)
- Config Tailwind
- Structure des dossiers frontend + backend
- Bottom nav skeleton 4 onglets (Tâches, Objectif, Suivi, Profil)

### J2 — Mar 24/06 · Base de données ✅
- Schéma Prisma complet : `User`, `Task`, `DailySale`, `MonthlyTarget`, `Indicator`, `TeamNote`
- Migrations
- Seed réaliste : 10 membres (2 admins + 8 vendeurs) avec leurs couleurs, indicateurs, tâches d'exemple

### J3 — Mer 25/06 · Auth backend ✅
- `POST /auth/login` — CUID (4 lettres + 4 chiffres) + mot de passe, retourne JWT access + refresh
- `POST /auth/activate` — première connexion, définition du mot de passe définitif
- Middleware auth + guard rôles `vendeur` / `admin`
- Hash bcrypt des mots de passe

### J4 — Jeu 26/06 · Auth frontend ✅
- Écran Connexion : gradient hero orange, carte remontante, champ CUID + mot de passe
- Écran Première connexion : jauge de robustesse 4 segments
- Intégration API auth
- Stockage JWT, gestion des redirections selon rôle

### J5 — Ven 27/06 · Kanban backend ✅
- `GET /tasks` — liste des tâches par statut
- `POST /tasks` — création (tout utilisateur)
- `PATCH /tasks/:id/take` — prise de tâche → passage en « En cours »
- `PATCH /tasks/:id/done` — clôture (porteur uniquement)
- Permissions : créer = tous · terminer = porteur · modifier/supprimer = admin

---

## Semaine 2

### J6 — Lun 30/06 · Kanban frontend ✅
- Onglets À faire / En cours / Fait avec compteurs
- Cartes tâche : titre + label « Non attribuée » + bouton orange « Prendre »
- Bottom sheet nouvelle tâche (Titre + Description optionnelle)
- Déplacement automatique de colonne au `take`

### J7 — Mar 01/07 · Ventes & objectifs backend ✅
- `GET | PATCH /sales/daily` — saisie du stepper « Je pointe »
- `GET /sales/monthly` — progression mensuelle par vendeur
- `PUT /sales/targets` — objectifs par vendeur (admin)
- `PUT /sales/targets/all-vendors` — objectifs en masse (admin)
- `GET | POST | PATCH | DELETE /indicators` — liste d'indicateurs éditable (admin)
- Calculs de progression (valeur courante / cible)

### J8 — Mer 02/07 · Objectifs — onglet Jour ✅
- Segment « Je pointe » : stepper `− [valeur] +` à la couleur du vendeur connecté
- Segment « Équipe » : jauges empilées horizontales par vendeur + contour vendeur connecté
- Légende couleurs vendeurs en bas
- Badge rôle dans la Sidebar · chip nom+rôle sur mobile

### J9 — Jeu 03/07 · Objectifs — onglet Mois ✅
- Vue vendeur : barres de progression par indicateur (en cours vs validé), badge « ✓ Validé »
- Vue admin : sélecteur de membre (admins + vendeurs), objectifs éditables par champ, sauvegarde par vendeur
- Indicateurs JOUR (cumulés vers le mois) vs MOIS (saisie ponctuelle uniquement)
- Page admin `/admin/indicators` : renommer, changer le type, ajouter, supprimer

### J10 — Ven 04/07 · Suivi, Profil, Admin & finitions
- [ ] Suivi équipe admin : notes publiques + notes privées (section slate direction, fond `#F3F5F8`)
- [ ] Page Profil : avatar, infos, changer mot de passe, ma couleur (mention admin)
- [ ] Gestion des comptes admin : liste des 10 membres, attribution couleurs, CUID
- [ ] Historique calendaire : grille mensuelle lecture seule, jours avec activité
- [x] PWA : manifest, service worker Workbox, icônes 192×512, favicon — logo The Crew
- [x] App renommée **The Crew** (manifest, title, sidebar)
- [ ] Corrections bugs & polish final

---

## Récapitulatif des écrans

| # | Écran | Rôle | Jour | Statut |
|---|-------|------|------|--------|
| 1 | Connexion (CUID + mdp) | Tous | J4 | ✅ |
| 2 | Première connexion | Tous | J4 | ✅ |
| 3 | Kanban — Tâches | Tous | J6 | ✅ |
| 4 | Nouvelle tâche (bottom sheet) | Tous | J6 | ✅ |
| 5 | Historique calendaire | Tous | J10 | ⬜ |
| 6 | Objectifs · Jour · Je pointe | Tous | J8 | ✅ |
| 7 | Objectifs · Jour · Équipe | Tous | J8 | ✅ |
| 8 | Objectifs · Mois (vendeur) | Vendeur | J9 | ✅ |
| 9 | Objectifs · Mois (admin) | Admin | J9 | ✅ |
| 10 | Suivi équipe — fiche vendeur | Admin | J10 | ⬜ |
| 11 | Profil | Tous | J10 | ⬜ |
| 12 | Gestion des comptes | Admin | J10 | ⬜ |
