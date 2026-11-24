# CASE-UI-02-1 — Composition nodale du canvas : création, déplacement, inspection des paramètres et câblage orienté des 4 types de blocs

**Spécification :** `SPEC-UI-02`
**Critère d'acceptation :** `AC-UI-02-1`
**Type :** acceptation
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-004`, `ADR-013`, ADR-015  

## Ce que ce cas protège

Le canvas d'orchestration nodale (style N8N) est le cœur visuel de ClientsBox (`REQ-014`, `REQ-035`, `REQ-107`). Orchestré par le hook d'état `use-canvas-state.hook.ts` (`UI-008`), développé sous forme de composants réactifs Preact TSX (`UI-020 canvas-board.tsx`, `UI-021 canvas-node.tsx`, `UI-022 canvas-cable.tsx`, `UI-024 inspector-panel.tsx`) et stylisé avec Tailwind CSS v4 (`ADR-013`), il doit permettre à l'utilisateur de manipuler interactivement les 4 types de blocs (Start, Run, If, ClearContext), de les positionner dans l'espace, d'éditer leurs paramètres statiques via un panneau d'inspection latéral (`R-08`, `R-09`), et de relier les ports de sortie aux ports d'entrée par des liaisons orientées (câbles) avec gestion des clés d'entrées (`R-13`, `R-43`). Si la composition nodale ou le système de câblage échouait, l'utilisateur ne pourrait pas concevoir ni éditer graphiquement ses graphes de scénarios.

## Cas

```gherkin
Étant donné un canvas de scénario vierge ouvert dans l'interface web
Quand l'utilisateur glisse-dépose les 4 types de blocs (Start, Run, If, ClearContext) sur la surface
Alors les 4 nœuds sont instanciés avec leurs connecteurs d'entrée/sortie respectifs
Et l'utilisateur peut déplacer librement les nœuds sur la grille du canvas

Étant donné un nœud sélectionné sur le canvas
Quand l'utilisateur ouvre le panneau latéral d'inspection
Alors les paramètres statiques spécifiques du bloc sont affichés et éditables
  | type de bloc  | paramètres éditables                                    |
  | Start         | label (identifiant d'affichage, aucun paramètre moteur) |
  | Run           | agentId, promptId, exitId                               |
  | If            | script conditionnel (.agents/data/if/<nom>.js)          |
  | ClearContext  | agentId cible à réinitialiser                           |
Et pour un bloc Run, les champs d'entrée "inspector-agent", "inspector-prompt" et "inspector-exit" avec le libellé "Condition de sortie" sont rendus dans le composant d'inspection
Et l'effacement d'un champ optionnel (agentId, promptId, exitId, ifScriptId) purge la clé du nœud persisté sans stocker de chaîne vide résiduelle

Étant donné deux blocs disposés sur le canvas (ex. Start et Run)
Quand l'utilisateur tire un câble depuis le port de sortie de Start vers le port d'entrée de Run
Alors une liaison orientée est créée à l'écran
Et une clé d'entrée ("key") unique est automatiquement assignée sur le port de Run
```

## Données

| Élément | Valeur |
|---|---:|
| Types de blocs supportés | `Start`, `Run`, `If`, `ClearContext` (4 types exacts) |
| Interaction canvas | Glisser-déposer, sélection, déplacement, zoom/pan |
| Câblage | Liaison orientée (port de sortie $\to$ port d'entrée) |
| Gestion des clés d'entrée | Clés par défaut (`"0"`, `"1"`, ...) ou personnalisées (`"doc"`, `"spec"`) sans collision sur un même nœud cible |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Types de blocs instanciables | `4 / 4` types | Start, Run, If, ClearContext (REQ-014, REQ-107) |
| Disponibilité du panneau d'inspection | `OUI` | Rendu des paramètres selon le type de bloc sélectionné (R-08, R-09) |
| Câblage orienté interactif | `OUI` | Liaison visuelle persistée dans la structure du scénario |
| Gestion des clés d'entrée (`keys`) | Unicité locale par bloc cible | Règle R-13 / R-43 (rejet des doublons de clé) |

## Ce que ce cas ne vérifie pas

- L'unicité stricte du bloc Start → `CASE-UI-02-2` ;
- La différenciation graphique des deux branches If → `CASE-UI-02-3` ;
- L'algorithme d'exécution moteur Join/Power → `SPEC-ENG-02`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_02_1_canvas_nodal_composition_and_oriented_wiring`
**Fichier :** `tests/tests-unitaires/ui/case-ui-02-1.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie l'instanciation des 4 types de blocs sur le canvas.
- [ ] Le test vérifie le déplacement libre et le positionnement des nœuds sur la grille du canvas.
- [ ] Le test vérifie la mise à jour des paramètres dans le panneau d'inspection pour chaque type de bloc.
- [ ] Le test valide la création d'une liaison orientée entre deux ports compatibles.
- [ ] Le test vérifie l'assignation et l'unicité des clés d'entrées sur le bloc cible.
- [ ] Le test échoue si un bloc non supporté est accepté ou si le câblage corrompt les clés.
- [ ] Le nom du test contient `CASE_UI_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
