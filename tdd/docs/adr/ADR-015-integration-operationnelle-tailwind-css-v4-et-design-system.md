# ADR-015 — Intégration opérationnelle de Tailwind CSS v4 et du Design System ClientsBox dans le pipeline in-memory

**Statut :** accepté  
**Date :** 27/10/2026  
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
| REQ-003, REQ-108, Annexe A | Livrable standalone autonome dans un fichier JS unique (`clientsbox.js`) sans dépendances runtime |
| REQ-004, SPEC-SRV-02 | Distribution de l'interface utilisateur web sur la racine HTTP (`/`) |
| REQ-007, C-06 | Interface utilisateur intégralement en langue française |
| REQ-014, REQ-035, SPEC-UI-02 | Canvas d'orchestration nodale (style N8N), nœuds et liaisons de flux |
| REQ-024, SPEC-UI-03 | Terminal live en streaming SSE (`GET /api/scenarios/:id/stream`) avec autoscroll et commandes |
| ADR-001 | Socle applicatif Node standalone servant l'IHM web |
| ADR-008 | Pipeline de compilation Vite |
| ADR-010 / ADR-012 | Front in-memory exclusif compilé depuis `src/ui/` et absence de dossier `public/` externe |
| ADR-013 | Décision d'architecture initiale adoptant Preact et le principe de Tailwind CSS |
| DESIGN.md | Système de design haute densité IDE (thème sombre, tokens de surface, bordures et états sémantiques) |

Cet ADR **complète et opérationnalise** l'[ADR-013](./ADR-013-ihm-preact-et-tailwind-css.md) en arrêtant le mode d'intégration exact de **Tailwind CSS v4** dans la chaîne de compilation in-memory et l'injection du Design System issu des maquettes fonctionnelles.

---

## Contexte

Les maquettes fonctionnelles complètes de l'application (`.local/stitch_maquettes_application_fonctionnelle/`) ont formalisé l'ensemble des écrans (Dashboard E01, Canvas E02, Tiroir de configuration E03, Connexions E04, Terminal live E05, Catalogue agents E06, Historique des runs E07, Paramètres E08) ainsi qu'un Design System complet (`clientsbox_ide_system/DESIGN.md`).

Bien que l'ADR-013 ait acté le choix de principe de Tailwind CSS, l'outillage technique n'était pas encore installé dans le projet. L'interface `src/ui/` repose encore sur un fichier CSS statique manuscrit (`src/ui/styles/app.css`) d'environ 700 lignes, qui ne permet pas d'intégrer avec agilité et fidélité les composants riches des maquettes.

Pour passer à l'implémentation, il est indispensable de trancher :
1. La version de Tailwind CSS et son moteur d'intégration avec Vite.
2. La méthode de déclaration des tokens du Design System ClientsBox.
3. La garantie que la feuille de styles générée reste 100% in-memory et purgée dans le livrable standalone `dist/clientsbox.js` (ADR-012).

---

## Options envisagées

### Option A — Tailwind CSS v4 natif via `@tailwindcss/vite` (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Intégration native et directe dans le pipeline Vite sans configuration PostCSS ni fichier `tailwind.config.js`. Déclaration des tokens directement dans le CSS via la directive `@theme`. Moteur de compilation ultra-rapide en Rust (Oxide). Détection et purge automatique du code mort des classes utilitaires. |
| Ce qu'elle coûte | Ajout des dépendances `tailwindcss` et `@tailwindcss/vite` dans `devDependencies`. |
| Ce qu'elle rend difficile | Nécessite Node.js récent (parfaitement aligné avec Node $\ge 24$ imposé par le projet). |

### Option B — Tailwind CSS v3 classique via PostCSS

| | |
|---|---|
| Ce qu'elle apporte | Version antérieure éprouvée, configuration JavaScript standard (`tailwind.config.js`). |
| Ce qu'elle coûte | Complexification de la chaîne d'outillage : dépendances `postcss`, `autoprefixer`, fichiers de configuration multiples. Temps de build plus lent que la v4. |
| Ce qu'elle rend difficile | Maintenance d'une double configuration (Vite + PostCSS) au sein du script in-memory `scripts/build-embedded-assets.ts`. |

---

## Décision

ClientsBox adopte **Tailwind CSS v4** couplé au plugin officiel **`@tailwindcss/vite`** en tant qu'outillage de build pour l'interface utilisateur web.

La configuration du Design System ClientsBox (tokens de surfaces `#090d16`, `#111827`, `#1e293b`, typographies *Inter* et *JetBrains Mono*, et états sémantiques) est déclarée directement dans `src/ui/styles/app.css` via la directive `@theme` de Tailwind v4.

---

## Principes d'implémentation

1. **Compilation In-Memory hermétique (ADR-012) :**
   - Le script de packaging [scripts/build-embedded-assets.ts](../../scripts/build-embedded-assets.ts) injecte le plugin `@tailwindcss/vite` dans l'appel `build()` programmatique de Vite.
   - Vite traite `src/ui/styles/app.css` comme point d'entrée CSS, compile les directives Tailwind, purge toutes les classes non référencées dans `src/ui/` et injecte le CSS minifié résultant dans la constante `DEFAULT_APP_CSS` de `src/lib/http/embedded-assets.generated.ts`.
   - Aucun asset statique externe n'est écrit sur le disque : le livrable final standalone `dist/clientsbox.js` conserve son autonomie absolue.

2. **Déclaration unifiée du Design System dans `src/ui/styles/app.css` :**
   - Importation native : `@import "tailwindcss";`.
   - Injection des tokens issus de `DESIGN.md` :
     ```css
     @theme {
       --color-surface-base: #090d16;
       --color-surface-panel: #111827;
       --color-surface-elevated: #1e293b;
       --color-surface-overlay: #243147;
       --color-border-default: #334155;
       --color-border-subtle: #1e2638;
       --color-border-focus: #3b82f6;
       --color-status-active: #3b82f6;
       --color-status-success: #10b981;
       --color-status-warning: #f59e0b;
       --color-status-error: #ef4444;
       --font-sans: 'Inter', sans-serif;
       --font-mono: 'JetBrains Mono', monospace;
     }
     ```

3. **Indépendance runtime :**
   - `tailwindcss` et `@tailwindcss/vite` sont des dépendances de développement pures (`devDependencies`).
   - L'environnement d'exécution runtime Node.js n'a aucune dépendance Tailwind.

---

## Impacts et Conséquences acceptées

### 1. Impact sur les dépendances et le `package.json`
- Ajout de `tailwindcss` ($\ge 4.0.0$) et `@tailwindcss/vite` ($\ge 4.0.0$) dans `devDependencies`.
- Aucune dépendance runtime supplémentaire : `dependencies` reste inchangé.

### 2. Impact sur le pipeline de build et les performances
- La compilation de `npm run build:assets` exécute la passe de compilation Tailwind v4. Grâce au moteur natif Oxide, l'impact sur le temps de build reste minime ($\approx 100$ à $200\text{ ms}$).
- Le bundle standalone `dist/clientsbox.js` ne grossit que de la taille du CSS effectivement purgé (estimé entre 15 et 30 Ko bruts, $\le 8\text{ Ko}$ gzippés), ce qui respecte largement les contraintes de compacité.

### 3. Impact sur l'écriture du code UI et les règles d'architecture (`SPEC-ARCH`)
- **Règle de volumétrie (`CASE-ARCH-05-1` : $\le 150$ lignes par fichier) :** L'inlining de classes utilitaires Tailwind dans le JSX/TSX Preact augmente la densité textuelle des composants. Pour ne jamais enfreindre la limite des 150 lignes, les vues complexes (comme le Canvas E02 ou le Tiroir E03) doivent obligatoirement être découpées en sous-composants atomiques et modulaires (ex. `BlockNodeHeader`, `BlockNodeBody`, `PortConnector`, `EdgeBadge`).
- **Règle linguistique (`REQ-007` / `CASE-ARCH-08-4`) :** Toutes les chaînes de texte, infobulles (`title`), et libellés restent strictement en langue française via le catalogue i18n (`src/ui/i18n/fr-catalog.ts`).

### 4. Impact sur les tests automatisés (Vitest & Playwright)
- **Tests unitaires et d'architecture :** Les tests Vitest ne sont pas altérés puisque l'étanchéité des couches et les contrats d'API restent identiques.
- **Tests E2E Playwright (`ADR-011`) :** Les sélecteurs de test s'appuient sur des attributs fonctionnels stables (`id`, `data-scenario-id`, `data-section`, `data-testid`) et non sur des noms de classes CSS éphémères, garantissant la robustesse des assertions.

---

## Ce qui nous ferait revenir dessus

- Une incompatibilité technique entre `@tailwindcss/vite` et la compilation programmatique in-memory sans écriture disque de `scripts/build-embedded-assets.ts`.
- Une régression mesurable du temps de démarrage de l'application ou un gonflement excessif et injustifié de `dist/clientsbox.js`.

---

## Liens

- Socle applicatif standalone : **[ADR-001](./ADR-001-socle-applicatif.md)**.
- Pipeline de build Vite : **[ADR-008](./ADR-008-pipeline-de-build-vite-et-injection-env.md)**.
- Harnais de test E2E Playwright : **[ADR-011](./ADR-011-harnais-de-test-e2e-playwright.md)**.
- Front in-memory exclusif : **[ADR-012](./ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md)**.
- Adoption de Preact et Tailwind CSS : **[ADR-013](./ADR-013-ihm-preact-et-tailwind-css.md)**.
- Système de design IDE : **[.local/stitch_maquettes_application_fonctionnelle/clientsbox_ide_system/DESIGN.md](../../.local/stitch_maquettes_application_fonctionnelle/clientsbox_ide_system/DESIGN.md)**.
- Spécifications IHM : **SPEC-UI-01**, **SPEC-UI-02**, **SPEC-UI-03**.
