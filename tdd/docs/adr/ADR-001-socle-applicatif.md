# ADR-001 — Socle applicatif ClientsBox (livrable, runtime, serveur)

**Statut :** accepté  
**Date :** 21/09/2026  
**Décidé par :** Autrement (`U`)  
**Amendement :** 2026-10-06 (`CR-001`, `CR-01/Q03`) — port par défaut **974 → 2974** : le port 974 est privilégié (< 1024) et inaccessible sans droits root sous Linux (`EACCES`). Seul le littéral du port est amendé ; la décision de packaging reste inchangée. Voir `tdd/docs/impact/impact-CR-001-vitest-migration.md`.

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006 | Démarrage serveur, port, livrable, lien terminal, `cwd` |
| REQ-007 | UI en français (cadre d'hébergement UI, pas le choix de framework) |
| REQ-102, REQ-108, REQ-112 | NFR démarrage / copie manuelle / prérequis env |
| R-35 | Port occupé ⇒ échec |
| Contraintes 1, 2, 3, 4, 5, 6, 7, 11 | Node ≥ 24, TS, standalone, `.agents/`, port 2974, FR, `cwd`, mono-user local |
| §6 Périmètre | Livrable JS unique, serveur HTTP local, workspace = `cwd` |

Cet ADR **complète** le CDC en figeant *comment* le livrable est produit et exécuté, sans changer le contrat d'usage.

---

## Contexte

Le CDC impose une application **standalone** TypeScript / Node ≥ 24, copiée dans le projet hôte (typiquement `.agents/`), idéalement en **un seul fichier JS précompilé**, avec serveur HTTP local (défaut **2974**), lien affiché dans le **terminal OS**, et `workspacePath` = `cwd` de la commande de démarrage. Il faut trancher le mode de packaging et le comportement au démarrage avant d'écrire le code et les specs d'architecture.

## Options envisagées

### Option A — Monolithe JS précompilé unique + serveur HTTP embarqué (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Alignement direct REQ-003 / Annexe A (`clientsbox.js`) ; copie manuelle simple ; pas de service distant |
| Ce qu'elle coûte | Build de bundling à maintenir ; taille du fichier unique |
| Ce qu'elle rend difficile plus tard | Découpage en plusieurs packages npm publiés séparément |

### Option B — Package npm multi-fichiers + `node_modules` dans `.agents/`

| | |
|---|---|
| Ce qu'elle apporte | Débogage source plus simple ; imports natifs |
| Ce qu'elle coûte | Installation dépendance dans chaque projet hôte ; friction vs « un fichier » |
| Ce qu'elle rend difficile plus tard | Contradiction avec la cible CDC « JS précompilé unique » |

### Option C — Daemon / service système (hors dépôt)

| | |
|---|---|
| Ce qu'elle apporte | Processus long partagé |
| Ce qu'elle coûte | Contredit standalone par projet + `cwd` = workspace |
| Ce qu'elle rend difficile plus tard | Isolation multi-projets |

## Décision

ClientsBox v1 est livré et exécuté comme **application Node standalone** : sources en **TypeScript**, runtime **Node ≥ 24**, artefact cible **un fichier JavaScript précompilé** (`clientsbox.js` sous `.agents/`), démarré par Node ; au lancement, démarrage d'un **serveur HTTP local** (port `-p`/`--port`, défaut **2974** ; **échec** si occupé), affichage du lien dans le **terminal OS** (pas d'ouverture auto navigateur), `workspacePath` = **`cwd`**.

## Raisons

- REQ-003 / contrainte 2 / Annexe A exigent le livrable unique ou équivalent standalone — l'option A est la lecture littérale.
- REQ-001…006 et R-35 fixent déjà serveur, port, lien, `cwd` ; l'ADR ne fait que les lier en une décision de packaging.
- Option B et C contredisent le périmètre « copie manuelle / pas de service distant ».

## Conséquences acceptées

- Un pipeline de build (bundle) est obligatoire avant distribution.
- L'UI (quelle que soit sa stack — hors cet ADR) est **servie** par ce processus HTTP local.
- Pas d'auth, pas de sandbox (contrainte 11) : confiance locale assumée.

## Ce qui nous ferait revenir dessus

- Décision produit d'abandonner le fichier unique au profit d'un package npm versionné.
- Besoin multi-utilisateur / service distant (changerait le CDC, pas seulement l'ADR).

## Liens

- Suite : **ADR-002** (contrat adapter), **ADR-005** (emplacement `data/` sous `.agents/`).
- Hors périmètre de cet ADR : choix framework UI (reporté ; pas d'ADR UI en v1).
