# Spécifications — Interface Utilisateur, Canvas & Terminal Live

**Domaine :** `UI`  
**Document maître :** `tdd/specs/sommaire.md`  
**ADR d'ancrage :** CDC §6 (Exclusion UI / Must UI), [`ADR-001`](../docs/adr/ADR-001-socle-applicatif.md), [`ADR-004`](../docs/adr/ADR-004-moteur-blocs.md), [`ADR-012`](../docs/adr/ADR-012-front-in-memory-exclusif-et-retrait-public-dir.md), [`ADR-013`](../docs/adr/ADR-013-ihm-preact-et-tailwind-css.md), [`ADR-015`](../docs/adr/ADR-015-integration-operationnelle-tailwind-css-v4-et-design-system.md), [`ADR-017`](../docs/adr/ADR-017-documentation-utilisateur-et-export-agents-docs.md), [`ADR-018`](../docs/adr/ADR-018-call-scenario-sous-runner.md), [`ADR-019`](../docs/adr/ADR-019-bloc-command.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v2.1.md` (CR-008 CallScenario + Command)

---

## SPEC-UI-01 — IHM en français, navigation et formulaires de gestion CRUD

**Exigences :** `REQ-007`, `REQ-008`, `REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `R-03`, `R-04`, `R-07`, `R-28`, `R-36`, `C-06`  
**Statut :** proposé  
**Version :** v1.5 (2026-11-06, sélection assistée de modèle sur les profils per CR-003)  

### Règle

> L'interface utilisateur web de ClientsBox est intégralement rédigée en français (`C-06`, `REQ-007`).
> Elle propose des vues de navigation et des formulaires complets pour lister, créer, éditer et supprimer les ressources déclaratives de l'espace `.agents/data/` (agents, profils, prompts, conditions exit et scénarios, `REQ-009..012`, `R-36`).
> Le sélecteur de CLI dans la création ou l'édition d'un agent est strictement restreint aux adapters opérationnels embarqués (`cursor-cli`, `antigravity`, `codex-cli` et `claude-cli`, `R-04`, `R-28`, `REQ-008`).
> La configuration d'un agent exige obligatoirement l'assignation à exactement un profil existant (`R-03`, `R-05`, `R-07`).
> - **Autocomplétion et saisie libre assistée :** L'IHM propose un composant d'entrée générique (`<AutocompleteInput />`) permettant d'interroger en temps réel des sources de données locales ou distantes via une fonction de recherche modulable. Le composant présente un menu déroulant de suggestions sélectionnables à la souris ou au clavier (flèches + Entrée) pour pré-remplir le champ. Il applique un principe de saisie libre stricte sans validation bloquante : l'utilisateur peut forcer et valider n'importe quelle valeur personnalisée en dehors des suggestions proposées (`REQ-007`, `REQ-011`, `REQ-014`).
> - **Sélection de modèle d'IA sur les agents :** La modale de gestion d'agent (`AgentFormModal`) intègre un champ `<AutocompleteInput />` pour renseigner le modèle d'IA cible (`model`). Ce champ interroge la liste des modèles exposés par l'API REST (`GET /api/models`), filtrés dynamiquement selon l'adapter CLI choisi (`cliId`), permet le choix d'un modèle suggéré ou la saisie libre, et est facultatif. La page des agents (`AgentsPage`) affiche le modèle configuré sous forme de badge textuel.

### Portée

- Couvre l'exhaustivité des libellés, menus, boutons et messages d'erreur de l'UI en langue française.
- Couvre la navigation entre les rubriques principales (Scénarios, Agents, Profils, Prompts, Conditions Exit) via des composants Preact réactifs.
- Couvre les formulaires CRUD de chaque type de ressource développés en composants Preact avec validation réactive des champs requis et design system Tailwind CSS v4.
- Couvre le composant générique d'autocomplétion `<AutocompleteInput />` dans les primitives partagées (`components/common/`), son comportement de recherche synchrone/asynchrone, sa navigation clavier et son mode de saisie libre non bloquant.
- Couvre l'intégration du sélecteur de modèle d'IA avec autocomplétion libre dans le formulaire d'agent et son affichage dans la liste des agents.
- Couvre la sélection de la politique de profil parmi les 3 modes (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`).
- Couvre le filtrage du sélecteur de CLI d'agent sur les seuls adapters opérationnels.
- Ne couvre pas la persistance sur disque sous `.agents/data/` → `SPEC-DATA-01` et `SPEC-DATA-04`.
- Ne couvre pas l'éditeur de canvas → `SPEC-UI-02`.

### Scénarios nominaux

```gherkin
Scénario : Navigation et affichage de l'interface en français
  Étant donné l'utilisateur accédant à l'application web ClientsBox sur "http://localhost:2974"
  Quand la page d'accueil se charge
  Alors tous les menus, onglets, boutons et libellés sont affichés en français
  Et les rubriques Scénarios, Agents, Profils et Prompts sont accessibles

Scénario : Création d'un agent avec sélection d'un profil, du CLI et du modèle d'IA
  Étant donné l'utilisateur ouvrant le formulaire de création d'agent
  Quand il saisit le nom "Agent Test", sélectionne le profil "Expert Dev", choisit le CLI "cursor-cli"
  Et choisit le modèle d'IA "gpt-5.3-codex" via les suggestions d'autocomplétion adaptées à ce CLI
  Alors l'enregistrement crée avec succès l'agent associé à son profil, son CLI et son modèle d'IA

Scénario : Configuration d'un profil avec choix de politique d'envoi
  Étant donné le formulaire de création de profil
  Quand l'utilisateur renseigne le prompt système et sélectionne la politique "debut_scenario"
  Alors le profil et la politique sont validés et sauvegardés avec succès

Scénario : Affichage des suggestions lors de la saisie assistée
  Étant donné un champ AutocompleteInput configuré avec une fonction de recherche
  Quand l'utilisateur saisit du texte dans le champ
  Alors les suggestions correspondantes sont affichées dans un menu déroulant flottant

Scénario : Pré-remplissage du champ par sélection d'une suggestion
  Étant donné un menu de suggestions d'autocomplétion ouvert
  Quand l'utilisateur clique sur une suggestion ou la sélectionne au clavier avec Entrée
  Alors la valeur de l'input est mise à jour avec la valeur de la suggestion
  Et le menu de suggestions se referme

Scénario : Saisie libre forcée en dehors des suggestions
  Étant donné un champ AutocompleteInput recevant une saisie qui ne correspond à aucune suggestion
  Quand l'utilisateur valide ou soumet le formulaire
  Alors la valeur brute saisie par l'utilisateur est conservée sans blocage ni erreur de validation

Scénario : Navigation clavier et fermeture du menu d'autocomplétion
  Étant donné un menu d'autocomplétion ouvert affichant plusieurs suggestions
  Quand l'utilisateur appuie sur les touches Flèche Bas ou Flèche Haut
  Alors les éléments sont successivement mis en surbrillance
  Quand l'utilisateur appuie sur la touche Échap ou clique en dehors
  Alors le menu se referme sans modifier la valeur courante du champ
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Saisie d'un identifiant déjà utilisé lors de la création d'une ressource | Affichage d'un message d'erreur explicite en français signalant la collision sans écraser la ressource existante. |
| 2 | Soumission d'un formulaire avec un champ obligatoire manquant (ex. `profilId` non sélectionné) | Blocage de la validation avec surbrillance du champ en erreur et message explicatif en français. |
| 3 | Tentative de sélection d'un CLI non opérationnel ou non embarqué | Impossible : la liste déroulante ne propose que les adapters opérationnels vérifiés (`R-04`, `R-28`). |
| 4 | Frappe rapide déclenchant plusieurs recherches asynchrones concurrentes | Seule la réponse correspondant à la dernière requête émise met à jour les suggestions (garde anti race-condition). |
| 5 | Touche Échap enfoncée alors que le menu d'autocomplétion est ouvert | Le menu est fermé immédiatement et l'événement est intercepté sans impacter les composants parents. |
| 6 | Clic en dehors du composant (click outside) | Le menu de suggestions est masqué et la valeur textuelle courante est préservée. |
| 7 | Champ modèle laissé vide dans le formulaire de profil | Validation réussie sans erreur (le modèle est optionnel). |

### Ce qui n'est pas défini

- *2026-10-27 (ADR-015)* — Le thème standard épuré et lisible repose sur le design system sombre Tailwind CSS v4 (`DESIGN.md`, palette de surfaces `#090d16` / `#111827`, bordures `#334155` et statuts sémantiques) compilé in-memory.
- *2026-11-06 (CR-003)* — Pas d'interface graphique de sélection de crochets `[context=...,effort=...]` : saisie libre via l'input texte.

### Critères d'acceptation

- [ ] `AC-UI-01-1` — L'intégralité de l'interface utilisateur, messages et libellés est rédigée en français (`CASE-UI-01-1`).
- [ ] `AC-UI-01-2` — L'IHM propose des formulaires de gestion CRUD complets pour les agents, profils, prompts, exit et scénarios (`CASE-UI-01-2`).
- [ ] `AC-UI-01-3` — Le sélecteur de CLI d'un agent n'affiche que les adapters opérationnels embarqués (`cursor-cli`, `antigravity`, `codex-cli`, `claude-cli`) (`CASE-UI-01-3`).
- [ ] `AC-UI-01-4` — L'interface utilisateur charge et restitue visuellement sans erreur les fichiers de ressources dans les tables correspondantes (`CASE-UI-01-5`, `ADR-011`).
- [ ] `AC-UI-01-5` — Le composant générique d'autocomplétion `<AutocompleteInput />` prend en charge la recherche modulaire synchrone ou asynchrone, le pré-remplissage à la sélection, la navigation clavier et la saisie libre sans validation bloquante (`CASE-UI-01-13`).
- [ ] `AC-UI-01-6` — Le formulaire d'agent permet la saisie assistée ou libre du modèle d'IA cible filtré par CLI et la table des agents affiche le modèle configuré (`CASE-UI-01-2`).
- [ ] `AC-UI-01-5` — L'IHM propose un composant générique d'autocomplétion `<AutocompleteInput />` à recherche modulaire, supportant le pré-remplissage par sélection et la saisie libre non bloquante (`CASE-UI-01-13`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la complétude de la langue française sur tous les composants UI | Acceptée | Conforme au CDC §6 et Contrainte 6 (`C-06`, `REQ-007`). |
| Formaliser le composant générique d'autocomplétion libre | Acceptée | 2026-11-06 — Ajout d'une primitive réutilisable d'aide à la saisie dans components/common/ per AC-UI-01-5. |

---

## SPEC-UI-02 — Canvas d'orchestration visuel (style N8N)

**Exigences :** `REQ-014`, `REQ-015`, `REQ-030`, `REQ-035`, `REQ-039`, `REQ-041`, `REQ-042`, `REQ-043`, `REQ-045`, `REQ-111`, `R-08`, `R-09`, `R-10`, `R-11`, `R-12`, `R-13`, `R-14`, `R-15`, `R-37`, `R-43`, `R-46`, `R-47`, `R-49`, `REQ-107`  
**Statut :** proposé  
**Version :** v2.0 (2026-11-16, CR-010 — Navigation spatiale Pan & Zoom sur le Canvas)  

### Règle

> Le canvas propose un éditeur visuel nodale (style N8N) pour orchestrer les flux d'agents (`REQ-014`, `REQ-035`, `REQ-107`).
> - **Composition nodale :** Permet de glisser-déposer les **6** types de blocs (Start, Run, If, ClearContext, CallScenario, **Command**), de renseigner leurs paramètres statiques et de les relier par des liaisons orientées (câbles) entre ports de sortie et ports d'entrée.
> - **Navigation spatiale Pan & Zoom :**
>   - **Déplacement libre (Pan) :** Un clic gauche maintenu sur le fond vide du canvas (hors nœuds, câbles et ports) permet d'« agripper » et de translater la vue nodiale en temps réel (`REQ-045`, `R-49`, `ADR-021`). Le curseur de la souris adopte visuellement l'état `cursor: grab` au survol de la zone vide, et `cursor: grabbing` pendant la translation active. La translation déplace uniquement la matrice de vue (`pan.x`, `pan.y`) et préserve rigoureusement les coordonnées absolues `position` des nœuds dans le modèle de scénario.
>   - **Zoom / Dézoom centré au curseur (Zoom) :** L'action sur la molette de la souris (`wheel`) ajuste le facteur d'échelle d'affichage de manière continue entre **0.25x (25%) et 2.0x (200%)**, avec **1.0x (100%)** par défaut à l'ouverture du scénario. Le zoom est géométriquement centré sur la position instantanée du curseur de la souris (le point sous le curseur reste stationnaire à l'écran).
>   - **Isomorphisme et précision absolue des interactions :** La fonction de projection d'espace `clientToCanvas` intègre obligatoirement la translation `pan` et le facteur d'échelle `zoom`. Le drag-and-drop de blocs et le câblage interactif vers les ports d'entrée conservent une précision parfaite au pixel près quel que soit le niveau de zoom et de translation actif.
> - **CallScenario (inspecteur) :** paramètre statique `targetScenarioId` via dropdown listant les scénarios du projet **y compris** le scénario courant (auto-appel autorisé) ; ports power multi-câbles (1..N in / 0..N out) ; aucun champ de paramètre métier in/out (`REQ-039`, `R-46`, `REQ-041`).
> - **Command (inspecteur) :** paramètre statique `commandLine` via champ texte (saisie libre, non vide) ; **pas** de champs agent / prompt / exit ; ports power multi-câbles (1..N in / 0..N out) (`REQ-042`, `REQ-043`, `R-47`).
> - **Unicité du bloc Start :** Le canvas garantit qu'un scénario ne peut contenir qu'un seul et unique bloc Start (`REQ-015`, `R-19`). L'insertion d'un second Start est bloquée par l'interface.
> - **Distinction graphique des 2 familles If :** Les deux familles de sorties du bloc If (branche vraie / branche fausse) sont visuellement distinctes (code couleur vert/rouge ou libellés clairs "Vrai" / "Faux", `R-10b`, `R-15`).
> - **Gestion des clés d'entrées (`keys`) :** Le canvas permet de visualiser et d'éditer les clés des connexions d'entrées. Les clés numériques par défaut sont renumérotées lors de suppressions, les clés custom sont préservées, et les collisions sur un même bloc cible sont interdites (`R-13`, `R-43`).
> - **Suppression interactive d'un câble :** Un premier clic sur un câble affiche une petite option « Supprimer » près de la liaison ; un second clic sur cette option retire la connexion du canvas et du modèle. Un clic ailleurs referme l'option sans supprimer (`REQ-035`, `R-43`).
> - **Suppression interactive d'un bloc :** Lorsqu'un bloc est sélectionné sur le canvas, l'utilisateur peut le supprimer via le bouton « Supprimer ce bloc » (`data-action="delete-node"`) situé dans le panneau latéral d'inspection (`InspectorPanel`), ou via le raccourci clavier Suppr / Backspace (hors champ de saisie actif). La suppression retire le nœud du canvas et du modèle via `removeBlock`, élimine en cascade tous les câbles entrants et sortants qui lui sont connectés, renumérote les clés d'entrées numériques restantes per `R-43`, et referme l'inspecteur. Si le bloc supprimé est Start, l'insertion d'un nouveau bloc Start redevient immédiatement autorisée.
> - **Indicateurs d'état d'exécution :** En cours de scénario, l'état de chaque nœud est reflété visuellement en temps réel (inactif, en cours, en pause, terminé, en erreur). Cet état est **volatil** (mémoire UI / SSE / snapshot run) et ne fait pas partie du document scénario persisté.
> - **Enregistrer / load et liste no-save :** Lors de la construction du payload « Enregistrer » et lors de l'hydratation d'un scénario chargé, le Studio retire de chaque nœud toutes les clés listées par `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`, `SPEC-DATA-03`, `AC-DATA-03-6`) — au minimum `status`.
> - **Verrouillage édition pendant un run (front only) :** Tant que le Studio considère le scénario **actif** (`isRunning === true`, ou `launchLocked === true`, ou snapshot GET `/run` avec `busy === true`), l'IHM **bloque** : Enregistrer (`data-action="save-scenario"`), ajout/suppression de blocs, déplacement de nœuds, câblage / suppression de câbles, et édition des paramètres dans le panneau inspecteur. Le Stop et le terminal live restent disponibles. Le déplacement de caméra (Pan) et le Zoom restent permis pour observer le graphe. Aucune contrainte HTTP 4xx dédiée n'est exigée côté back pour ce verrou — garde-fou UX uniquement.
> - **Lancement du scénario :** L'interface du canvas propose un contrôle d'exécution permettant de déclencher le lancement du scénario (`REQ-030`).

### Portée

- Couvre le rendu interactif du graphe de scénario via des composants Preact déclaratifs et SVG réactifs, le déplacement des blocs et la géométrie des connexions.
- Couvre le viewport de caméra bidimensionnel dynamique (`pan: Point`, `zoom: number`) et la transformation géométrique SVG/VDOM.
- Couvre la détection et la cinématique pointer de Pan sur le fond vide (`grab`/`grabbing`).
- Couvre le calcul de zoom centré sur la position souris lors des événements `wheel` avec bornes `[0.25, 2.0]`.
- Couvre la projection matricielle affine inverse `clientToCanvas` prenant en compte `pan` et `zoom`.
- Couvre la configuration des paramètres statiques via un composant Preact de panneau latéral d'inspection contextuel adapté au type de bloc (affichage direct des seules propriétés éditables sans onglets transverses) et stylisation Tailwind CSS v4.
- Couvre l'interdiction de créer plus d'un bloc Start dans le canvas.
- Couvre la distinction visuelle explicite des deux branches du bloc If.
- Couvre l'affichage et la saisie des clés d'entrées (`keys`) sur les ports de réception.
- Couvre la sélection d'un câble et sa suppression en deux clics (option « Supprimer » puis confirmation).
- Couvre la sélection et la suppression interactive d'un bloc depuis l'inspecteur contextuel (`InspectorPanel`) ou le clavier (Suppr/Backspace), avec nettoyage en cascade de ses câbles et fermeture de l'inspecteur.
- Couvre le retour visuel réactif de l'état d'exécution des blocs (dont l'état de pause de join) avec palette d'état Tailwind CSS v4.
- Couvre l'application UI de la liste no-save (`SCENARIO_NODE_NO_SAVE_KEYS`) à l'Enregistrer et au load canvas.
- Couvre le verrouillage front de l'édition et de la sauvegarde pendant un run / pause actif (y compris après réhydratation `busy`).
- Couvre l'ajout toolbar et la configuration inspecteur du bloc CallScenario (dropdown scénarios, courant inclus).
- Couvre l'ajout toolbar et la configuration inspecteur du bloc Command (champ `commandLine`).
- Ne couvre pas l'algorithme moteur de Join et Power → `SPEC-ENG-02`.
- Ne couvre pas le sous-runner in-process → `SPEC-ENG-03` / `ADR-018`.
- Ne couvre pas le spawn shell Command → `SPEC-ENG-03`.
- Ne couvre pas le contrat canonique du format JSON ni le contenu de la constante no-save → `SPEC-DATA-03` / `DOM-018`.
- Ne couvre pas l'algorithme pur de renumérotation des clés → `SPEC-DATA-03`.
- Ne couvre pas un rejet HTTP serveur de PUT scénario pendant un run (hors v1 ; le filet est UI).

### Scénarios nominaux

```gherkin
Scénario : Composition et liaison visuelle de blocs sur le canvas
  Étant donné un canvas de scénario ouvert
  Quand l'utilisateur glisse un bloc Start, un bloc Run et un bloc If
  Et relie la sortie de Start à l'entrée de Run, puis la sortie de Run à l'entrée de If
  Alors les liaisons sont tracées à l'écran avec les clés d'entrées assignées
  Et les paramètres de chaque bloc sont configurables dans le panneau contextuel dédié (uniquement les champs éditables propres à son type)

Scénario : Déplacement de la caméra (Pan) par glisser sur le fond vide
  Étant donné un canvas de scénario ouvert avec une translation pan initiale (0, 0)
  Quand l'utilisateur effectue un clic gauche maintenu sur le fond vide et déplace la souris de 100px vers la droite et 50px vers le bas
  Alors la translation pan du canvas passe à (100, 50)
  Et les coordonnées persistées position des nœuds du scénario ne sont pas modifiées
  Et le curseur de la souris affiche le style grabbing pendant le déplacement

Scénario : Zoom avant et zoom arrière centré à la molette
  Étant donné un canvas de scénario avec un zoom initial de 1.0 (100%)
  Quand l'utilisateur actionne la molette vers l'avant au point curseur (300, 200)
  Alors le facteur de zoom augmente de manière continue
  Et le point virtuel du graphe situé sous (300, 200) reste stationnaire à la même position écran
  Quand l'utilisateur actionne la molette vers l'arrière
  Alors le facteur de zoom diminue jusqu'à la borne minimale de 0.25 (25%) sans descendre en dessous

Scénario : Précision du câblage et du drag de nœud sous zoom variable
  Étant donné un canvas zoomé à 1.5 (150%) et translaté de (200, 100)
  Quand l'utilisateur clique sur le port de sortie d'un nœud et tire un câble vers le port d'entrée d'un autre nœud
  Alors la position de prévisualisation et la détection d'accroche (hit test) correspondent exactement à la position du curseur
  Et la nouvelle connexion est créée avec succès entre les deux nœuds

Scénario : Ajout et configuration d'un bloc CallScenario
  Étant donné un canvas de scénario "parent" ouvert
  Quand l'utilisateur ajoute un bloc CallScenario depuis la toolbar
  Alors l'inspecteur propose un dropdown de scénarios incluant "parent"
  Et le nœud expose des ports d'entrée et de sortie power configurables

Scénario : Ajout et configuration d'un bloc Command
  Étant donné un canvas de scénario ouvert
  Quand l'utilisateur ajoute un bloc Command depuis la toolbar
  Alors l'inspecteur propose un champ texte commandLine
  Et aucun champ agent, prompt ou exit n'est affiché
  Et le nœud expose des ports d'entrée et de sortie power configurables

Scénario : Blocage de l'insertion d'un second bloc Start
  Étant donné un canvas contenant déjà un bloc Start
  Quand l'utilisateur tente d'ajouter un nouveau bloc Start
  Alors l'action est refusée par l'interface avec un message explicatif en français

Scénario : Distinction graphique des branches vraie et fausse du bloc If
  Étant donné un bloc If présent sur le canvas
  Quand l'utilisateur inspecte les ports de sortie du bloc
  Alors deux connecteurs distincts "Vrai" (vert) et "Faux" (rouge) sont visibles
  Et les câbles branchés sur chaque connecteur héritent de cette différenciation visuelle

Scénario : Visualisation de l'état en pause sur un bloc en attente
  Étant donné un scénario en cours d'exécution où un bloc Run reçoit sum(power) < N
  Quand le moteur passe le bloc en état pause
  Alors le nœud correspondant sur le canvas affiche un indicateur visuel "En pause"

Scénario : Déclenchement du lancement d'un scénario depuis le canvas
  Étant donné un scénario valide ouvert sur le canvas
  Quand l'utilisateur clique sur le bouton "Lancer le scénario"
  Alors l'ordre d'exécution est transmis au moteur d'orchestration
  Et le statut du nœud Start passe à l'état actif

Scénario : Suppression d'un câble en deux clics
  Étant donné un canvas contenant au moins une liaison orientée entre deux blocs
  Quand l'utilisateur clique une première fois sur le câble
  Alors une option "Supprimer" apparaît près de la liaison
  Quand l'utilisateur clique une seconde fois sur cette option "Supprimer"
  Alors le câble disparaît du canvas et la connexion est retirée du modèle de scénario

Scénario : Annulation de l'option de suppression d'un câble
  Étant donné un câble sélectionné affichant l'option "Supprimer"
  Quand l'utilisateur clique ailleurs sur le canvas (hors option et hors même câble)
  Alors l'option "Supprimer" disparaît
  Et la connexion demeure intacte

Scénario : Suppression d'un bloc via le bouton de l'inspecteur
  Étant donné un bloc sélectionné sur le canvas avec le panneau d'inspection ouvert
  Quand l'utilisateur clique sur le bouton "Supprimer ce bloc" (data-action="delete-node")
  Alors le bloc disparaît du canvas et du modèle de scénario
  Et toutes les connexions entrantes et sortantes qui lui étaient reliées sont supprimées
  Et le panneau d'inspection se ferme (désélection du nœud)

Scénario : Suppression d'un bloc via la touche Suppr ou Backspace
  Étant donné un bloc sélectionné sur le canvas (hors focus d'un champ de saisie)
  Quand l'utilisateur appuie sur la touche Suppr ou Retour arrière
  Alors le bloc et ses liaisons sont supprimés du canvas
  Et le panneau d'inspection se ferme

Scénario : Réautorisation de l'insertion Start après suppression de Start
  Étant donné un canvas contenant un bloc Start
  Quand l'utilisateur supprime ce bloc Start
  Alors le bouton d'ajout de Start (data-action="add-start") redevient actif
  Et l'utilisateur peut insérer un nouveau bloc Start

Scénario : Enregistrer exclut les champs no-save du payload
  Étant donné un canvas dont un nœud Run affiche status="running" en mémoire UI
  Quand l'utilisateur clique sur "Enregistrer"
  Alors le payload envoyé au PUT/POST scénario ne contient aucune clé de SCENARIO_NODE_NO_SAVE_KEYS sur les nœuds
  Et les paramètres de design du nœud (agentId, promptId, position, …) sont présents

Scénario : Load d'un scénario ignore les champs no-save présents sur disque
  Étant donné un fichier scénario dont un nœud porte encore "status": "completed"
  Quand le Studio charge ce scénario sur le canvas
  Alors le modèle nœud hydraté ne conserve pas les clés de SCENARIO_NODE_NO_SAVE_KEYS issues du disque
  Et aucun indicateur d'exécution n'est affiché comme actif du seul fait du JSON

Scénario : Verrouillage édition et sauvegarde pendant un run
  Étant donné un Studio dont isRunning ou launchLocked vaut true
  Quand l'utilisateur tente d'Enregistrer, d'ajouter un bloc, de déplacer un nœud, de câbler ou d'éditer l'inspecteur
  Alors ces actions sont refusées ou les contrôles sont désactivés
  Et le bouton Stop demeure utilisable
  Et la navigation Pan et Zoom reste accessible pour inspecter le graphe

Scénario : Verrouillage après réhydratation busy
  Étant donné un snapshot GET /api/scenarios/:id/run avec busy=true
  Quand le Studio réhydrate l'état d'exécution
  Alors l'édition et Enregistrer restent verrouillés comme pendant un run local
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Tentative de saisie d'une clé d'entrée déjà existante sur le même bloc cible | Alerte visuelle de collision, saisie rejetée et maintien de la clé antérieure (`R-13`). |
| 2 | Suppression d'un câble d'entrée portant une clé numérique séquentielle | Renumérotation visuelle automatique immédiate des clés numériques restantes sur le bloc cible (`R-43`). |
| 3 | Suppression d'un câble d'entrée portant une clé personnalisée | La clé custom est retirée sans modifier les libellés des autres clés personnalisées du bloc. |
| 4 | Erreur survenant sur un nœud lors du run | Le nœud passe instantanément en surbrillance rouge avec affichage d'un diagnostic d'erreur. |
| 5 | Clic sur un second câble alors qu'un premier câble affiche déjà « Supprimer » | Seul le second câble reste sélectionné ; l'option du premier disparaît sans supprimer. |
| 6 | JSON scénario pollué avec `status: "running"` au cold start | Après load + strip, aucun pulse « en cours » tant qu'aucun snapshot/SSE run ne le justifie (`AC-DATA-03-6`). |
| 7 | Fin de run (`completed` / `stopped` / `error`) ou snapshot `busy=false` | Le verrou édition/sauvegarde est levé ; Enregistrer et la manipulation du graphe redeviennent possibles. |
| 8 | Run en `paused` (join) avec runner toujours actif | Le verrou reste actif (même sémantique que `busy` / `launchLocked`). |
| 9 | Touche Suppr / Backspace enfoncée lors de la saisie dans un input texte | La suppression du bloc sélectionné est ignorée ; seul le texte dans le champ est édité. |
| 10 | Tentative de suppression d'un bloc pendant un run actif | L'action de suppression (bouton ou clavier) est verrouillée et sans effet (`AC-UI-02-9`). |
| 11 | Suppression d'un bloc avec plusieurs liaisons entrantes et sortantes | Tous les câbles associés sont supprimés sans orphelins résiduels et les clés numériques restantes sur les cibles sont renumérotées (`R-43`). |
| 12 | Clic sur un nœud ou un port lors d'une tentative de Pan | Le Pan est inhibé : l'interaction est traitée comme une sélection/drag de nœud ou un début de câblage (`AC-UI-02-13`). |
| 13 | Tentative de zoom au-delà de 2.0x (200%) ou en-deçà de 0.25x (25%) | Le facteur de zoom est strictement clampé aux bornes minimales et maximales sans déformation (`AC-UI-02-14`). |
| 14 | Navigation Pan et Zoom pendant un run actif (`isRunning === true`) | La navigation spatiale (déplacement de la caméra et zoom) reste totalement fonctionnelle pour observer les blocs distants (`AC-UI-02-13`, `AC-UI-02-14`). |

### Ce qui n'est pas défini

- *2026-09-22* — Mini-map de navigation : optionnelle en v1, le zoom/pan standard sur le canvas est suffisant.
- *2026-11-04* — Rejet HTTP serveur (ex. 409) d'un PUT scénario pendant un run actif : non requis en v1 (verrou front only).
- *2026-11-16* — Sauvegarde de l'état de caméra `pan`/`zoom` dans le JSON du scénario : hors scope v1 (réinitialisation à `(0,0)` et 100% à l'ouverture).

### Critères d'acceptation

- [ ] `AC-UI-02-1` — Le canvas permet la création, le déplacement, la configuration et le câblage interactif des blocs (`CASE-UI-02-1`).
- [ ] `AC-UI-02-2` — Le canvas garantit l'unicité stricte du bloc Start dans tout scénario (`CASE-UI-02-2`).
- [ ] `AC-UI-02-3` — Les deux familles de sorties du bloc If sont visuellement différenciées de manière explicite (`CASE-UI-02-3`).
- [ ] `AC-UI-02-4` — Le statut d'exécution de chaque nœud (inactif, en cours, pause, terminé, erreur) est visible en temps réel (`CASE-UI-02-4`).
- [ ] `AC-UI-02-5` — L'interface du canvas permet de déclencher le lancement de l'exécution du scénario (`CASE-UI-02-5`).
- [ ] `AC-UI-02-6` — Validation E2E dans un navigateur réel de l'interaction nodale sur le Canvas (nœuds, câblage, réactivité graphique) (`CASE-UI-02-6`, `ADR-011`).
- [ ] `AC-UI-02-7` — Un câble se sélectionne au premier clic (option « Supprimer » visible) et se retire au second clic sur cette option ; un clic ailleurs annule sans supprimer (`CASE-UI-02-14`).
- [ ] `AC-UI-02-8` — Enregistrer et load canvas appliquent `SCENARIO_NODE_NO_SAVE_KEYS` (`DOM-018`) : aucune clé no-save dans le payload ni reprise depuis un JSON pollué (`CASE-UI-02-15`, `AC-DATA-03-6`).
- [ ] `AC-UI-02-9` — Pendant un run actif (y compris pause join et réhydratation `busy`), l'édition du graphe et Enregistrer sont bloqués côté front ; Stop reste disponible (`CASE-UI-02-16`).
- [ ] `AC-UI-02-10` — Le canvas et l'inspecteur permettent la suppression interactive d'un bloc sélectionné (bouton `delete-node` et raccourci clavier), entraînant le retrait en cascade de ses liaisons, la réautorisation de l'insertion Start, la fermeture de l'inspecteur et le respect du verrou de run (`CASE-UI-02-17`).
- [ ] `AC-UI-02-11` — Le canvas permet d'ajouter un bloc CallScenario et de choisir `targetScenarioId` via dropdown incluant le scénario courant (`CASE-UI-02-18`, `REQ-039`, `REQ-041`).
- [ ] `AC-UI-02-12` — Le canvas permet d'ajouter un bloc Command et de saisir `commandLine` dans l'inspecteur (sans agent/prompt/exit) (`CASE-UI-02-19`, `REQ-042`, `REQ-043`).
- [ ] `AC-UI-02-13` — Le clic-glissé sur le fond vide du canvas applique une translation bidimensionnelle `pan` avec état de curseur `grab`/`grabbing`, sans altérer la position persistée des blocs (`CASE-UI-02-20`, `REQ-045`, `R-49`).
- [ ] `AC-UI-02-14` — L'action de la molette ajuste le facteur d'échelle `zoom` de manière continue, centré sur le curseur, et contraint entre 0.25x et 2.0x (`CASE-UI-02-21`, `REQ-045`).
- [ ] `AC-UI-02-15` — Les interactions de drag de bloc et de connexion de câble demeurent géométriquement isomorphes et précises sous tout état de `pan` et de `zoom` (`CASE-UI-02-22`, `REQ-045`).
- [ ] `AC-UI-02-16` — Validation E2E dans un navigateur réel du cycle de vie complet d'un workflow : création depuis l'accueil, enrichissement multi-blocs (`run`, `if`, `command`, `clearContext`, `callScenario`), câblage, pan/zoom et persistance (`CASE-UI-02-23`, `ADR-011`).
- [ ] `AC-UI-02-17` — Validation E2E dans un navigateur réel de la suppression interactive de câble (2 clics) et de bloc (inspecteur) sous caméra naviguée sans conflit avec la capture de panoramique (`CASE-UI-02-24`, `ADR-011`, `ADR-021`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la visibilité de l'état en pause lors du join | Acceptée | Conforme au CDC §6 et §8 R-42b. |
| Exposer CallScenario dans toolbar + inspecteur | Acceptée | 2026-11-13 — CR-008 / CDC v2.1. |
| Exposer Command dans toolbar + inspecteur (commandLine) | Acceptée | 2026-11-13 — CR-008 / CDC v2.1 R-47. |
| Formaliser le geste de suppression de câble en deux clics | Acceptée | 2026-11-03 — La suppression de liaison est déjà exigée (`REQ-035`, `R-43`) ; le geste UI (sélection puis confirmation visuelle) complète `SPEC-UI-02` sans changer l'algorithme de renumérotation (`SPEC-DATA-03`). |
| Exclure `status` (et futurs champs runtime) du JSON via constante partagée | Acceptée | 2026-11-04 — Aligné `SPEC-DATA-03` / `DOM-018` ; l'UI consomme la liste, elle ne la redéfinit pas. |
| Verrouiller édition/sauvegarde pendant un run uniquement côté front | Acceptée | 2026-11-04 — Garde-fou UX ; évite de muter le graphe pendant l'exécution sans imposer un 409 PUT en v1. |
| Formaliser le geste de suppression de bloc (bouton inspecteur + clavier) | Acceptée | 2026-11-06 — Complète SPEC-UI-02 en reliant la fonction existante removeBlock à un geste utilisateur explicite dans l'IHM et au clavier per AC-UI-02-10. |
| Intégrer Pan & Zoom sur le Canvas Studio (CR-010) | Acceptée | 2026-11-16 — Déplacement par clic-glissé fond vide, zoom molette centré au curseur, préservation stricte de la géométrie de câblage per AC-UI-02-13..15. |

---

## SPEC-UI-03 — Terminal live non persisté et contrôles d'exécution

**Exigences :** `REQ-024`, `REQ-025`, `REQ-040`, `REQ-043`, `R-26`, `R-34`, `REQ-110`  
**Statut :** proposé  
**Version :** v1.6 (2026-11-13, CR-008 — Stop / terminal CallScenario + Command)  

### Règle

> L'interface web intègre un composant terminal affichant en direct les chunks de texte `stdout` et `stderr` streamés pendant l'exécution d'un bloc Run **ou** Command (`REQ-024`, `R-26`, `REQ-110`, `REQ-043`).
> Ce terminal est purement volatil (mémoire temporaire du navigateur) : aucun chunk ni journal d'exécution n'est persisté sur disque sous `.agents/data/` (`R-37`, `REQ-111`).
> L'UI propose le bouton de contrôle d'exécution :
> - **Arrêt d'urgence (Stop) :** accessible et actif pendant l'exécution d'un bloc Run / Command et pendant un état de pause, déclenchant le kill immédiat du processus (`REQ-025`, `R-34`). Le Stop du run **racine** interrompt aussi toute sous-exécution CallScenario, ses spawns, et tout process Command (`REQ-025`, `REQ-043`, ADR-018).
>
> L'UI ne propose **aucun** bouton d'effacement manuel du contexte d'un agent (vue Agents, barre du canvas, contrôles du terminal) : la mémoire est spécifique à une exécution de scénario et ne s'efface que par un bloc ClearContext (`SPEC-ADPT-03`). Le bouton d'**ajout** d'un bloc ClearContext sur le canvas (`[data-action="add-clear-context"]`) est conservé.
> **CallScenario / recovery :** l'inspection live (pastilles, snapshot `GET /run`, SSE) porte sur le scénario **racine**. Ouvrir le canvas d'un scénario enfant pendant un CallScenario actif ne réhydrate **pas** l'état interne du sous-run (idle / foreign run) (`REQ-024`, `REQ-040`). Aucun canal SSE dédié « scénario enfant » en V1 de la feature.

### Portée

- Couvre l'affichage fluide et scrollable des lignes de sortie du CLI dans un composant Preact de terminal web réactif connecté aux flux SSE (`GET /api/scenarios/:id/stream`).
- Couvre le bouton d'action Stop et son accessibilité en cours de run et en état de pause avec gestion d'état déclarative Preact.
- Couvre l'absence de tout bouton de reset manuel de contexte.
- Couvre la nature purement volatile du terminal dans le frontend sans enregistrement fichier.
- Couvre la non-exposition UI de l'état interne d'un scénario enfant (CallScenario).
- Ne couvre pas la transmission des flux depuis le backend → `SPEC-SRV-02` et `SPEC-ADPT-01`.
- Ne couvre pas les signaux système `SIGTERM`/`SIGKILL` du processus hôte → `SPEC-ADPT-03`.

### Scénarios nominaux

```gherkin
Scénario : Streaming temps réel dans le terminal UI lors d'un bloc Run
  Étant donné un scénario en cours d'exécution avec un bloc Run actif
  Quand le processus CLI émet des flux stdout ou stderr
  Alors les lignes de sortie apparaissent en continu dans le terminal de l'IHM
  Et aucun fichier de trace n'est créé sous ".agents/data/"

Scénario : Déclenchement de l'arrêt d'urgence Stop par l'utilisateur
  Étant donné un bloc Run en cours d'exécution
  Quand l'utilisateur clique sur le bouton "Stop"
  Alors le signal d'interruption est immédiatement envoyé au serveur
  Et le scénario passe à l'état stoppé avec confirmation visuelle dans l'UI

Scénario : Aucun reset manuel du contexte
  Étant donné la vue Agents, la barre d'outils du canvas et les contrôles du terminal
  Quand ces composants sont rendus
  Alors aucun élément "[data-action=\"clear-context\"]" n'est présent
  Et aucun libellé "Effacer le contexte" n'est affiché
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Clic sur le bouton Stop pendant qu'un bloc est en état de pause (attente join) | Prise en compte immédiate : la pause est rompue, le scénario est arrêté (`R-34`). |
| 2 | Fermeture ou rechargement de l'onglet du navigateur pendant le streaming | Le processus serveur poursuit ou s'interrompt selon son cycle normal sans crash ; le terminal se reconnecte à la réouverture de la page. |
| 3 | Flux de sortie volumineux ou rapide émis par le CLI | Rendu performant dans le composant terminal avec limitation de tampon mémoire navigateur pour éviter tout ralentissement de l'IHM. |
| 4 | Canvas d'un scénario enfant ouvert pendant un CallScenario du parent | Pas de pastilles / snapshot nested ; comportement idle ou foreign run (`REQ-040`). |
| 5 | Stop pendant un CallScenario actif | Arrêt du run racine et halt récursif de la sous-exécution (`R-34`). |
| 6 | Stop pendant un Command actif | Kill du process Command + arrêt scénario (`R-34`, `REQ-043`). |

### Ce qui n'est pas défini

- *2026-09-22* — Exportation manuelle du contenu du terminal vers un fichier texte local client : optionnel dans le navigateur, non imposé en v1.
- *2026-11-13* — Affichage des chunks CLI de l'enfant dans le terminal du parent : **retenu** (relay `chunkReceived` nested → racine) ; hors recovery canvas enfant (`REQ-040`).

### Critères d'acceptation

- [ ] `AC-UI-03-1` — Le terminal UI affiche en temps réel les sorties streamées du CLI / Command sans persistance sous `data/` (`CASE-UI-03-1`).
- [ ] `AC-UI-03-2` — Le bouton Stop interrompt immédiatement l'exécution en cours (aussi bien en run qu'en pause) (`CASE-UI-03-2`).
- [ ] `AC-UI-03-3` — L'IHM n'expose aucun bouton de reset manuel du contexte d'un agent (`CASE-UI-03-3`).
- [ ] `AC-UI-03-4` — Pendant un CallScenario, le canvas de l'enfant ne réhydrate pas l'état du sous-run ; Stop racine propage l'arrêt (`CASE-UI-03-10`, `REQ-040`).
- [ ] `AC-UI-03-5` — Pendant un CallScenario, les chunks CLI de l'enfant apparaissent dans le terminal du scénario racine via SSE (`CASE-ENG-03-8`, `REQ-024`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Vérifier la disponibilité de Stop en état de pause | Acceptée | Conforme au CDC §8 R-34 et ADR-004. |

---

## SPEC-UI-04 — Page Instructions et export local de la documentation

**Exigences :** `REQ-004`, `REQ-007`, `C-06`, `ADR-012`, `ADR-013`, `ADR-017`  
**Statut :** proposé  
**Version :** v1 (2026-11-08, ADR-017)  

### Règle

> L'interface propose une page **Instructions** en français permettant de lire la documentation d'utilisation embarquée.
> Depuis l'application principale, l'accès à cette documentation s'effectue via le menu de navigation vers la vue Instructions (`#/instructions`).
> Le corps des documents Markdown est rendu en HTML via un parseur **GFM** embarqué dans le bundle UI (`marked`, `ADR-017`) — titres, listes, tableaux, blocs de code inclus.
> La page expose un bouton **« Enregistrer dans le dossier local »** qui déclenche l'export HTTP de l'arborescence Markdown vers `.agents/docs/` (`SPEC-DATA-05`, `SPEC-SRV-02`).
> Un retour utilisateur clair indique le succès (chemin cible) ou l'échec (message en français).

### Portée

- Couvre le point d'entrée UI (entrée de navigation) vers la doc in-place.
- Couvre l'affichage des sections de documentation et la navigation interne de la page Instructions.
- Couvre le bouton d'export local et le feedback succès/échec.
- Ne couvre pas l'édition WYSIWYG de la documentation.
- Ne couvre pas le canvas ni le terminal → `SPEC-UI-02`, `SPEC-UI-03`.
- Ne couvre pas le contrat disque détaillé → `SPEC-DATA-05`.

### Scénarios nominaux

```gherkin
Scénario : Navigation vers la page Instructions
  Étant donné l'application principale affichée
  Quand l'utilisateur active l'accès à la documentation
  Alors l'application navigue vers la page Instructions (#/instructions)
  Et le contenu documentaire est lisible en français

Scénario : Export local depuis la page Instructions
  Étant donné la page Instructions ouverte
  Quand l'utilisateur clique sur "Enregistrer dans le dossier local"
  Alors l'export est demandé au serveur
  Et un message de succès affiche le chemin ".agents/docs" (ou équivalent AGENTS_DIR)
```

### Cas limites

| # | Situation | Comportement attendu |
|---|---|---|
| 1 | Échec réseau ou HTTP de l'export | Message d'erreur en français, sans crash de l'UI. |
| 2 | Source documentaire vide / indisponible | Affichage d'un état vide explicite ; le bouton d'export reste cohérent (échec ou no-op documenté). |

### Ce qui n'est pas défini

- *2026-11-08* — Impression PDF / thème clair dédié à la page doc : hors v1.

### Critères d'acceptation

- [ ] `AC-UI-04-1` — L'accès à la documentation depuis l'app navigue vers la page Instructions (`CASE-UI-04-1`).
- [ ] `AC-UI-04-2` — La page Instructions affiche les sections de documentation embarquée en français (`CASE-UI-04-2`).
- [ ] `AC-UI-04-3` — Le bouton « Enregistrer dans le dossier local » déclenche l'export et affiche un feedback avec le chemin `.agents/docs` en cas de succès (`CASE-UI-04-3`).

### Revue IA

| Remarque de l'IA | Décision | Motif |
|---|---|---|
| Navigation in-place plutôt que nouvel onglet | Acceptée | Décision produit : navigation fluide et unifiée dans l'application. |
