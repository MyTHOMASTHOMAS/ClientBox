# ADR-010 — UI Assets embarqués au build et configuration de PUBLIC_DIR

**Statut :** remplacé par [`ADR-012`](./ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md) (16/10/2026)  
**Date :** 09/10/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- une **ADR** enregistre une décision prise.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| REQ-003, REQ-108, Annexe A | Livrable standalone : un fichier JS unique (`clientsbox.js`) copié à la main sans dépendance de dossier public |
| REQ-004, SPEC-SRV-02 | Distribution de l'interface utilisateur web sur la racine HTTP (`/`) |
| ADR-001 | Application Node standalone précompilée unique servant elle-même son interface HTTP |
| ADR-008 (§10) | Anticipation explicite de l'embarquement des assets statiques dans le livrable via le pipeline Vite |
| SPEC-ARCH-03 | Monopole de lecture de `process.env` réservé à `src/lib/process/env-layout.resolver.ts` |

Cet ADR **complète** l'ADR-001 et l'ADR-008 en arrêtant les règles d'injection et de distribution des assets web statiques de l'UI.

---

## Contexte

Le CDC (Annexe A, REQ-003, REQ-108) exige que ClientsBox soit un livrable standalone JavaScript unique (`clientsbox.js`). Lors du démarrage dans un projet hôte (`node .agents/clientsbox.js`), l'utilisateur doit accéder immédiatement à l'interface web sans devoir copier manuellement un dossier d'assets statiques supplémentaire (`.agents/public/`).

En développement ou lors d'un build personnalisé, le développeur doit pouvoir spécifier le répertoire source des assets statiques (HTML, CSS, JS) via une variable d'environnement dédiée (`PUBLIC_DIR`).

Il faut trancher :
1. Le modèle de configuration de la source des assets statiques (`PUBLIC_DIR`).
2. Le comportement en mode développement (`npm run dev`).
3. Le mécanisme d'embarquement (inlining) des assets au moment du build (`npm run build`).
4. Le comportement à l'exécution du livrable standalone (`node dist/clientsbox.js`).

---

## Options envisagées

### Option A — Dossier statique externe obligatoire sur disque
| | |
|---|---|
| Ce qu'elle apporte | Simplicité initiale du serveur HTTP (simple `serveStatic` sur disque). |
| Ce qu'elle coûte | Oblige l'utilisateur à créer/copier un dossier `.agents/public/` en plus de `clientsbox.js`. |
| Ce qu'elle rend difficile | Viole l'objectif de livrable 100% autonome en fichier unique (REQ-003, Annexe A). |

### Option B — Compilation in-memory des assets au build + résolution `PUBLIC_DIR` (retenue)
| | |
|---|---|
| Ce qu'elle apporte | Livrable 100% autonome : `clientsbox.js` contient l'ensemble de l'UI en mémoire ; flexibilité en dev et au build via `PUBLIC_DIR` dans `.env` ; compatibilité totale avec les tests de fixtures existants. |
| Ce qu'elle coûte | Plugin de packaging des assets statiques dans `vite.config.ts`. |
| Ce qu'elle rend difficile plus tard | Aucun blocage identifié. |

---

## Décision

ClientsBox utilise **`PUBLIC_DIR`** dans l'environnement pour désigner la source des assets statiques et **embarque la totalité de ces assets en mémoire** dans `dist/clientsbox.js` lors du build.

### 1. Variable d'environnement `PUBLIC_DIR`
- Déclarée dans `.env.example` et `.env` avec la valeur par défaut `public`.
- Résolue exclusivement dans `src/lib/process/env-layout.resolver.ts` (LIB-005, SPEC-ARCH-03).
- Valeur par défaut : `<workspacePath>/public` si la variable est absente ou vide.

### 2. Mode Développement (`npm run dev`)
- Le serveur HTTP local sert en priorité les fichiers directement depuis le répertoire `PUBLIC_DIR` sur le disque dur pour permettre l'itération et le rechargement immédiat.

### 3. Mode Build Production (`npm run build`)
- Vite lit tous les fichiers statiques du dossier `PUBLIC_DIR` résolu (`index.html`, scripts, CSS, assets graphiques).
- Ces fichiers sont sérialisés et compilés sous forme de table d'assets in-memory dans le livrable unique `dist/clientsbox.js`.

### 4. Mode Exécution Standalone (`node clientsbox.js`)
- Le gestionnaire HTTP (`serveStatic`) sert les assets compilés en mémoire.
- Si un fichier physique existe sur le disque dans `publicDir` (cas d'une surcharge explicite ou de fixtures de test `CASE-SRV-02-1`), il est servi en priorité.
- Si le fichier demandé n'existe ni sur disque ni dans la table d'assets embarqués, le serveur renvoie HTTP 404 (`Ressource introuvable.`).

---

## Conséquences acceptées

- Le livrable `dist/clientsbox.js` grossit légèrement de la taille des assets statiques compilés (quelques dizaines de Ko).
- Un build est nécessaire pour intégrer toute modification des fichiers du dossier `PUBLIC_DIR` dans le bundle de production.

---

## Liens

- Socle applicatif et livrable unique : **ADR-001**.
- Pipeline de build Vite et variables d'environnement : **ADR-008**.
- Monopole `process.env` : **SPEC-ARCH-03** / `CASE-ARCH-03-5`.
- Distribution des fichiers statiques : **SPEC-SRV-02** / `CASE-SRV-02-1`.
