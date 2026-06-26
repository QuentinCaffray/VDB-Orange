# The Crew — Product Requirements Document · v2.1

Application interne de gestion d'équipe — Boutique Orange · Mobile-first (+ desktop) · Juin 2026

> « The Crew » est une application interne qui réunit en un seul outil la gestion des tâches de boutique, le pointage quotidien des ventes par vendeur et le suivi des objectifs du mois, plus un espace d'encadrement réservé à la direction. Objectif : remplacer les fichiers papier / tableurs épars par un outil mobile simple, motivant et fiable.

**~10 utilisateurs · Mobile-first · Déclinaison desktop · 2 rôles : vendeur / admin**

---

## 1. Contexte & problème

Une boutique Orange compte une dizaine de vendeurs, encadrés par une directrice et une adjointe. Au quotidien, plusieurs besoins ne sont pas outillés ou le sont mal :

- Les tâches de boutique (réassort, étiquetage, rangement…) sont distribuées à l'oral, sans visibilité sur qui fait quoi.
- Le pointage des ventes par indicateur se fait sur papier, sans vue d'équipe en temps réel.
- Le suivi des objectifs du mois manque de lisibilité pour les vendeurs.
- L'encadrement n'a pas d'espace dédié pour noter le suivi individuel (points à améliorer, notes privées).
- Aucun historique fiable de ce qui a été fait et quand.

---

## 2. Objectifs

- Centraliser tâches, ventes et objectifs dans une app mobile rapide à utiliser entre deux clients.
- Responsabiliser chaque vendeur : il s'attribue ses tâches et pointe lui-même ses ventes.
- Rendre la performance visible et motivante (code couleur par vendeur, progression vers les objectifs).
- Donner à l'encadrement un espace de suivi confidentiel.
- Garantir un historique non falsifiable (anti-triche).

---

## 3. Utilisateurs & rôles

| Rôle | Qui | Permissions |
|---|---|---|
| **Vendeur** | ~8 personnes | Créer / prendre / terminer des tâches · pointer ses ventes (jour) · consulter et corriger sa progression du mois · voir ses notes de coaching et le challenge · changer son mot de passe. L'onglet « Suivi » affiche une vue personnelle « Mon suivi » (ses propres notes partagées et challenges) — pas la vue de l'équipe. |
| **Admin** | Directrice + adjointe | Tout le périmètre vendeur + créer / éditer les comptes · définir les couleurs des vendeurs · fixer les objectifs et la liste des indicateurs · rédiger les notes (publiques et privées) · consulter la fiche de n'importe quel vendeur. |

---

## 4. Authentification

- Connexion par identifiant **CUID** (4 lettres + 4 chiffres, ex. `DQHB7493`) + mot de passe.
- Les comptes sont créés exclusivement par un admin, qui définit le CUID et un mot de passe provisoire.
- À la première connexion, l'utilisateur définit son propre mot de passe personnel. Il remplace celui fourni par la direction.
- Changement de mot de passe disponible depuis le profil (avec vérification de l'ancien mot de passe).

---

## 5. Fonctionnalités

### 5.1 — Dashboard

Point d'entrée de l'application. Affiche un résumé personnalisé selon le rôle.

**Vue vendeur**
- Salutation + date du jour.
- Chips « Mes ventes aujourd'hui » (compteur par indicateur journalier).
- Carte « Tâches actives » (nb À faire / En cours, cliquable → page Tâches).
- Barres de progression « Ma progression du mois » (indicateurs avec objectif fixé uniquement).

**Vue admin**
- Même structure que le vendeur pour les sections personnelles.
- **Classement du mois** — Leaderboard par indicateur : classement des vendeurs (🥇🥈🥉) avec total équipe, barre proportionnelle à la couleur du vendeur. Navigation mois par mois.

### 5.2 — Tâches « boutique » (Kanban)

- Trois onglets : **À faire · En cours · Fait**.
- Une tâche porte un titre, une description optionnelle et une date d'échéance optionnelle.
- **Tout utilisateur** peut créer une tâche (feuille modale « Nouvelle tâche »).
- Chacun peut s'attribuer une tâche libre (bouton « Prendre ») → elle passe en **En cours**.
- Une tâche prise ne peut être reprise par un autre ; seul son porteur (ou un admin) la passe à « Fait » ou la remet à disposition.
- La direction peut supprimer n'importe quelle tâche.
- **Temps réel** : toute action (prise, complétion, création, suppression) est propagée instantanément sur tous les clients via SSE.

### 5.3 — Historique (calendrier)

- Accessible via icône calendrier depuis la page Tâches.
- Vue mensuelle : les jours avec activité sont marqués. Au tap sur un jour → liste des tâches faites ce jour-là (auteur + heure).
- **Lecture seule, non modifiable** — garantie anti-triche. Les jours futurs sont inactifs.
- Navigation mois par mois.

### 5.4 — Objectifs — onglet « Jour »

Deux sous-vues, basculables par un sélecteur segmenté :

**✎ Je pointe**
Liste des indicateurs journaliers. Compteur `− valeur +` à la couleur du vendeur. `+` ajoute une vente, `−` corrige. Chaque vendeur ne modifie que sa propre valeur. Navigation entre jours (jusqu'à 30 jours en arrière).

**Équipe**
Pour chaque indicateur, une jauge empilée où chaque segment représente la contribution d'un vendeur à sa couleur, avec le total à droite. Légende couleur / prénom. **Temps réel** via SSE.

Indicateurs suivis : **HD** (internet), **ABO** (forfaits), **Terminaux**, **Challenge**, **MP** (Mobile Protect), **Parafoudre**, **Divertissement**. Liste éditable par un admin.

### 5.5 — Objectifs — onglet « Mois »

**Vue vendeur**
Barres de progression par indicateur vers la cible fixée (ex. `12 / 15`). Indicateur **Validé** (vert ✓) lorsque la valeur atteint la cible. Rythme journalier conseillé affiché si en retard (ex. « +2/jour pour atteindre l'objectif »). Correction du total mensuel possible (bouton « Corriger »). Saisie directe pour les indicateurs de type mensuel.

**Vue admin**
Sélecteur de vendeur. Bouton « Modifier les objectifs » pour éditer les cibles (uniquement sur le mois en cours). Navigation entre les mois passés en lecture seule. Barre d'actions flottante avec Annuler / Enregistrer. **Temps réel** : les corrections et changements d'objectif se propagent sur tous les clients.

### 5.6 — Suivi équipe `admin`

Accessible uniquement par les admins (onglet masqué aux vendeurs). Sélecteur de vendeur en tête.

**Zone partagée — visible par le vendeur depuis son profil**
Notes de coaching (points à améliorer) et suivi du challenge en cours (barre de progression avec valeur actuelle / cible).

**Notes privées — direction uniquement**
Espace de notes confidentielles, jamais visible par le vendeur. Démarcation visuelle volontairement douce (gris ardoise, pointillés).

### 5.7 — Profil

- Avatar couleur, nom, rôle, CUID.
- Changer son mot de passe.
- Vue en lecture seule de ses notes de coaching et challenge (zone partagée par l'admin).
- Section **Administration** (admins) : accès Gestion des comptes.
- Déconnexion.

### 5.8 — Gestion des comptes `admin`

- Liste des membres (avatar, nom, rôle, CUID).
- Création d'un vendeur : CUID + mot de passe provisoire.
- Attribution / modification de la couleur d'un vendeur.
- Réinitialisation de mot de passe.

### 5.9 — Gestion des indicateurs `admin`

- Liste des indicateurs actifs et inactifs.
- Création, édition (nom, type jour/mois, ordre), désactivation.
- Définition des objectifs globaux (tous les vendeurs en une action) ou individuel.

---

## 6. Temps réel (SSE)

Toutes les mutations critiques sont propagées en temps réel à tous les clients connectés via Server-Sent Events.

| Event | Déclencheur | Impact frontend |
|---|---|---|
| `task.created` | Nouvelle tâche | Ajout au cache [`tasks`] |
| `task.taken` | Prise de tâche | Mise à jour du cache [`tasks`] |
| `task.completed` | Tâche terminée | Mise à jour du cache [`tasks`] |
| `task.released` | Remise à dispo | Mise à jour du cache [`tasks`] |
| `task.deleted` | Suppression | Retrait du cache [`tasks`] |
| `sale.updated` | Pointage journalier | Invalidation [`sales/daily`] + [`sales/monthly`] |
| `sale.monthly.corrected` | Correction total mensuel | Invalidation [`sales/monthly`] |
| `monthly.target.updated` | Modif objectif par admin | Invalidation [`sales/monthly`] |

Architecture : EventBus en mémoire (suffisant pour une instance unique sur Railway). Si scaling multi-instances → migrer vers `pg_notify` (Postgres LISTEN/NOTIFY).

---

## 7. Système de design

### Couleurs principales

| Rôle | Valeur |
|---|---|
| Orange primaire (marque, CTA) | `#FF7900` |
| Noir / texte | `#1A1A1A` |
| Fond application (crème clair) | `#FBF7F3` |
| Vert validé | `#22A650` |
| Vert en cours | `#57C77E` |
| Zone privée (ardoise) | `#5B6B7B` / fond `#F3F5F8` |

Mode sombre supporté (bascule depuis le profil).

### Couleurs d'identité vendeur

Une couleur unique par vendeur, utilisée partout (avatars, jauges, compteurs). Modifiable uniquement par un admin.

### Typographie

- **Caveat** — manuscrite, pour les titres et chiffres clés (ton chaleureux).
- **Nunito** — corps de texte, labels et données (lisible, arrondie).

---

## 8. Règles métier clés

1. Prendre une tâche la déplace immédiatement en « En cours » et l'attribue au vendeur. Tentative simultanée de deux vendeurs → le second reçoit une erreur 409.
2. L'historique des tâches faites est figé : aucune modification a posteriori.
3. Un objectif n'est « Validé » que lorsque la valeur atteint ou dépasse la cible.
4. Les objectifs et indicateurs sont définis par un admin ; le vendeur les consulte en lecture seule.
5. Les couleurs des vendeurs sont gérées par les admins uniquement.
6. Les notes privées de la fiche de suivi ne sont jamais accessibles aux vendeurs.
7. Le pointage journalier remonte à 30 jours maximum.

---

## 9. Plateformes & stack

**Mobile-first** : navigation par barre basse à 4 onglets (Tâches · Objectif · Suivi · Profil). L'onglet Suivi n'apparaît que pour les admins. App installable (PWA).

**Desktop** : navigation par sidebar (240px fixe), mêmes fonctionnalités.

| Couche | Technologie |
|---|---|
| Frontend | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| PWA | vite-plugin-pwa (Workbox) |
| Backend | Node.js + Express 5 + TypeScript |
| ORM | Prisma + PostgreSQL |
| Temps réel | SSE (Server-Sent Events) + EventBus en mémoire |
| État serveur | TanStack Query (React Query) |
| Infra | Railway (backend + DB) |

---

## 10. Hors périmètre (v1 — intentionnel)

- Notifications push.
- Export de données (PDF, CSV).
- Intégration avec les systèmes de caisse ou CRM Orange.
- Gestion multi-boutiques.
- Sync offline / mutations en file d'attente.

---

## 11. Pistes d'évolution (v2+)

### Priorité haute

- **Tâches récurrentes** — Templates de tâches qui se recréent automatiquement (ouverture, fermeture boutique). Déclenché par cron ou manuellement par un admin.

### Priorité moyenne

- **Export PDF** — Fiche mensuelle d'un vendeur pour les entretiens individuels.
- **Alertes retard objectifs** — Notification ou indicateur visuel si un vendeur est très en retard sur ses objectifs en fin de mois.

### Priorité basse / expérimental

- **Badges d'accomplissement** — « Premier à valider HD ce mois », « 5 tâches terminées en une journée ». Gamification légère.
- **Vue semaine** — Agrégation des pointages sur 7 jours glissants (complément à Jour / Mois).
- **Mode multi-boutiques** — Nécessiterait une refonte de la gestion des rôles et des permissions.
