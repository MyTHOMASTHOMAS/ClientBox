# CASE-UI-02-20 — Déplacement de la caméra (Pan) sur le canvas par clic-glissé sur le fond vide

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-13`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, `ADR-021`  
**Modules cibles :** `UI-020` (`canvas-board.tsx`), `UI-044` (`use-canvas-interactions.hook.ts`), `UI-045` (`use-canvas-pointer-manager.hook.ts`), `UI-060` (`use-canvas-viewport.hook.ts`)  

---

## Ce que ce cas protège

Le Canvas Nodial doit permettre à l'utilisateur de se déplacer librement sur le plan de travail ("Pan") en effectuant un **clic gauche maintenu sur le fond vide** du canvas (en dehors de tout bloc, câble ou port) (`REQ-045`, `R-49`, `CR-002`).

Ce cas garantit :
1. **L'agrippement naturel du fond :** Au survol du fond vide, le curseur affiche le style `cursor: grab`. Dès l'enfoncement du bouton gauche (`pointerdown`), le curseur passe à `cursor: grabbing` et la translation `pan: { x, y }` suit exactement le déplacement du pointeur.
2. **L'invariance stricte des coordonnées du scénario (`R-49`) :** La translation déplace uniquement la matrice d'affichage de la caméra (le calque VDOM et le calque SVG). Les coordonnées absolues des blocs (`node.position.x`, `node.position.y`) dans le document de scénario restent **parfaitement immuables**.
3. **L'absence d'interférence avec les nœuds et les ports :** Si le clic initial s'effectue sur un bloc (`[data-node-id]`) ou sur un port (`[data-port-type]`), l'interaction de pan est inhibée pour privilégier la sélection/drag du nœud ou le tirage de câble.
4. **La disponibilité du Pan pendant un run actif :** Contrairement à l'édition du graphe qui est bloquée pendant un run (`AC-UI-02-9`), la navigation par Pan reste autorisée pour inspecter visuellement les blocs distants.

---

## Cas

```gherkin
Scénario : Déplacement de caméra nominal sur fond vide
  Étant donné un canvas ouvert avec un viewport initial pan={x: 0, y: 0}
  Quand l'utilisateur enfonce le bouton gauche sur le fond vide au point écran (150, 150)
  Et déplace la souris vers le point écran (250, 200)
  Alors la translation pan du viewport devient exactement {x: 100, y: 50}
  Et le calque graphique SVG/VDOM applique la transformation CSS correspondante
  Et les positions de tous les blocs dans le modèle de scénario demeurent inchangées

Scénario : Curseur visuel d'agrippement
  Étant donné le canvas au repos
  Quand le curseur survole une zone libre sans entité
  Alors le conteneur de fond expose la classe ou le style de curseur "grab"
  Quand le clic gauche est maintenu en déplacement
  Alors le style de curseur devient "grabbing"
  Quand le bouton est relâché
  Alors le style de curseur revient à "grab"

Scénario : Clic sur un nœud n'activant pas le Pan
  Étant donné un bloc positionné à {x: 100, y: 100} sur le canvas
  Quand l'utilisateur clique sur ce bloc pour le déplacer
  Alors la translation de caméra pan reste inchangée à {x: 0, y: 0}
  Et le déplacement déplace le bloc individuel
```

---

## Données

| État | Coordonnées de test | Résultat attendu |
|---|---|---|
| Viewport initial | `pan: {x: 0, y: 0}`, `zoom: 1.0` | État nominal centré |
| Drag start | `clientX: 100, clientY: 100` sur fond | `isPanning: true`, curseur `grabbing` |
| Drag move | `clientX: 180, clientY: 140` | `pan: {x: 80, y: 40}` |
| Positions nœuds | `node1.position = {x: 200, y: 300}` | `node1.position = {x: 200, y: 300}` (inchangé) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---|---|
| Delta de translation | $\Delta x = 80$, $\Delta y = 40$ | $\text{client}_{\text{actuel}} - \text{client}_{\text{start}}$ |
| Coordonnées nœud modèle | Constantes | `R-49` (invariance) |
| Curseur CSS | `grab` / `grabbing` | Confort UX agrippement |

---

## Ce que ce cas ne vérifie pas

- L'action de zoom à la molette → `CASE-UI-02-21` ;
- Le recalcul géométrique de câblage sous zoom et pan → `CASE-UI-02-22`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_20_canvas_background_pan_interaction`  
**Fichier :** `tests/units/ui/CASE-UI-02-20.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie la mise à jour de `pan` lors du pointerdown/move sur fond vide.
- [ ] Le test confirme que les positions des nœuds dans `scenario.nodes` restent identiques.
- [ ] Le test vérifie les états de curseur `grab` et `grabbing`.
- [ ] Le test vérifie que le clic sur un nœud ne déclenche pas le pan de caméra.
- [ ] Le nom du test contient `CASE_UI_02_20`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-010 / CDC v2.2.
