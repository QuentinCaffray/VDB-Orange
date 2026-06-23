# Handoff : App « Vie de Boutique » — Orange Boutique

## Overview
Application interne pour une boutique Orange (téléphonie, ~10 vendeurs). Elle permet de :
- gérer des **tâches de vide de boutique** (kanban À faire / En cours / Fait, chacun s'attribue une tâche) ;
- **pointer les ventes** par indicateur (HD, ABO, Terminaux, Challenge, MP, Parafoudre, Divertissement) avec un code couleur par vendeur ;
- suivre les **objectifs du mois** (progression vers des cibles fixées par la direction) ;
- un **espace Suivi équipe** réservé à l'encadrement (notes publiques + notes privées) ;
- un **historique calendaire en lecture seule** (anti-triche).

## À propos des fichiers de design
Les fichiers de ce bundle sont des **références de design réalisées en HTML** — des prototypes montrant l'apparence et le comportement souhaités, **pas du code de production à copier tel quel**. La tâche est de **recréer ces écrans dans l'environnement du codebase cible** (React, React Native, Flutter, SwiftUI…), avec ses patterns et sa librairie de composants. Si aucun environnement n'existe encore, choisir le framework le plus adapté (l'app est **mobile-first** + une déclinaison desktop prévue) et y implémenter les écrans.

Le fichier est un **Design Component** (`.dc.html`) : un format de prototype propriétaire. Pour le consulter, l'ouvrir dans un navigateur ; ne pas tenter de réutiliser son runtime. Se baser sur le rendu visuel + ce README.

## Fidélité
**Haute fidélité (hifi)** pour le mobile : couleurs, typographie, espacements et composants sont définitifs → recréer l'UI au pixel près avec les composants du codebase. Le fichier basse fidélité (`Wireframe App Orange.dc.html`) est fourni en complément pour la **structure/flux** et la **vue desktop** (encore en lo-fi).

## Système de design (Design Tokens)

### Couleurs
| Rôle | Hex |
|---|---|
| Orange primaire (Orange brand, CTA) | `#FF7900` |
| Orange foncé (accents texte) | `#C25E00`, `#B05500` |
| Noir / texte principal | `#1A1A1A` |
| Fond application (crème chaud) | `#FBF7F3` |
| Fond canvas / hors-cadre | `#ECE6DF` |
| Surface carte | `#FFFFFF` |
| Champ / surface secondaire | `#F5F1EC` |
| Texte secondaire | `#9A9088` |
| Texte tertiaire / placeholder | `#B0A89F`, `#C2B8AD` |
| Bordure douce | `#ECE4DA`, `#F0EAE3`, `#F4EEE7` |
| Vert succès (validé) | `#22A650` |
| Vert en cours (barres, couleur de Léa) | `#57C77E` |
| Tint vert clair (fonds) | `#E6F6EC`, `#EAF8EF` |
| Zone privée direction (slate, démarcation douce) | fond `#F3F5F8`, bordure `#C9D2DA`, texte `#5B6B7B`/`#6B7787` |
| Rouge déconnexion | `#D9534F` |

### Couleurs d'identité vendeur (assignées par un admin uniquement)
Marie `#FF7900` · Sophie `#58A6FF` · Léa `#57C77E` · Paul `#F2B14B` · Emma `#B57BE8` · Lucas `#FF8A73` · Chloé `#46CBB0` · Thomas `#FF8FB8` · Inès `#8C8AF0` · Noah `#B6D957`.
Ces couleurs servent partout (avatars, segments des jauges « Équipe », steppers « Je pointe »). **Modifiables seulement par la directrice et l'adjointe.**

### Typographie
- **Caveat** (Google Fonts, 500/600/700) — manuscrit, pour titres, chiffres de gamification, salutations, totaux. Tailles : 26–44px.
- **Nunito** (Google Fonts, 400/600/700/800/900) — corps, labels, données. Tailles : 10–17px. C'est la police par défaut (`body`).

### Rayons & ombres
- Rayons : champs 14px · cartes 16–18px · pills 11px · gros boutons 16px · avatars cercle 50%.
- Cadre téléphone : `border:8px solid #1A1A1A; border-radius:46px`.
- Ombres : carte `0 4px 14px rgba(0,0,0,0.05)` · CTA orange `0 8px 18px rgba(255,121,0,0.3)` · nav basse `0 -3px 16px rgba(0,0,0,0.04)`.
- Barre nav basse : 4 onglets (Tâches, Objectif, Suivi, Profil), actif = `#FF7900`, inactif = `#B7AEA4`, icônes SVG stroke 2.2.

## Écrans / Vues

### 1. Connexion
- Hero orange dégradé `linear-gradient(170deg,#FF7900,#FF9B3D)`, logo carré blanc, « Bonjour 👋 » en Caveat.
- Carte blanche remontante : champ **Identifiant (CUID)** + **Mot de passe** (œil), CTA « Se connecter », lien « Première connexion ? Activer mon compte ».
- **CUID = 4 lettres + 4 chiffres** (ex. `LERN5042`, `DQHB7493`). Créé par la direction.

### 2. Première connexion
- Déclenchée automatiquement au 1er login. Bandeau orange clair « Ce mot de passe remplace celui fourni par la direction ». Champs nouveau mdp + confirmation, jauge de robustesse (4 segments). CTA « Activer mon compte ».

### 3. Tâches (kanban)
- Header : titre Caveat « Vide de boutique » + date (`Jeudi 11 juin`), 2 boutons à droite : **calendrier** (icône, ouvre l'historique) puis **+** (orange, nouvelle tâche).
- Onglets de colonnes : `À faire · 3` (actif, noir) / `En cours · 2` / `Fait · 5`.
- Cartes de tâche (blanches) : **titre uniquement, pas de catégorie**. Si non attribuée → label « Non attribuée » + bouton orange « Prendre ». **Quand un vendeur prend une tâche, elle passe en colonne « En cours » et disparaît de « À faire ».** Une tâche « Fait » est figée (historique non modifiable).
- Tâches d'exemple : « Retour piloté », « Mise à jour des étiquettes prix », « Réorganiser les accessoires ».
- Tout utilisateur peut créer une tâche ; seul son porteur la passe à « Fait » ; la direction peut tout modifier.

### 4. Nouvelle tâche (bottom sheet)
- Feuille modale sur fond assombri. Champs : **Titre** + **Description (optionnel)**. **Pas de catégorie.** Boutons « Annuler » / « Créer la tâche ».

### 5. Historique (calendrier)
- Lecture seule (chip cadenas « Lecture »). Grille mois complet (Juin 2026, **lun→dim, 1er juin = lundi, 30 jours**). Jours avec activité : fond vert clair + point vert. Jour sélectionné (11) : pastille orange. Jours futurs grisés `#D8CFC5`. Sous la grille : liste des tâches faites ce jour (✓ vert, auteur + heure). Historique **non modifiable** (anti-triche).

### 6. Objectifs — onglet « Jour » (2 sous-onglets)
Top tabs : **Jour** / **Mois**. Sous Jour, segment **✎ Je pointe** / **Équipe**.
- **Je pointe** : liste des 7 indicateurs (HD, ABO, Terminaux, Challenge, MP, Parafoudre, Divertissement), chacun avec sous-titre « équipe : N » et un **stepper** `− [valeur] +` à la couleur du vendeur connecté (vert `#57C77E`). Le `+` incrémente *sa* valeur ; `−`/`+` permettent de corriger une erreur de saisie.
- **Équipe** : par indicateur, une **jauge empilée horizontale** où chaque segment = contribution d'un vendeur (largeur = `flex:count`), à **sa couleur**, avec le compte au centre. Le segment du vendeur connecté a un contour foncé `inset 0 0 0 2px rgba(0,0,0,0.32)`. Total à droite. Légende « QUI : » (pastille couleur → prénom) en bas.

### 7. Objectifs — onglet « Mois » (vendeur, lecture seule)
- Hero sombre `linear-gradient(160deg,#1A1A1A,#3A3A3A)` avec **anneau de progression** SVG (vert `#22A650`, ex. 64 %, « 52 / 81 ») + label « Ce mois-ci · Juin 2026 » (**pas de commentaire motivant**).
- Liste d'indicateurs : barre de progression vers la **cible**. En cours = `#57C77E`. **Validé seulement si valeur = cible** → alors `#22A650` + ✓ (ex. Terminaux 12/15 est *en cours*, donc vert clair sans ✓ ; un 15/15 serait validé). Challenge a un badge « en cours ». Mention « 🔒 Objectifs fixés par la direction ».

### 8. Objectifs — onglet « Mois » (admin)
- Cadre orange (mode admin). Sélecteur de vendeur (dropdown). **Un seul bouton** « Modifier les objectifs » (gère cibles, valeurs et liste des indicateurs). Cibles affichées dans des champs éditables. Pas de note explicative en bas.

### 9. Suivi équipe (fiche vendeur — encadrement)
- Cadre orange, badge ADMIN, sélecteur de vendeur.
- **Section publique** (visible par le vendeur) : « Points à améliorer » (chip vert « Vu par Léa ») + « 🏆 Challenge fibre » (barre orange, ex. 9/15).
- **Section privée** (directrice + adjointe seulement) : carte **démarcation douce** — fond `#F3F5F8`, bordure pointillée `#C9D2DA`, texte slate `#5B6B7B`, icône cadenas. **Pas de rouge.** Libellé « Notes privées · Direction uniquement » + « Non visible par la vendeuse ».

### 10. Profil
- Avatar (couleur vendeur, initiales), nom, « Vendeuse · CUID LERN5042 ».
- Section **Compte** : Changer mon mot de passe · Mes informations · Ma couleur (mention « Modifiable par admin »).
- Section **Administration · direction** (admins only, fond orange clair) : « Gestion des comptes ».
- Bouton « Se déconnecter » (rouge).

### 11. Gestion des comptes (admin)
- Liste des 10 membres (avatar couleur, nom, rôle, CUID format `4L+4D`). La 1re carte montre l'édition de **couleur** (rangée de pastilles, mention « Admin » → **éditable par admins uniquement**). CTA « + Ajouter un vendeur ». La direction crée le CUID + mot de passe provisoire et choisit la couleur.

## Rôles & permissions
- **Vendeur** : tâches (créer/prendre/terminer les siennes), pointer ses ventes (Jour), consulter sa progression (Mois lecture seule), voir ses « points à améliorer », changer son mdp. **Onglet Suivi masqué.**
- **Directrice / Adjointe (admin)** : tout ce qui précède + créer/éditer des comptes, définir les couleurs vendeurs, définir les objectifs/cibles, éditer la liste des indicateurs, écrire les notes (publiques et privées), consulter la fiche de n'importe quel vendeur.

## Interactions & comportements clés
- Prendre une tâche → déplacement À faire → En cours, attribution au vendeur connecté.
- Stepper « Je pointe » → +1/−1 sur la valeur du vendeur, recoloration des jauges « Équipe ».
- Onglets Jour/Mois et Je pointe/Équipe = bascule d'affichage.
- Historique strictement en lecture seule.
- Navigation : barre basse 4 onglets sur mobile ; sidebar / onglets sur desktop (voir lo-fi).

## State (indicatif)
- `currentUser { id, name, role: 'vendeur'|'admin', color }`
- `tasks[] { id, title, status: 'todo'|'doing'|'done', assignee, createdBy, doneAt }`
- `dailySales { date, [vendorId]: { [indicator]: count } }`
- `monthlyTargets { [vendorId]: { [indicator]: target } }` (admin)
- `indicators[]` (liste éditable par admin)
- `teamNotes { [vendorId]: { publicNote, challenge, privateNote } }`

## Assets
- Polices : Google Fonts **Caveat** + **Nunito**.
- Icônes : SVG stroke inline (clipboard, cible/concentric, people, user, calendrier, cadenas, +, chevrons, check). Remplaçables par la librairie d'icônes du codebase (style stroke, ~2px).
- Logo Orange : placeholder carré orange dans les maquettes — utiliser le vrai logo Orange / le design system Boosted côté implémentation.

## Fichiers
- `Maquette HD Mobile.dc.html` — **maquette haute fidélité mobile** (tous les écrans ci-dessus).
- `Wireframe App Orange.dc.html` — **wireframe basse fidélité** (structure, flux, et **vue desktop** de référence).
