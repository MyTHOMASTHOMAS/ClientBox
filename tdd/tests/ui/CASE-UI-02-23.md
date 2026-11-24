# CASE-UI-02-23 — Validation E2E du parcours complet utilisateur : création depuis l'accueil, enrichissement multi-blocs, câblage, pan/zoom et persistance

**Spécification :** `SPEC-UI-02`, `SPEC-DATA-03`, `SPEC-UI-01`  
**Critère d'acceptation :** `AC-UI-02-1`, `AC-UI-02-6`, `AC-UI-02-11`, `AC-UI-02-13`, `AC-UI-02-14`, `AC-DATA-03-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-011`, `ADR-013`, `ADR-015`, `ADR-018`, `ADR-019`, `ADR-021`  
**Modules cibles :** `UI-020` (`canvas-board.tsx`), `UI-021` (`canvas-node.tsx`), `UI-023` (`canvas-toolbar.tsx`), `UI-024` (`inspector-panel.tsx`), `UI-030` (`scenarios-page.tsx`), `UI-031` (`scenario-studio-page.tsx`)  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) le parcours complet utilisateur (*End-to-End User Journey*) de conception d'un workflow local-first sans rupture de flux :
1. **Démarrage depuis l'accueil :** Navigation vers `#/scenarios` et instanciation d'un nouveau workflow via le bouton `[data-action="new-scenario"]` ("Nouveau scénario").
2. **Diversité des blocs déclarables :** Ajout successif des différents types de blocs fonctionnels (`Run`, `If`, `Command`, `ClearContext`, `CallScenario`) depuis la barre d'outils flottante.
3. **Restitution visuelle distinctive :** Vérification que chaque bloc affiché sur le canvas arbore son icône Material Symbols dédiée et cohérente avec la barre d'outils (`smart_toy`, `alt_route`, `terminal`, `mop`, `account_tree`).
4. **Câblage orienté :** Liaison d'un port de sortie à un port d'entrée avec matérialisation d'un câble SVG.
5. **Édition via l'inspecteur contextuel :** Sélection d'un bloc, affichage du panneau latéral, modification des paramètres (ex. identifiant d'agent, prompt ou commande shell) et répercussion immédiate dans le corps du nœud.
6. **Navigation de caméra (Pan & Zoom) :** Zoom continu à la molette et panoramique sur le fond du canvas, vérifiant que l'échelle (`scale`) s'adapte sans rupture des coordonnées logiques.
7. **Persistance synchrone :** Clic sur "Enregistrer", confirmation par message toast/bannière, et validation de l'écriture du fichier JSON complet sous `.agents/data/scenarios/`.

---

## Cas

```gherkin
Scénario : Création, renommage et composition complète d'un scénario depuis l'accueil
  Étant donné le navigateur ouvert sur la page d'accueil des scénarios ("#/scenarios")
  Quand l'utilisateur clique sur le bouton "Nouveau scénario" (data-action="new-scenario")
  Alors l'application navigue vers l'éditeur Studio
  Et le canvas d'orchestration est vierge sans aucun bloc initial
  Quand l'utilisateur saisit "Workflow E2E Valide" dans le champ de nom (data-field="scenario-name")
  Et clique sur le bouton "Start" de la barre d'outils (data-action="add-start")
  Alors un bloc Start apparaît sur le canvas
  Et le bouton d'ajout de Start devient désactivé (garantie d'unicité)

  Quand l'utilisateur clique successivement sur les boutons d'ajout de la barre d'outils :
    | action                  | typeBloc      | icône attendue |
    | add-run                 | run           | smart_toy      |
    | add-if                  | if            | alt_route      |
    | add-command             | command       | terminal       |
    | add-clear-context       | clearContext  | mop            |
    | add-call-scenario       | callScenario  | account_tree   |
  Alors 5 nouveaux blocs nodaux apparaissent sur la grille
  Et chaque bloc affiche son icône distinctive correspondante

  Quand l'utilisateur clique sur le bloc Command pour l'inspecter
  Alors le panneau latéral d'inspection s'affiche avec le champ commandLine
  Quand il saisit la commande "echo test-e2e" dans le champ
  Alors la carte du bloc Command sur le canvas affiche "Cmd: echo test-e2e"

  Quand l'utilisateur manipule la molette de la souris pour zoomer/dézoomer sur le canvas
  Alors la couche SVG des câbles et le conteneur des blocs reçoivent une transformation d'échelle scale
  Et l'application ne subit aucune dérive de positionnement

  Quand l'utilisateur clique sur le bouton "Enregistrer" (data-action="save-scenario")
  Alors un message de confirmation de sauvegarde s'affiche
  Et un fichier JSON correspondant au scénario est présent dans ".agents/data/scenarios/"
  Et son contenu préserve l'ensemble des blocs ajoutés et configurés
```

---

## Données

| Élément | Sélecteur DOM | Valeur de test |
|---|---|---|
| Bouton Nouveau Scénario | `button[data-action="new-scenario"]` | Clic d'ouverture |
| Palette d'ajout de blocs | `button[data-action^="add-"]` | `run`, `if`, `command`, `clearContext`, `callScenario` |
| Icônes de blocs | `span.material-symbols-outlined` | `smart_toy`, `alt_route`, `terminal`, `mop`, `account_tree` |
| Champ de commande shell | `textarea[data-field="commandLine"]` | `echo test-e2e` |
| Événement molette zoom | `deltaY: -300` / `deltaY: 300` | Facteur de zoom dynamique |
| Bouton Enregistrer | `button[data-action="save-scenario"]` | Clic de sauvegarde |
| Fichier persistant | `.agents/data/scenarios/*.json` | Validation JSON structure |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre total de blocs après ajouts | $\ge 6$ | 1 Start initial + 5 blocs ajoutés |
| Icônes distinctives validées | $5 / 5$ | Aucune confusion vers `smart_toy` pour les blocs non-run |
| Présence commande dans le bloc | `Cmd: echo test-e2e` | Restitution synchrone dans `renderNodeBody` |
| Persistance disque | `true` | Fichier JSON valide contenant les nœuds créés |

---

## Ce que ce cas ne vérifie pas

- La suppression interactive d'éléments sous caméra déplacée → `CASE-UI-02-24` ;
- L'exécution réelle du flux multi-agents streaming SSE → `CASE-UI-03-4`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_23_e2e_complete_workflow_lifecycle_creation_blocks_zoom_persistence`  
**Fichier :** `tests/e2e/ui/CASE-UI-02-23.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test démarre depuis l'accueil `#/scenarios` et clique sur "Nouveau scénario".
- [ ] Le test ajoute les 5 blocs fonctionnels (`run`, `if`, `command`, `clearContext`, `callScenario`).
- [ ] Le test vérifie la présence des icônes dédiées respectives.
- [ ] Le test configure le bloc `command` et valide la mise à jour sur le canvas.
- [ ] Le test teste l'interaction de zoom sur le canvas.
- [ ] Le test sauvegarde et vérifie la persistance du fichier JSON sur le disque.
- [ ] Le nom du test contient `CASE_UI_02_23`.
- [ ] Le test nettoie ses fichiers créés en post-test (`afterAll`).
