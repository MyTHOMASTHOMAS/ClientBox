# ADR-013 — Adoption de Preact et Tailwind CSS pour l'interface utilisateur web

**Statut :** accepté  
**Date :** 21/10/2026  
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
| REQ-003, REQ-108, Annexe A | Livrable standalone autonome dans un fichier JS unique (`clientsbox.js`) |
| REQ-004, SPEC-SRV-02 | Distribution de l'interface utilisateur web sur la racine HTTP (`/`) |
| REQ-007, C-06 | Interface utilisateur intégralement en langue française |
| REQ-009..012, SPEC-UI-01 | Formulaires de gestion et vues CRUD réactives (Agents, Profils, Prompts, Scénarios) |
| REQ-014, REQ-035, SPEC-UI-02 | Canvas d'orchestration nodale (style N8N), nœuds et liaisons de flux |
| REQ-024, SPEC-UI-03 | Terminal live en streaming SSE (`GET /api/scenarios/:id/stream`) avec autoscroll et commandes |
| ADR-001 | Socle applicatif Node standalone servant l'IHM web |
| ADR-008 | Pipeline de compilation Vite |
| ADR-011 | Harnais de test E2E Playwright validant l'IHM en boîte noire |
| ADR-012 | Front in-memory exclusif compilé depuis `src/ui/` et retrait de `PUBLIC_DIR` |
| signature-ui.md | Signature de domaine actant l'indépendance de l'IHM vis-à-vis du framework (Règle 5) |

Cet ADR **complète** l'[ADR-001](./ADR-001-socle-applicatif.md), l'[ADR-008](./ADR-008-pipeline-de-build-vite-et-injection-env.md) et l'[ADR-012](./ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md) en arrêtant le choix du framework de rendu déclaratif et du moteur de styles pour l'IHM web de ClientsBox.

---

## Contexte

Initialement, la couche `src/ui/` a été développée en TypeScript Vanilla avec manipulation impérative du DOM (`innerHTML`, gabarits de chaînes HTML interpolées, attachement manuel d'écouteurs d'événements dans `renderLayout()` et `mountApp()`), couplée à une feuille de styles CSS statique manuscrite (`src/ui/styles/app.css` d'environ 600 lignes).

Ce modèle initial présentait plusieurs contraintes majeures :
1. **Gestion d'état impérative fragile :** La synchronisation des formulaires CRUD, des modales, du panneau inspecteur et du canvas nodale par manipulation de chaînes HTML manuelles multiplie les risques de désynchronisation de l'état, de fuites mémoire d'écouteurs d'événements et de complexité cyclomatique.
2. **Absence de design system standardisé :** La maintenance d'un CSS artisanal monolithique rend l'évolution visuelle lente et sujette aux régressions de mise en page.
3. **Contrainte absolue de packaging (ADR-001 & ADR-012) :** L'IHM doit impérativement rester **embarquée en mémoire** au moment du build dans `src/lib/http/embedded-assets.generated.ts` et inlinée dans l'unique livrable standalone `dist/clientsbox.js`. Aucun dossier externe (`public/`) ni aucun chargement réseau supplémentaire de scripts tiers ne sont tolérés au runtime.

Il faut donc formaliser :
1. La bibliothèque de rendu déclaratif réactif pour `src/ui/`.
2. Le moteur de design system utilitaire.
3. Les garanties de préservation de la taille ultra-légère du livrable standalone et du pipeline in-memory.

---

## Options envisagées

### Option A — Maintien du Vanilla TypeScript + CSS statique manuscrit
| | |
|---|---|
| Ce qu'elle apporte | Aucune dépendance externe de rendu UI ; taille initiale minimale. |
| Ce qu'elle coûte | Manipulation DOM impérative lourde, maintenance fastidieuse des formulaires et de la réactivité temps réel du canvas, CSS custom monolithique difficile à étendre. |
| Ce qu'elle rend difficile | L'ajout de fonctionnalités interactives avancées (drag & drop réactif, modales complexes, validation instantanée sans rechargement partiel de DOM). |

### Option B — React (v19) + Tailwind CSS
| | |
|---|---|
| Ce qu'elle apporte | Écosystème très large, composants déclaratifs éprouvés, standard du marché. |
| Ce qu'elle coûte | Poids excessif : React + ReactDOM ajoutent plus de 130 à 150 Ko bruts (~45 Ko minifiés gzippés) directement injectés dans la chaîne in-memory du binaire Node `dist/clientsbox.js`. |
| Ce qu'elle rend difficile | Maintien d'un livrable CLI léger et d'un temps de démarrage instantané. |

### Option C — Preact + Tailwind CSS v4 via `@tailwindcss/vite` (retenue)
| | |
|---|---|
| Ce qu'elle apporte | Rendu déclaratif réactif identique à React (JSX/TSX, hooks `useState`, `useEffect`, `useRef`), taille plume exceptionnelle (**~4 Ko**), compilation in-memory ultra-rapide via `@preact/preset-vite` et `@tailwindcss/vite`, zéro impact perceptible sur la taille de `dist/clientsbox.js`, conservation intégrale du packaging ADR-012. |
| Ce qu'elle coûte | Ajout des packages légers `preact` et `@tailwindcss/vite` en dépendances de build/dev. |
| Ce qu'elle rend difficile plus tard | Aucun blocage : compatibilité React disponible via `preact/compat` si un composant externe venait à être nécessaire. |

---

## Décision

ClientsBox adopte **Preact** comme bibliothèque de composants déclaratifs réactifs et **Tailwind CSS v4** comme design system utilitaire pour l'ensemble de l'interface utilisateur web sous `src/ui/`.

---

## Principes d'implémentation

1. **Préservation absolue du livrable standalone in-memory (ADR-012) :**
   - Le script `scripts/build-embedded-assets.ts` est enrichi pour intégrer les plugins `@preact/preset-vite` et `@tailwindcss/vite`.
   - La compilation produit toujours les deux artefacts in-memory : `DEFAULT_APP_JS` (bundle Preact compilé) et `DEFAULT_APP_CSS` (feuille de styles compilée et purgée par Tailwind).
   - Ces flux sont sérialisés dans `src/lib/http/embedded-assets.generated.ts` et empaquetés dans `dist/clientsbox.js`. Aucun asset sur disque n'est requis au runtime.

2. **Source de vérité unique sous `src/ui/` :**
   - Les composants de l'interface sont écrits en TypeScript/TSX sous `src/ui/`.
   - L'entrée `src/ui/app.ts` (ou `app.tsx`) monte le composant racine Preact `<App />` sur le conteneur `#app`.

3. **Design System & Continuité Visuelle :**
   - Les styles de base sont déclarés dans `src/ui/styles/app.css` via l'import Tailwind v4.
   - La palette sombre signature de ClientsBox (ardoise `slate-900`/`slate-800`, accentuation cyan `sky-400`, statuts vert émeraude et rouge) est formalisée en classes utilitaires Tailwind homogènes.

4. **Isolation Navigateur & Conformité Linguistique :**
   - La couche `src/ui/` reste strictement isolée : aucun module serveur ni API native Node.js n'est importé (`SPEC-ARCH-01`, `CASE-ARCH-01-4`).
   - L'exhaustivité de la langue française est strictement maintenue via `src/ui/i18n/fr-catalog.ts` (`REQ-007`, `C-06`, `CASE-ARCH-08-4`).

---

## Conséquences acceptées

- Ajout de `preact`, `@preact/preset-vite`, `tailwindcss` et `@tailwindcss/vite` dans les dépendances du projet (`package.json`).
- Configuration de `tsconfig.json` avec `"jsx": "react-jsx"` et `"jsxImportSource": "preact"`.
- Adaptation des fiches de tests et signatures architecturales pour refléter les composants Preact tout en préservant le passage à 100% du harnais Vitest et Playwright E2E.
- Cadrage du déroulé TDD : Les modifications documentaires (ADR, spécifications, signatures) sont validées en premier lieu. L'outillage de build (packages `preact`, `@tailwindcss/vite`, configuration `tsconfig.json`) et la mise à jour de `scripts/build-embedded-assets.ts` seront mis en place lors de la phase de code, après validation de l'adaptation des fiches de tests CASEs.

---

## Ce qui nous ferait revenir dessus

- Une régression mesurable sur la compacité du livrable standalone ou sur le temps d'exécution du serveur local.
- Une incompatibilité technique insoluble avec le packaging in-memory hermétique de Vite.

---

## Liens

- Socle applicatif standalone : **ADR-001**.
- Pipeline de build Vite : **ADR-008**.
- Harnais de test E2E Playwright : **ADR-011**.
- Front in-memory exclusif : **ADR-012**.
- Spécifications IHM : **SPEC-UI-01**, **SPEC-UI-02**, **SPEC-UI-03**.
- Signature d'architecture : **`tdd/docs/signature/signature-ui.md`**.
