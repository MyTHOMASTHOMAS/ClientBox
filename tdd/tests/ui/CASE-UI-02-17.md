# CASE-UI-02-17 — Suppression interactive d'un bloc sélectionné (inspecteur et clavier)

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-10`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, `ADR-015`  
**Modules cibles :** `UI-008` (`use-canvas-state.hook.ts` / `canvas-mutations.helper.ts`), `UI-024` (`inspector-panel.tsx`), `UI-031` (`scenario-studio-page.tsx`)

---

## Ce que ce cas protège

La composition nodale permet d'ajouter des blocs (`start`, `run`, `if`, `clearContext`) et de les relier par des liaisons orientées. Cependant, sans geste explicite de suppression d'un bloc dans l'interface graphique, l'utilisateur est contraint de modifier manuellement le fichier JSON sur le disque (`REQ-014`).

Ce cas garantit, dans l'environnement Preact / SVG (`UI-024 inspector-panel.tsx`, `UI-031 scenario-studio-page.tsx`, `UI-008 canvas-mutations.helper.ts` / `removeBlock`) :

1. **Bouton de suppression dans l'inspecteur :** Lorsqu'un nœud est sélectionné, le panneau inspecteur contextuel affiche un bouton explicite « Supprimer ce bloc » (`data-action="delete-node"`).
2. **Nettoyage en cascade des liaisons :** Le clic sur ce bouton retire le bloc et supprime automatiquement **toutes les connexions entrantes et sortantes** associées (via `removeBlock`), en renumérotant les clés numériques restantes sur les blocs cibles (`R-43`).
3. **Fermeture de l'inspecteur :** Après suppression du nœud, l'inspecteur se referme immédiatement (la sélection du nœud est annulée).
4. **Suppression via raccourci clavier :** L'appui sur la touche <kbd>Suppr</kbd> ou <kbd>Backspace</kbd> alors qu'un bloc est sélectionné (et hors focus d'un champ de saisie `input` / `textarea`) déclenche la suppression du bloc.
5. **Préservation de la saisie texte :** Lorsque le focus se trouve dans un champ texte de l'inspecteur, l'appui sur <kbd>Suppr</kbd> ou <kbd>Backspace</kbd> n'efface que le texte et ne supprime pas le bloc.
6. **Réinitialisation de la contrainte Start :** Si le nœud supprimé est le bloc `start`, la contrainte d'unicité (`REQ-015`, `R-19`) est immédiatement libérée et le bouton d'ajout de Start (`data-action="add-start"`) redevient actif.
7. **Respect du verrou de run :** Pendant un scénario actif (`isRunning === true` ou `isGraphLocked === true`), le bouton de suppression est désactivé ou masqué et les raccourcis clavier de suppression sont ignorés (`AC-UI-02-9`).

---

## Cas

```gherkin
Scénario : Présence du bouton Supprimer ce bloc dans l'inspecteur latéral
  Étant donné un canvas contenant un bloc Run sélectionné
  Quand le panneau inspecteur est affiché
  Alors un bouton avec data-action="delete-node" et le libellé "Supprimer ce bloc" est visible

Scénario : Clic sur Supprimer ce bloc retire le nœud et ses câbles connectés
  Étant donné un canvas contenant un bloc Start relié à un bloc Run, lui-même relié à un bloc If
  Et le bloc Run sélectionné dans l'inspecteur
  Quand l'utilisateur clique sur le bouton data-action="delete-node"
  Alors le bloc Run est absent du document canvas
  Et les deux câbles (Start -> Run et Run -> If) sont supprimés
  Et le panneau inspecteur est fermé (selectedNodeId est null)

Scénario : Suppression du bloc Start réautorise l'insertion d'un nouveau bloc Start
  Étant donné un canvas contenant un bloc Start sélectionné
  Quand l'utilisateur clique sur Supprimer ce bloc
  Alors le bloc Start est retiré
  Et l'ajout d'un nouveau bloc Start via addBlock est autorisé (ok=true)

Scénario : Suppression d'un nœud sélectionné via le raccourci clavier Suppr / Backspace
  Étant donné un bloc sélectionné sur le canvas hors d'un champ de saisie actif
  Quand l'utilisateur appuie sur la touche Delete ou Backspace
  Alors le bloc sélectionné et ses câbles sont retirés du canvas
  Et la sélection est réinitialisée

Scénario : La touche Suppr dans un input texte ne supprime pas le bloc
  Étant donné un champ de formulaire de l'inspecteur ayant le focus
  Quand l'utilisateur appuie sur la touche Delete ou Backspace
  Alors le bloc demeure présent sur le canvas

Scénario : Verrouillage de la suppression pendant un run
  Étant donné un scénario en cours d'exécution (isGraphLocked=true)
  Quand un bloc est inspecté
  Alors le bouton data-action="delete-node" est désactivé (disabled=true)
  Et l'appui sur Delete / Backspace ne produit aucune suppression
```

---

## Données

| Élément | Valeur |
|---|---|
| Sélecteur du bouton | `[data-action="delete-node"]` |
| Libellé du bouton | `Supprimer ce bloc` |
| Variantes d'action | Clic souris sur bouton inspecteur OU touches <kbd>Delete</kbd> / <kbd>Backspace</kbd> |
| Fonction modèle | `removeBlock(doc, nodeId)` (`src/ui/hooks/canvas/canvas-mutations.helper.ts`) |
| Composants cibles | `InspectorPanel` (`inspector-panel.tsx`), `ScenarioStudioPage` (`scenario-studio-page.tsx`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre de nœuds après suppression d'1 bloc | `N - 1` | Retrait strict du nœud ciblé |
| Connexions restantes après suppression d'un bloc intermédiaire relié en entrée et sortie | `Total - 2` | `removeBlock` filtre les câbles où `sourceNodeId === id \|\| targetNodeId === id` |
| `selectedNodeId` après suppression | `null` | Fermeture automatique de l'inspecteur |
| Bloc Start supprimé : `canAddStart` | `true` | Unicité Start libérée |
| Tentative de suppression pendant run actif | Graphe inchangé | Verrou d'interaction `isGraphLocked` respecté |

---

## Ce que ce cas ne vérifie pas

- La suppression unitaire d'un câble seul sans supprimer de bloc → `CASE-UI-02-14` ;
- Le drag-and-drop de déplacement des nœuds → `CASE-UI-02-8` ;
- L'algorithme pur de renumérotation des clés d'entrées → `CASE-DATA-03-2` ;
- Le streaming live et les contrôles du terminal d'exécution → `CASE-UI-03-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_17_node_deletion_inspector_and_keyboard`  
**Fichier :** `tests/units/ui/CASE-UI-02-17.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie la présence du bouton `data-action="delete-node"` dans `InspectorPanel`.
- [ ] Le test vérifie que le clic sur ce bouton déclenche le callback `onDeleteNode`.
- [ ] Le test vérifie qu'en lecture seule / run actif (`isReadOnly=true`), le bouton est désactivé.
- [ ] Le test vérifie que `removeBlock` nettoie en cascade tous les câbles connectés au nœud.
- [ ] Le test vérifie que la suppression d'un bloc `start` permet d'en réinsérer un nouveau.
- [ ] Le test vérifie que la suppression referme l'inspecteur (`selectedNodeId = null`).

