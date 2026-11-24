# ADR-017 — Documentation utilisateur embarquée et export vers `.agents/docs/`

**Statut :** proposé  
**Date :** 08/11/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| REQ-004, REQ-007, C-06 | IHM web locale en français, accessible via le serveur HTTP |
| REQ-003, REQ-108, Annexe A | Livrable standalone (`clientsbox.js`) sans dépendance à un dossier `public/` externe |
| ADR-001 | Socle applicatif Node local servant l'IHM |
| ADR-005 | Persistance des ressources déclaratives sous `.agents/data/` uniquement |
| ADR-012 | Front in-memory exclusif ; pas de `PUBLIC_DIR` / `public/` |
| ADR-013, ADR-015 | IHM Preact + Tailwind ; assets UI embarqués |

Cet ADR **complète** l'[ADR-005](./ADR-005-persistance-data.md) et l'[ADR-012](./ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md) en introduisant un sous-arbre **distinct** `.agents/docs/` pour la documentation d'utilisation, sans modifier le contrat de `data/`.

> **Numérotation :** ADR-016 est réservé par une autre évolution locale non encore publiée ; la présente décision prend le numéro **017**.

---

## Contexte

ClientsBox doit offrir des **instructions d'utilisation** lisibles depuis l'interface, tout en permettant à l'utilisateur de **matérialiser** cette documentation en fichiers Markdown locaux (consultation hors UI, édition manuelle, usage par des agents / outillage workspace).

Contraintes :
1. Les ressources métier restent sous `.agents/data/` (ADR-005) — la doc utilisateur ne doit pas y être mélangée.
2. Le livrable reste hermétique (ADR-012) : pas de dossier `public/` servi depuis le disque au runtime.
3. L'export disque ne doit pas être silencieux au démarrage : uniquement sur **action explicite** de l'utilisateur.

---

## Options envisagées

### Option A — Source MD versionnée + page IHM + export HTTP vers `.agents/docs/` (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Une source unique (`docs/instructions/`), lecture dans l'UI, copie locale à la demande sous `.agents/docs/` |
| Ce qu'elle coûte | Manifeste MD embarqué au build ; routes API docs ; page UI dédiée |
| Ce qu'elle rend difficile plus tard | Doc totalement dynamique hors rebuild (acceptable en v1) |

### Option B — Documentation uniquement dans le navigateur

| | |
|---|---|
| Ce qu'elle apporte | Aucune écriture disque supplémentaire |
| Ce qu'elle coûte | Pas de fichiers locaux pour agents / édition manuelle / partage workspace |
| Ce qu'elle rend difficile plus tard | Tout usage hors UI |

### Option C — Servir les MD depuis un dossier disque / `public/` au runtime

| | |
|---|---|
| Ce qu'elle apporte | Lecture directe des fichiers |
| Ce qu'elle coûte | Contredit ADR-012 (retrait de `public/`, assets in-memory) |
| Ce qu'elle rend difficile plus tard | Livrable standalone hermétique |

---

## Décision

1. **Source canonique versionnée (opérateur) :** `docs/instructions/**/*.md` — documentation d'**utilisation du binaire** uniquement (UI, ressources, scénarios, exécution).
2. **Hors périmètre embarqué :** `docs/deploy/` documente build / npm / déploiement des sources et **n'est pas** exporté vers `.agents/docs/` ni servi comme page Instructions.
3. **Embarquement :** le contenu de `docs/instructions/` est **embarqué dans le livrable** au build (manifeste / assets) afin que lecture UI et export fonctionnent sans dossier `docs/` externe sur la machine cible (ADR-012).
4. **Affichage IHM :** une page Instructions (Preact) permet de lire la documentation opérateur ; l'accès depuis l'application principale s'ouvre dans un **nouvel onglet**.
5. **Rendu Markdown :** la page Instructions convertit le Markdown embarqué en HTML via la bibliothèque légère **`marked`** (GFM activé : tableaux, listes de tâches, etc.). `marked` est une dépendance npm **embarquée dans le bundle UI** au build (ADR-012 / ADR-013) — aucun chargement CDN ni script tiers au runtime. Le contenu source reste de confiance (doc versionnée dans le dépôt) ; un assainisseur HTML dédié n'est pas requis en v1.
6. **Export explicite :** un bouton **« Enregistrer dans le dossier local »** déclenche un `POST` API qui écrit le miroir Markdown sous :

```text
<workspacePath>/<AGENTS_DIR>/docs/     # défaut : .agents/docs/
```

7. **Hors `.agents/data/` :** aucun fichier de documentation utilisateur n'est écrit sous `data/` (ADR-005 inchangé).
8. **Pas d'export automatique** au démarrage du serveur ni au premier chargement de l'UI.

---

## Raisons

- L'option A satisfait lecture in-app et matérialisation locale sans polluer le contrat `data/`.
- L'option B abandonne le besoin d'export fichier.
- L'option C casse le packaging in-memory déjà acté.

---

## Conséquences acceptées

- Extension du layout `.agents/` avec `docsRoot` (résolu via `LIB-005` / `resolveAgentsLayout`).
- Nouvelles surfaces : routes HTTP docs, service d'export, page UI Instructions, manifeste MD embarqué.
- Dépendance runtime UI `marked` (légère), bundlée dans `DEFAULT_APP_JS` / `embedded-assets.generated.ts` ; impact taille du livrable à surveiller.
- Un ré-export peut écraser les fichiers déjà présents sous `.agents/docs/` (miroir de la source embarquée).
- La rédaction éditoriale de `docs/instructions/` et l'implémentation code suivent les specs / signatures dérivées.

---

## Ce qui nous ferait revenir dessus

- Exigence d'une documentation dynamique entièrement éditable depuis l'UI (CMS).
- Obligation de synchroniser `.agents/docs/` avec un dépôt distant au démarrage.
- Contenu Markdown non fiable (édition libre hors dépôt) nécessitant un assainisseur HTML (`DOMPurify` ou équivalent).
- Remplacement de `marked` par un autre parseur si la taille du bundle ou la conformité GFM ne convient plus.

---

## Liens

- Persistance ressources : **ADR-005**.
- Packaging UI in-memory : **ADR-012**.
- IHM Preact / Tailwind : **ADR-013**, **ADR-015**.
- Specs dérivées : `SPEC-DATA-05`, `SPEC-UI-04`, extension `SPEC-SRV-02`.
