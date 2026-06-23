# Vie de Boutique — Product Requirements Document · v1.0

Application interne de gestion d'équipe — Boutique Orange · Mobile-first (+ desktop) · Juin 2026

> « Vie de Boutique » est une application interne qui réunit en un seul outil la gestion des tâches de vide de boutique, le pointage quotidien des ventes par vendeur et le suivi des objectifs du mois, plus un espace d'encadrement réservé à la direction. Objectif : remplacer les fichiers papier / tableurs épars par un outil mobile simple, motivant et fiable.

**~10 utilisateurs · Mobile-first · Déclinaison desktop · 2 rôles : vendeur / admin**

---

## 1. Contexte & problème

Une boutique Orange compte une dizaine de vendeurs, encadrés par une directrice et une adjointe. Au quotidien, plusieurs besoins ne sont pas outillés ou le sont mal :

- Les tâches de vide de boutique (réassort, étiquetage, rangement…) sont distribuées à l'oral, sans visibilité sur qui fait quoi.
- Le pointage des ventes par indicateur se fait sur papier, sans vue d'équipe en temps réel.
- Le suivi des objectifs du mois et des challenges manque de lisibilité pour les vendeurs.
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
| **Vendeur** | ~8 personnes | Créer / prendre / terminer ses tâches · pointer ses ventes (jour) · consulter sa progression du mois (lecture seule) · voir ses « points à améliorer » et le challenge · changer son mot de passe. L'onglet Suivi lui est masqué. |
| **Admin** | Directrice + adjointe | Tout le périmètre vendeur + créer / éditer les comptes · définir les couleurs des vendeurs · fixer les objectifs et la liste des indicateurs · rédiger les notes (publiques et privées) · consulter la fiche de n'importe quel vendeur. |

---

## 4. Authentification

- Connexion par identifiant **CUID** (4 lettres + 4 chiffres, ex. `DQHB7493`) + mot de passe.
- Les comptes sont créés exclusivement par un admin, qui définit le CUID et un mot de passe provisoire.
- À la première connexion, l'utilisateur est invité à définir son propre mot de passe personnel (avec indicateur de robustesse). Il remplace celui fourni par la direction.

---

## 5. Fonctionnalités

### 5.1 — Tâches « vide de boutique » (Kanban)

- Trois colonnes : **À faire · En cours · Fait**.
- Une tâche porte un titre et une description optionnelle (pas de catégorie).
- **Tout utilisateur** peut créer une tâche (feuille modale « Nouvelle tâche »).
- Chacun peut s'attribuer une tâche libre (bouton « Prendre ») → elle passe en **En cours** et disparaît de « À faire ».
- Une tâche prise ne peut être reprise par un autre ; seul son porteur la passe à « Fait ».
- La direction peut modifier ou supprimer n'importe quelle tâche.

### 5.2 — Historique (calendrier)

- Accessible depuis l'écran Tâches (icône calendrier).
- Vue mensuelle : les jours avec activité sont marqués ; au tap sur un jour, la liste des tâches faites ce jour-là (auteur + heure).
- **Lecture seule, strictement non modifiable** — c'est la garantie anti-triche. Les jours futurs sont inactifs.

### 5.3 — Objectifs — onglet « Jour »

Deux sous-vues, basculables par un sélecteur segmenté :

**✎ Je pointe**
Liste des indicateurs ; chacun dispose d'un compteur `− valeur +` à la couleur du vendeur. Le `+` ajoute une vente ; `−`/`+` permettent de corriger une saisie. Chaque vendeur ne modifie que sa valeur.

**Équipe**
Pour chaque indicateur, une jauge empilée où chaque segment représente la contribution d'un vendeur, à sa couleur, avec le total à droite. Le segment du vendeur connecté est mis en évidence. Une légende associe couleur et prénom.

Indicateurs suivis : **HD** (internet), **ABO** (forfaits), **Terminaux**, **Challenge**, **MP** (Mobile Protect), **Parafoudre**, **Divertissement**. La liste est éditable par un admin.

### 5.4 — Objectifs — onglet « Mois »

**Vue vendeur — « Ma progression » (lecture seule)**
Titre + mois en cours, puis une barre de progression par indicateur vers la cible fixée par la direction (ex. `12 / 15`). Un indicateur n'est marqué **validé** (vert + ✓) que lorsque la valeur atteint exactement la cible ; en dessous, il reste « en cours ». Mention « Objectifs fixés par la direction ».

**Vue admin** `admin`
Cadre orange (mode admin), sélecteur de vendeur (menu déroulant) pour consulter n'importe quelle fiche, et un seul bouton « Modifier les objectifs » qui permet d'éditer les cibles, les valeurs et la liste des indicateurs.

### 5.5 — Suivi équipe (encadrement) `admin`

Fiche par vendeur, accessible uniquement par la directrice et l'adjointe (onglet masqué aux vendeurs). Sélecteur de vendeur en tête. Deux zones nettement distinctes :

**Zone partagée — visible par le vendeur**
Points à améliorer (notes de coaching) et suivi du challenge en cours (barre de progression). Le vendeur voit cette zone depuis son profil.

**Notes privées — direction uniquement**
Espace de notes confidentielles, jamais visible par le vendeur. Démarcation visuelle volontairement douce (gris ardoise, pointillés) — pas de rouge agressif.

### 5.6 — Profil

- Avatar (à la couleur du vendeur), nom, rôle, CUID.
- Section **Compte** : changer son mot de passe, ses informations, voir sa couleur (mention « modifiable par admin »).
- Section **Administration** (admins uniquement) : accès à la Gestion des comptes.
- Déconnexion.

### 5.7 — Gestion des comptes `admin`

- Liste des membres (avatar couleur, nom, rôle, CUID).
- Création d'un vendeur : l'admin définit CUID + mot de passe provisoire.
- Attribution / modification de la couleur d'un vendeur — réservée aux admins.
- Réinitialisation d'un mot de passe.

---

## 6. Système de design

### Couleurs principales

| Rôle | Valeur |
|---|---|
| Orange primaire (marque, CTA) | `#FF7900` |
| Noir / texte | `#1A1A1A` |
| Fond application (crème) | `#FBF7F3` |
| Vert validé | `#22A650` |
| Vert en cours | `#57C77E` |
| Zone privée (ardoise) | `#5B6B7B` / fond `#F3F5F8` |

### Couleurs d'identité vendeur

Une couleur unique par vendeur, utilisée partout (avatars, jauges, compteurs). **Modifiable uniquement par un admin.**

| Vendeur | Couleur |
|---|---|
| Marie | `#FF7900` |
| Sophie | `#58A6FF` |
| Léa | `#57C77E` |
| Paul | `#F2B14B` |
| Emma | `#B57BE8` |
| Lucas | `#FF8A73` |
| Chloé | `#46CBB0` |
| Thomas | `#FF8FB8` |
| Inès | `#8C8AF0` |
| Noah | `#B6D957` |

### Typographie

- **Caveat** — manuscrite, pour les titres, salutations et chiffres clés (ton chaleureux, friendly).
- **Nunito** — corps de texte, labels et données (lisible, arrondie).

---

## 7. Règles métier clés

1. Prendre une tâche la déplace immédiatement de « À faire » vers « En cours » et l'attribue au vendeur connecté.
2. L'historique des tâches faites est figé : aucune modification a posteriori.
3. Un objectif n'est « validé » que lorsque la valeur atteint **exactement** la cible.
4. Les objectifs et la liste des indicateurs sont définis par un admin ; le vendeur les consulte en lecture seule.
5. Les couleurs des vendeurs sont gérées par les admins uniquement.
6. Les notes privées de la fiche de suivi ne sont jamais accessibles aux vendeurs.

---

## 8. Plateformes

**Mobile-first** : navigation par barre basse à 4 onglets (Tâches · Objectif · Suivi · Profil). L'onglet Suivi n'apparaît que pour les admins.

**Desktop** : navigation par sidebar, mêmes fonctionnalités et règles de permissions.

---

## 9. Hors périmètre (v1)

- Notifications push.
- Statistiques avancées / export de données.
- Intégration avec les systèmes de caisse ou CRM Orange.
- Gestion multi-boutiques.

---

## 10. Pistes d'évolution

- Tableau de classement d'équipe (gamification) sur le mois.
- Rappels de tâches récurrentes (ouverture / fermeture).
- Export PDF du suivi mensuel pour les entretiens.
- Historique des objectifs sur plusieurs mois.
