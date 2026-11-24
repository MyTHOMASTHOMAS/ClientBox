# Sommaire des cas de test — Domaine UI (Interface Utilisateur, Canvas & Terminal Live)

**Domaine :** `UI`  
**Document maître des spécifications :** [`tdd/specs/UI.md`](../../specs/UI.md)  
**ADR d'ancrage :** [`ADR-001`](../../docs/adr/ADR-001-socle-applicatif.md), [`ADR-004`](../../docs/adr/ADR-004-moteur-blocs.md), [`ADR-011`](../../docs/adr/ADR-011-harnais-de-test-e2e-playwright.md), [`ADR-012`](../../docs/adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../../docs/adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../../docs/adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md), [`ADR-018`](../../docs/adr/ADR-018-call-scenario-sous-runner.md), [`ADR-019`](../../docs/adr/ADR-019-bloc-command.md), [`ADR-021`](../../docs/adr/ADR-021-canvas-pan-zoom-interactions.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v1.md` (statut §12 verrouillé)  

---

## 1. Spécifications couvertes

- [`SPEC-UI-01`](../../specs/UI.md#spec-ui-01--ihm-en-français-navigation-et-formulaires-de-gestion-crud) — IHM en français, navigation et formulaires de gestion CRUD (`REQ-007`, `REQ-008`, `REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `R-03`, `R-04`, `R-07`, `R-28`, `R-36`, `C-06`)
- [`SPEC-UI-02`](../../specs/UI.md#spec-ui-02--canvas-dorchestration-visuel-style-n8n) — Canvas d'orchestration visuel (style N8N) (`REQ-014`, `REQ-015`, `REQ-030`, `REQ-035`, `REQ-045`, `REQ-111`, `R-08`–`R-15`, `R-37`, `R-43`, `R-49`, `REQ-107`)
- [`SPEC-UI-03`](../../specs/UI.md#spec-ui-03--terminal-live-non-persisté-et-contrôles-dexécution) — Terminal live non persisté et contrôles d'exécution (`REQ-024`, `REQ-025`, `R-26`, `R-34`, `REQ-110`)
- [`SPEC-UI-04`](../../specs/UI.md#spec-ui-04--page-instructions-et-export-local-de-la-documentation) — Page Instructions et export local de la documentation (`ADR-017`, `REQ-007`, `C-06`)

---

## 2. Tableau d'indexation des Cas de Test

| numéro | testfile | description rapide | clause / exigence spec liée |
|---|---|---|---|
| 01-1 | `CASE-UI-01-1.md` | Exhaustivité de la langue française sur tous les composants Preact, menus, libellés et design system Tailwind v4 (`UI-004`) | `SPEC-UI-01`, `AC-UI-01-1`, `REQ-007`, `C-06`, `ADR-013`, `ADR-015` |
| 01-2 | `CASE-UI-01-2.md` | Formulaires CRUD Preact (agents, profils, prompts, exit `{id,name,content}`, scénarios) | `SPEC-UI-01`, `AC-UI-01-2`, `REQ-009`..`012`, `R-07`, `R-36`, `ADR-013`, CR-012 |
| 01-3 | `CASE-UI-01-3.md` | Filtrage strict du sélecteur de CLI d'agent restreint aux seuls adapters opérationnels embarqués (`cursor-cli` en v1) (`UI-007`, `UI-014`) | `SPEC-UI-01`, `AC-UI-01-3`, `REQ-008`, `R-04`, `R-28`, `ADR-013` |
| 01-4 | `CASE-UI-01-4.md` | Structure de navigation globale en français, montage racine Preact et vues de liste (`UI-001`, `UI-016`, `UI-018`, `UI-019`, `UI-027..030`) | `SPEC-UI-01`, `AC-UI-01-1`, `AC-UI-01-2`, `REQ-007`, `REQ-012`, `C-06`, `ADR-013` |
| 01-5 | `CASE-UI-01-5.md` | Validation E2E de la restitution seed (dont 3 exit `{id,name,content}`) dans l'IHM Preact | `SPEC-UI-01`, `AC-UI-01-4`, `REQ-009`..`012`, `ADR-011`, `ADR-012`, `ADR-013`, CR-012 |
| 01-6 | `CASE-UI-01-6.md` | Client HTTP et flux SSE canonique navigateur avec normalisation des erreurs en français et hooks Preact (`UI-002`, `UI-003`, `UI-010`) | `SPEC-UI-01`, `SPEC-UI-03`, `AC-UI-01-1`, `AC-UI-03-1`, `ADR-013` |
| 01-7 | `CASE-UI-01-7.md` | Modale Preact d'inspection de scripts en lecture seule et passivité réseau per REQ-011 (`UI-015`, `UI-029`) | `SPEC-UI-01`, `SPEC-DATA-02`, `AC-UI-01-1`, `AC-DATA-02-1`, `ADR-013`, `ADR-015` |
| 01-8 | `CASE-UI-01-8.md` | Cycle de vie des composants Preact, routage et nettoyage des abonnements (`UI-001`, `UI-011`, `UI-027..031`) | `SPEC-UI-01`, `AC-UI-01-1`, `AC-UI-01-2`, `ADR-013` |
| 01-9 | `CASE-UI-01-9.md` | Validation E2E de la navigation, du routage hashchange et de la conformité 100% français | `SPEC-UI-01`, `AC-UI-01-1`, `AC-UI-01-2`, `ADR-011`, `ADR-013` |
| 01-10 | `CASE-UI-01-10.md` | Validation E2E du cycle de vie CRUD complet d'un Agent avec persistance locale | `SPEC-UI-01`, `SPEC-DATA-01`, `SPEC-DATA-04`, `AC-UI-01-2`, `AC-DATA-01-1`, `AC-DATA-04-1`, `ADR-011`, `ADR-013` |
| 01-11 | `CASE-UI-01-11.md` | Validation E2E de l'intégrité référentielle et du rejet 409 de suppression de profil | `SPEC-UI-01`, `SPEC-DATA-01`, `AC-UI-01-2`, `AC-DATA-01-5`, `ADR-011`, `ADR-013` |
| 01-12 | `CASE-UI-01-12.md` | Validation E2E de la consultation de script If via la modale de lecture seule | `SPEC-UI-01`, `SPEC-DATA-02`, `AC-UI-01-1`, `AC-DATA-02-1`, `ADR-011`, `ADR-013` |
| 01-13 | `CASE-UI-01-13.md` | Composant générique d'autocomplétion libre à recherche modulaire locale/distante (`UI-037`) | `SPEC-UI-01`, `AC-UI-01-5`, `REQ-007`, `REQ-011`, `REQ-014`, `ADR-013`, `ADR-015` |
| 02-1 | `CASE-UI-02-1.md` | Composition nodale du canvas Preact : création, déplacement, inspection des paramètres et câblage orienté (`UI-008`, `UI-020..024`) | `SPEC-UI-02`, `AC-UI-02-1`, `REQ-014`, `REQ-035`, `R-08`, `R-09`, `R-13`, `R-43`, `REQ-107`, `ADR-004`, `ADR-013` |
| 02-2 | `CASE-UI-02-2.md` | Garantie d'unicité stricte du bloc Start avec blocage visuel immédiat dans l'IHM Preact per REQ-015 (`UI-008`, `UI-020`) | `SPEC-UI-02`, `AC-UI-02-2`, `REQ-015`, `R-19`, `ADR-004`, `ADR-013` |
| 02-3 | `CASE-UI-02-3.md` | Différenciation visuelle explicite des deux connecteurs et câbles If (Vrai / Faux) avec Tailwind CSS v4 (`UI-021`, `UI-022`) | `SPEC-UI-02`, `AC-UI-02-3`, `R-10b`, `R-15`, `ADR-004`, `ADR-013`, `ADR-015` |
| 02-4 | `CASE-UI-02-4.md` | Affichage réactif en temps réel du statut d'exécution de chaque nœud sur le canvas SVG (`UI-010`, `UI-017`, `UI-021`) | `SPEC-UI-02`, `AC-UI-02-4`, `R-42b`, `REQ-014`, `ADR-004`, `ADR-013` |
| 02-5 | `CASE-UI-02-5.md` | Contrôle interactif de lancement du scénario depuis l'IHM Preact avec verrouillage anti-concurrence (`UI-010`, `UI-023`) | `SPEC-UI-02`, `AC-UI-02-5`, `REQ-030`, `ADR-004`, `ADR-013` |
| 02-6 | `CASE-UI-02-6.md` | Validation E2E dans un navigateur réel de l'interaction nodale sur le Canvas Preact (nœuds, câblage, réactivité) | `SPEC-UI-02`, `AC-UI-02-6`, `ADR-004`, `ADR-011`, `ADR-013` |
| 02-7 | `CASE-UI-02-7.md` | Moteur de rendu SVG interactif, câbles de Bézier et cycle de vie réactif du canvas (`UI-009`, `UI-020`, `UI-022`) | `SPEC-UI-02`, `AC-UI-02-1`, `AC-UI-02-3`, `AC-UI-02-4`, `ADR-004`, `ADR-013` |
| 02-8 | `CASE-UI-02-8.md` | Interactions pointer, hit-test des ports et capture de tirage de câbles (`UI-008`, `UI-009`, `UI-020`) | `SPEC-UI-02`, `AC-UI-02-1`, `ADR-004`, `ADR-013` |
| 02-9 | `CASE-UI-02-9.md` | Panneau inspecteur latéral Preact d'édition dynamique des paramètres de bloc (`UI-024`) | `SPEC-UI-02`, `AC-UI-02-1`, `ADR-013` |
| 02-10 | `CASE-UI-02-10.md` | Page dédiée scenario studio Preact, hydratation et verrouillage anti double-Launch (`UI-031`, `UI-023`) | `SPEC-UI-02`, `SPEC-UI-03`, `AC-UI-02-5`, `AC-UI-03-1`, `ADR-004`, `ADR-013` |
| 02-11 | `CASE-UI-02-11.md` | Validation E2E de la création d'un scénario par drag-and-drop, câblage et persistance | `SPEC-UI-02`, `SPEC-DATA-03`, `AC-UI-02-1`, `AC-DATA-03-1`, `ADR-004`, `ADR-011`, `ADR-013` |
| 02-12 | `CASE-UI-02-12.md` | Validation E2E du blocage préventif d'insertion d'un second bloc Start per REQ-015 | `SPEC-UI-02`, `SPEC-ARCH-02`, `AC-UI-02-2`, `AC-ARCH-02-4`, `ADR-004`, `ADR-011`, `ADR-013` |
| 02-13 | `CASE-UI-02-13.md` | Validation E2E du câblage différentiel If et de la renumérotation automatique per REQ-035 | `SPEC-UI-02`, `SPEC-DATA-03`, `AC-UI-02-3`, `AC-DATA-03-2`, `ADR-004`, `ADR-011`, `ADR-013` |
| 02-14 | `CASE-UI-02-14.md` | Suppression interactive d'un câble en deux clics (sélection puis option Supprimer) (`UI-008`, `UI-020`, `UI-022`) | `SPEC-UI-02`, `AC-UI-02-7`, `REQ-014`, `REQ-035`, `R-43`, `ADR-004`, `ADR-013` |
| 02-15 | `CASE-UI-02-15.md` | Enregistrer / load : strip `SCENARIO_NODE_NO_SAVE_KEYS` (ex. `status`) via `DOM-018` | `SPEC-UI-02`, `SPEC-DATA-03`, `AC-UI-02-8`, `AC-DATA-03-6`, `R-37`, `ADR-004`, `ADR-005`, `ADR-013` |
| 02-16 | `CASE-UI-02-16.md` | Verrouillage front édition / Enregistrer pendant run (`busy` / `isRunning` / `launchLocked`) | `SPEC-UI-02`, `SPEC-UI-03`, `AC-UI-02-9`, `ADR-004`, `ADR-013` |
| 02-17 | `CASE-UI-02-17.md` | Suppression interactive d'un bloc sélectionné depuis l'inspecteur contextuel et le clavier (`UI-008`, `UI-024`, `UI-031`) | `SPEC-UI-02`, `AC-UI-02-10`, `REQ-014`, `REQ-015`, `R-43`, `ADR-004`, `ADR-013` |
| 02-18 | `CASE-UI-02-18.md` | Bloc CallScenario : ajout toolbar et dropdown `targetScenarioId` incluant le scénario courant | `SPEC-UI-02`, `AC-UI-02-11`, `REQ-039`, `REQ-041`, `R-46`, `ADR-004`, `ADR-013`, `ADR-018` |
| 02-19 | `CASE-UI-02-19.md` | Bloc Command : ajout toolbar, champ `commandLine` inspecteur et absence de champs agent/prompt/exit | `SPEC-UI-02`, `AC-UI-02-12`, `REQ-042`, `REQ-043`, `R-47`, `ADR-004`, `ADR-013`, `ADR-019` |
| 02-20 | `CASE-UI-02-20.md` | Déplacement de la caméra (Pan) sur le canvas par clic-glissé sur le fond vide (`grab` / `grabbing`), sans modification de `node.position` | `SPEC-UI-02`, `AC-UI-02-13`, `REQ-045`, `R-49`, `ADR-004`, `ADR-013`, `ADR-021` |
| 02-21 | `CASE-UI-02-21.md` | Zoom continu à la molette centré sur le curseur avec compensation `pan` et bornes `[0.25, 2.0]` | `SPEC-UI-02`, `AC-UI-02-14`, `REQ-045`, `ADR-004`, `ADR-013`, `ADR-021` |
| 02-22 | `CASE-UI-02-22.md` | Isomorphisme de projection `clientToCanvas` et précision du drag et câblage sous Pan & Zoom | `SPEC-UI-02`, `AC-UI-02-15`, `REQ-045`, `ADR-004`, `ADR-013`, `ADR-021` |
| 02-23 | `CASE-UI-02-23.md` | Validation E2E du cycle de vie complet d'un workflow : création depuis l'accueil, enrichissement multi-blocs, câblage, pan/zoom et persistance | `SPEC-UI-02`, `SPEC-DATA-03`, `SPEC-UI-01`, `AC-UI-02-1`, `AC-UI-02-6`, `AC-UI-02-11`, `AC-UI-02-13`, `AC-UI-02-14`, `AC-DATA-03-1`, `ADR-011`, `ADR-013` |
| 02-24 | `CASE-UI-02-24.md` | Validation E2E de la suppression interactive de câble et de bloc en situation de Canvas navigué | `SPEC-UI-02`, `SPEC-DATA-03`, `AC-UI-02-7`, `AC-UI-02-10`, `AC-UI-02-15`, `ADR-011`, `ADR-013`, `ADR-021` |
| 03-1 | `CASE-UI-03-1.md` | Terminal web Preact, affichage scrollable temps réel du streaming SSE sans persistance disque (`UI-010`, `UI-025`) | `SPEC-UI-03`, `AC-UI-03-1`, `REQ-024`, `R-26`, `R-37`, `REQ-110`, `REQ-111`, `ADR-001`, `ADR-013`, `ADR-015` |
| 03-2 | `CASE-UI-03-2.md` | Action d'arrêt d'urgence Stop interrompant immédiatement l'exécution active depuis l'IHM Preact (`UI-010`, `UI-023`, `UI-026`) | `SPEC-UI-03`, `AC-UI-03-2`, `REQ-025`, `R-34`, `ADR-001`, `ADR-013` |
| 03-3 | `CASE-UI-03-3.md` | Absence de tout bouton de reset manuel du contexte (Agents, canvas, terminal) ; `add-clear-context` conservé | `SPEC-UI-03`, `AC-UI-03-3`, `SPEC-ADPT-03`, `ADR-013` |
| 03-4 | `CASE-UI-03-4.md` | Validation E2E du lancement de scénario, streaming SSE canonique et terminal live per REQ-024 | `SPEC-UI-03`, `SPEC-ENG-04`, `SPEC-SRV-02`, `AC-UI-03-1`, `AC-UI-02-5`, `AC-SRV-02-1`, `ADR-001`, `ADR-011`, `ADR-013` |
| 03-5 | `CASE-UI-03-5.md` | Validation E2E de l'arrêt d'urgence Stop et libération des ressources per REQ-025 | `SPEC-UI-03`, `SPEC-ENG-04`, `SPEC-ADPT-03`, `AC-UI-03-2`, `AC-ENG-04-3`, `AC-ADPT-03-1`, `ADR-001`, `ADR-011`, `ADR-013` |
| 03-6 | `CASE-UI-03-6.md` | *(Retiré 2026-11-03)* — E2E du bouton « Effacer le contexte » supprimé | — |
| 03-7 | `CASE-UI-03-7.md` | Validation E2E de la conditionnelle If et de l'état Pause Join sur le canvas | `SPEC-UI-02`, `SPEC-ENG-02`, `SPEC-ENG-03`, `AC-UI-02-4`, `AC-ENG-02-2`, `AC-ENG-03-3`, `ADR-004`, `ADR-011`, `ADR-013`, `ADR-015` |
| 03-8 | `CASE-UI-03-8.md` | Validation E2E de la résilience sur erreur d'un bloc et arrêt propre per REQ-026 | `SPEC-UI-02`, `SPEC-UI-03`, `SPEC-ENG-04`, `AC-UI-02-4`, `AC-UI-03-1`, `AC-ENG-04-3`, `ADR-001`, `ADR-004`, `ADR-011`, `ADR-013`, `ADR-015` |
| 03-9 | `CASE-UI-03-9.md` | Réhydratation Studio via snapshot GET run : sync isRunning / blocs et verrouillage Launch | `SPEC-UI-03`, `SPEC-UI-02`, `SPEC-SRV-02`, `AC-UI-03-1`, `AC-UI-02-5`, `AC-SRV-02-1`, `ADR-013` |
| 03-10 | `CASE-UI-03-10.md` | CallScenario : non-recovery canvas enfant et Stop racine pendant sous-exécution | `SPEC-UI-03`, `SPEC-UI-02`, `AC-UI-03-4`, `REQ-024`, `REQ-025`, `REQ-040`, `R-34`, `ADR-013`, `ADR-018` |
| 04-1 | `CASE-UI-04-1.md` | Navigation vers la documentation Instructions (`#/instructions`) | `SPEC-UI-04`, `AC-UI-04-1`, `ADR-017`, `ADR-013` |
| 04-2 | `CASE-UI-04-2.md` | Affichage des sections de documentation embarquée en français (`UI-050`, `UI-051`) | `SPEC-UI-04`, `AC-UI-04-2`, `ADR-017`, `ADR-012`, `ADR-013` |
| 04-3 | `CASE-UI-04-3.md` | Bouton « Enregistrer dans le dossier local » + feedback chemin `.agents/docs` | `SPEC-UI-04`, `AC-UI-04-3`, `ADR-017`, `ADR-013` |
