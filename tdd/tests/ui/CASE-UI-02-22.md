# CASE-UI-02-22 — Isomorphisme de projection `clientToCanvas` et précision du drag et câblage sous Pan & Zoom

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-15`  
**Type :** acceptation / composant  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-013`, `ADR-021`  
**Modules cibles :** `UI-020` (`canvas-board.tsx`), `UI-044` (`use-canvas-interactions.hook.ts`), `UI-045` (`use-canvas-pointer-manager.hook.ts`), `UI-060` (`use-canvas-viewport.hook.ts`)  

---

## Ce que ce cas protège

L'introduction de la translation de caméra (`pan`) et du facteur d'échelle dynamique (`zoom`) ne doit jamais dégrader la fidélité géométrique des interactions directes d'édition nodale (`REQ-045`, `CR-002`, `CR-010`, `ADR-021`).

Ce cas garantit :
1. **L'exactitude mathématique de la projection `clientToCanvas` :** Toute coordonnée pointeur issue du navigateur (`clientX`, `clientY`) convertie dans le repère logique du canvas scénario applique rigoureusement la transformation affine inverse :
   $$\text{canvasX} = \frac{\text{clientX} - \text{rect.left} - pan.x}{zoom}$$
   $$\text{canvasY} = \frac{\text{clientY} - \text{rect.top} - pan.y}{zoom}$$
2. **Le déplacement de bloc sans dérive ("zero drift") :** Lors du drag-and-drop d'un bloc sous un niveau de zoom quelconque (ex. $0.5\times$ ou $1.75\times$), le delta appliqué à la position du bloc dans l'espace canvas est rigoureusement normalisé :
   $$\Delta \text{canvas} = \frac{\Delta \text{client}}{zoom}$$
   Le bloc reste parfaitement ancré sous le pointeur de la souris sans accélération ni retard perceptuel.
3. **La précision du tirage et de l'accroche de câble :**
   - La prévisualisation du câble temporaire (`previewEdge`) relie le port source à la position projetée exacte de la souris.
   - La détection de survol et d'accroche (hit-testing) sur les ports cibles fonctionne au pixel près quel que soit l'état de translation et de zoom.
4. **L'intégrité de la persistance :** Les nouvelles connexions et les nouvelles positions de blocs calculées sous viewport non nul sont enregistrées avec leurs coordonnées logiques authentiques dans le modèle de scénario.

---

## Cas

```gherkin
Scénario : Projection d'un point client vers le canvas sous zoom et translation
  Étant donné un canvas positionné à rect.left=50, rect.top=50 avec pan={x: 100, y: 50} et zoom=1.5
  Quand un événement pointeur survient aux coordonnées écran (275, 200)
  Alors la fonction clientToCanvas retourne exactement les coordonnées logiques {x: 83.33, y: 66.67}

Scénario : Déplacement d'un bloc sans dérive sous fort zoom (1.5x)
  Étant donné un canvas avec zoom=1.5 et pan={x: 80, y: 40}
  Et un bloc situé en position initiale {x: 100, y: 100}
  Quand l'utilisateur glisse le bloc avec un déplacement écran de (150px, 90px)
  Alors la position du bloc dans le modèle augmente exactement de (100px, 60px) pour devenir {x: 200, y: 160}

Scénario : Déplacement d'un bloc sans dérive sous dézoom (0.5x)
  Étant donné un canvas avec zoom=0.5 et pan={x: -20, y: -10}
  Et un bloc situé en position initiale {x: 100, y: 100}
  Quand l'utilisateur glisse le bloc avec un déplacement écran de (50px, 30px)
  Alors la position du bloc dans le modèle augmente exactement de (100px, 60px) pour devenir {x: 200, y: 160}

Scénario : Câblage interactif précis sous viewport modifié
  Étant donné deux blocs reliables sur un canvas avec zoom=1.25 et pan={x: 200, y: 100}
  Quand l'utilisateur clique sur le port de sortie du premier bloc
  Et déplace le pointeur au-dessus du port d'entrée du second bloc
  Alors la prévisualisation du câble suit fidèlement le curseur
  Et le relâchement valide la connexion avec succès entre les deux blocs
```

---

## Données

| Contexte | Paramètres Viewport | Coordonnées Client | Coordonnées Canvas Attendues |
|---|---|---|---|
| Nominal (100%, 0,0) | `pan: {x: 0, y: 0}`, `zoom: 1.0` | `(100, 100)` (rect 0,0) | `(100, 100)` |
| Zoomé (1.5x, pan non nul) | `pan: {x: 100, y: 50}`, `zoom: 1.5` | `(325, 275)` (rect 50,50) | `(116.67, 116.67)` |
| Dézoomé (0.5x, pan négatif) | `pan: {x: -50, y: -20}`, `zoom: 0.5` | `(150, 80)` (rect 0,0) | `(400, 200)` |
| Drag Delta (zoom 2.0x) | `zoom: 2.0` | $\Delta \text{client} = (100, 40)$ | $\Delta \text{node} = (50, 20)$ |
| Drag Delta (zoom 0.25x) | `zoom: 0.25` | $\Delta \text{client} = (25, 10)$ | $\Delta \text{node} = (100, 40)$ |

---

## Résultat attendu, calculé à la main

Pour `rect.left = 0`, `rect.top = 0`, `pan = { x: -50, y: -20 }`, `zoom = 0.5`, et un curseur client à `(150, 80)` :
$$X_{\text{canvas}} = \frac{150 - (-50)}{0.5} = \frac{200}{0.5} = 400$$
$$Y_{\text{canvas}} = \frac{80 - (-20)}{0.5} = \frac{100}{0.5} = 200$$

Pour le déplacement d'un nœud à $zoom = 0.5$, si la souris bouge de $\Delta clientX = 50$, le nœud doit se déplacer de :
$$\Delta X_{\text{node}} = \frac{50}{0.5} = 100$$
Le modèle reflète alors exactement le déplacement sous-jacent.

---

## Ce que ce cas ne vérifie pas

- L'agrippement et la translation par clic-glissé sur fond vide → `CASE-UI-02-20` ;
- Le centrage du zoom à la molette sur le curseur et le clamp `[0.25, 2.0]` → `CASE-UI-02-21`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_22_canvas_matrix_projection_client_to_canvas_under_viewport`  
**Fichier :** `tests/units/ui/CASE-UI-02-22.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie la formule mathématique inverse de `clientToCanvas` avec diverses combinaisons de `pan` et `zoom`.
- [ ] Le test vérifie la mise à jour de la position d'un nœud lors du drag sous zoom > 1.
- [ ] Le test vérifie la mise à jour de la position d'un nœud lors du drag sous zoom < 1.
- [ ] Le test valide la création d'une liaison de câble sous viewport translaté et zoomé.
- [ ] Le nom du test contient `CASE_UI_02_22`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-010 / CDC v2.2.
