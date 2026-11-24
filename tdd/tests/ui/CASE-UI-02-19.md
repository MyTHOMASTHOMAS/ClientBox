# CASE-UI-02-19 — Bloc Command : toolbar canvas et inspecteur `commandLine`

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-12`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, `ADR-019`  
**Modules cibles :** `UI-023` (toolbar), `UI-024` (inspecteur), `UI-008` (canvas state), `UI-031` (studio)  

---

## Ce que ce cas protège

Le canvas Studio doit permettre d'ajouter un bloc **Command** depuis la barre d'outils (`data-action="add-command"`) et de saisir son paramètre statique **`commandLine`** dans le panneau d'inspection (`REQ-042`, `REQ-043`, `R-47`).

Pour éviter toute confusion entre un bloc agent et une commande système, le panneau d'inspection d'un bloc Command **ne doit afficher aucun champ agent, prompt ou exit** : uniquement la saisie de la commande shell et les ports power multi-câbles (1..N in / 0..N out).

De plus, pendant qu'un run est actif ou en pause, l'action d'ajout toolbar et l'édition de `commandLine` doivent respecter le verrouillage front global (`AC-UI-02-9`).

---

## Cas

```gherkin
Scénario : Ajout d'un bloc Command depuis la toolbar
  Étant donné le Scenario Studio ouvert sur un scénario
  Quand l'utilisateur clique sur l'action d'ajout Command (`data-action="add-command"`)
  Alors un nœud de type "command" apparaît sur le canvas
  Et le nœud expose des ports d'entrée et de sortie power configurables

Scénario : Inspecteur dédié au bloc Command
  Étant donné un bloc Command sélectionné sur le canvas
  Quand le panneau d'inspection est affiché
  Alors un champ texte pour "commandLine" est accessible en saisie libre
  Et aucun sélecteur d'agent (agentId), de prompt (promptId) ou d'exit (exitId) n'est affiché

Scénario : Édition et mise à jour du modèle canvas
  Étant donné un bloc Command sélectionné avec commandLine initialement vide
  Quand l'utilisateur saisit "npm run build" dans le champ inspecteur
  Alors le modèle de nœud sous-jacent est mis à jour avec commandLine="npm run build"

Scénario : Verrouillage pendant un run actif
  Étant donné un scénario en cours d'exécution (busy=true ou en pause join)
  Quand l'utilisateur observe la toolbar et l'inspecteur
  Alors le bouton d'ajout Command est désactivé
  Et le champ commandLine dans l'inspecteur est en lecture seule ou désactivé
```

---

## Données

| Élément | Valeur |
|---|---|
| Type nœud | `command` |
| Action toolbar | `[data-action="add-command"]` |
| Champ inspecteur | `commandLine` (input texte) |
| Champs proscrits | `agentId`, `promptId`, `exitId`, `targetScenarioId` |
| Verrouillage run | Désactivé si `isBusy === true` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Action toolbar | Ajout nœud type `command` | AC-UI-02-12 / REQ-042 |
| Champ inspecteur | Présence champ `commandLine` | AC-UI-02-12 / REQ-043 |
| Champs agent/prompt masqués | Absents du DOM inspecteur | R-47 |
| Respect verrou run | Disabled / ReadOnly pendant run | AC-UI-02-9 |

---

## Ce que ce cas ne vérifie pas

- L'exécution shell OS et le retour power 1 → `CASE-ENG-03-9` ;
- Le streaming dans le composant terminal → `CASE-UI-03-1` ;
- La persistance et validation JSON de `commandLine` → `CASE-DATA-03-8`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_19_command_block_toolbar_add_and_inspector_command_line`  
**Fichier :** `tests/units/ui/CASE-UI-02-19.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'action d'ajout `add-command` et le type de nœud produit.
- [ ] Le test vérifie la présence du champ `commandLine` dans l'inspecteur.
- [ ] Le test confirme l'absence des champs `agentId`, `promptId` et `exitId`.
- [ ] Le test vérifie le verrouillage en cours d'exécution.
- [ ] Le nom du test contient `CASE_UI_02_19`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-008 / CDC v2.1.
