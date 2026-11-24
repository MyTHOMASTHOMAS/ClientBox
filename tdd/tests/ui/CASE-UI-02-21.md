# CASE-UI-02-21 — Zoom continu à la molette centré sur le curseur avec bornes [0.25, 2.0]

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-14`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, `ADR-021`  
**Modules cibles :** `UI-020` (`canvas-board.tsx`), `UI-044` (`use-canvas-interactions.hook.ts`), `UI-045` (`use-canvas-pointer-manager.hook.ts`), `UI-060` (`use-canvas-viewport.hook.ts`)  

---

## Ce que ce cas protège

Le Canvas Nodial doit offrir un confort d'exploration spatial complet via un **zoom/dézoom fluide à la molette de la souris** (`REQ-045`, `CR-002`, `CR-010`).

Ce cas garantit :
1. **Le centrage géométrique sur le curseur :** Lorsque l'utilisateur actionne la molette en un point écran $(x, y)$, le point virtuel du graphe situé exactement sous le curseur reste stationnaire à la même position apparente sur l'écran. La translation `pan` est instantanément compensée selon la formule affine :
   $$pan_{\text{nouveau}} = P_{\text{curseur}} - (P_{\text{curseur}} - pan_{\text{ancien}}) \times \frac{zoom_{\text{nouveau}}}{zoom_{\text{ancien}}}$$
2. **Le respect strict des bornes d'échelle (`[0.25, 2.0]`) :** Le facteur d'échelle est borné de manière continue entre **0.25x (25%)** et **2.0x (200%)**. Tout événement de dézoom tentant de descendre sous 0.25x est clampé à 0.25x. Tout événement de zoom tentant de dépasser 2.0x est clampé à 2.0x.
3. **La valeur initiale nominale :** À l'ouverture ou au chargement initial d'un scénario, le zoom démarre rigoureusement à **1.0x (100%)**.
4. **L'invariance des coordonnées du modèle (`R-49`) :** L'application de l'échelle modifie uniquement la matrice de transformation visuelle (attributs SVG `transform` et conteneur VDOM). Les coordonnées des nœuds (`node.position.x`, `node.position.y`) dans le document de scénario restent **strictement immuables**.
5. **La persistance de la navigation en run :** Le zoom reste entièrement utilisable pendant qu'un scénario s'exécute pour observer les détails ou la vue d'ensemble du graphe nodial.

---

## Cas

```gherkin
Scénario : Zoom avant centré sur le curseur
  Étant donné un canvas avec un zoom initial de 1.0 et un pan {x: 0, y: 0}
  Quand l'utilisateur actionne la molette vers l'avant (deltaY < 0) au point curseur écran (200, 100)
  Alors le facteur de zoom augmente (ex. 1.25)
  Et la translation pan est recalculée pour maintenir le point (200, 100) sous le curseur
  Et les positions de nœuds dans scenario.nodes restent rigoureusement identiques

Scénario : Clamp strict du facteur de zoom à la borne maximale 2.0x
  Étant donné un canvas ayant un zoom actuel de 1.9
  Quand l'utilisateur actionne fortement la molette vers l'avant pour zoomer
  Alors le facteur de zoom est borné à 2.0x exactement
  Et toute action de zoom avant supplémentaire maintient le zoom à 2.0x

Scénario : Clamp strict du facteur de zoom à la borne minimale 0.25x
  Étant donné un canvas ayant un zoom actuel de 0.3
  Quand l'utilisateur actionne fortement la molette vers l'arrière pour dézoomer
  Alors le facteur de zoom est borné à 0.25x exactement
  Et toute action de dézoom arrière supplémentaire maintient le zoom à 0.25x

Scénario : Zoom disponible pendant un scénario en cours d'exécution
  Étant donné un scénario avec isRunning=true
  Quand l'utilisateur utilise la molette pour zoomer sur un bloc actif
  Alors le zoom et la compensation pan sont appliqués normalement
  Et aucune interaction d'édition interdite n'est déverrouillée
```

---

## Données

| État | Paramètres d'entrée | Résultat attendu |
|---|---|---|
| Viewport initial | `pan: {x: 0, y: 0}`, `zoom: 1.0` | État nominal 100% |
| Scroll zoom avant | Curseur `(200, 100)`, $\Delta \text{factor} = 1.2$ | `zoom: 1.2`, `pan: {x: -40, y: -20}` |
| Tentative dépassement max | `zoom: 1.9` + 5 crans avant | `zoom: 2.0` (clampé) |
| Tentative dépassement min | `zoom: 0.3` + 5 crans arrière | `zoom: 0.25` (clampé) |
| Position nœud modèle | `node1.position = {x: 150, y: 150}` | Inchangée (`R-49`) |

---

## Résultat attendu, calculé à la main

Pour un curseur à $P = (200, 100)$, avec $pan_0 = (0, 0)$ et un zoom passant de $1.0$ à $1.2$ :
$$pan_1.x = 200 - (200 - 0) \times \frac{1.2}{1.0} = 200 - 240 = -40$$
$$pan_1.y = 100 - (100 - 0) \times \frac{1.2}{1.0} = 100 - 120 = -20$$

Le point modèle correspondant au curseur était :
$$X_{\text{modèle}} = \frac{200 - 0}{1.0} = 200$$
Après zoom et translation :
$$X_{\text{écran}} = X_{\text{modèle}} \times 1.2 + pan_1.x = 200 \times 1.2 - 40 = 240 - 40 = 200$$
Le point virtuel reste ainsi **parfaitement immobile** sous la souris.

---

## Ce que ce cas ne vérifie pas

- Le déplacement libre par clic-glissé fond (Pan) → `CASE-UI-02-20` ;
- L'isomorphisme de projection des coordonnées pour le câblage et le drag de bloc sous viewport translaté et zoomé → `CASE-UI-02-22`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_21_canvas_wheel_zoom_centered_at_cursor`  
**Fichier :** `tests/units/ui/CASE-UI-02-21.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'ajustement du `zoom` lors des événements molette `wheel`.
- [ ] Le test vérifie la compensation mathématique exacte de `pan` pour centrer le zoom au curseur.
- [ ] Le test vérifie le clamp strict à `0.25x` en zoom arrière.
- [ ] Le test vérifie le clamp strict à `2.0x` en zoom avant.
- [ ] Le test confirme que les positions des blocs dans le modèle restent inchangées.
- [ ] Le nom du test contient `CASE_UI_02_21`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** CR-010 / CDC v2.2.
