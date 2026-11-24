# Analyse d'impact — CR-010 (Navigation Spatiale Pan & Zoom sur le Canvas Studio)

**Demande du client :** Dans le Canvas, offrir la possibilité de se déplacer (pan) sur le scénario via un clic gauche sur le fond vide (« agripper » le fond) et de zoomer / dézoomer avec la molette de la souris.  
**Reçue le :** 16/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Entretien source :** [`tdd/docs/cr/CR-002.md`](../cr/CR-002.md) (Questions CR-02/Q06 à Q08)  
**Branche Git dédiée :** `feat/cli-exec-scene`  
**Cible documentaire :** **CDC v2.2** (amendement versionné étendant [`cahier-des-charges-v2.1.md`](../cdc/cahier-des-charges-v2.1.md))  

---

> **Règle fondamentale TDD :**  
> Interdiction formelle de modifier le code de production avant la ratification de cette analyse, l’amendement du CDC **v2.2**, la mise à jour des spécifications / cas de test, et la vérification des tests unitaires rouges.  
> La chaîne descend impérativement : CDC $\rightarrow$ ADR $\rightarrow$ Specs $\rightarrow$ Signatures & Architecture $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.

---

## 1. Ce que le client demande, reformulé

Le Canvas Nodial de ClientsBox est actuellement affiché avec un repère statique d'origine `(0, 0)` et une échelle fixe `1.0` (100 %).  
Sur les scénarios denses ou comportant de nombreux nœuds ramifiés (comme notre scénario maître `test-suite-master` à 8 blocs), l'utilisateur se trouve contraint par les dimensions de la fenêtre du navigateur sans possibilité de naviguer hors-champ.

Le client demande l'intégration d'un système fluide de navigation spatiale dans le Canvas :
1. **Déplacement libre ("Pan") par agrippement direct du fond :**
   - Un clic gauche maintenu sur n'importe quelle surface libre du canvas (hors blocs, câbles et ports) permet d'« agripper » le plan de travail et de translater la vue en temps réel.
   - Le curseur de la souris passe dynamiquement à `cursor: grab` au survol de la zone vide, et à `cursor: grabbing` pendant la translation active.
   - Les coordonnées intrinsèques des blocs (`node.position.x`, `node.position.y`) restent **strictement inchangées** : seule la matrice d'affichage de la caméra (`pan.x`, `pan.y`) est modifiée.
2. **Zoom / Dézoom centré sur le curseur ("Zoom") :**
   - L'action sur la molette de la souris (`wheel`) ajuste l'échelle d'affichage de manière continue.
   - Le zoom est géométriquement centré sur la position instantanée du curseur (le point sous la souris reste stationnaire à l'écran).
   - L'échelle de zoom est contrainte dans une plage ergonomique de **0.25x (25%) à 2.0x (200%)**, avec **1.0x (100%)** comme valeur nominale initiale.
3. **Isomorphisme et précision absolue des interactions :**
   - La fonction de projection `clientToCanvas(e)` doit impérativement intégrer la translation `pan` et le facteur d'échelle `zoom`.
   - Ainsi, la création de liens (câblage depuis un port de sortie vers un port d'entrée) et le déplacement individuel des blocs restent d'une précision au pixel près, quel que soit le niveau d'agrandissement ou de déplacement de la caméra.

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision actée (CR-002) |
|---|---|---|
| 1 | Comment déclencher le déplacement (Pan) sur le canvas ? | **Clic gauche maintenu sur le fond vide** (hors blocs et ports), avec effet d'agrippement visuel (`grab` / `grabbing`). |
| 2 | Quel mécanisme pour zoomer et dézoomer ? | **Molette de la souris (`wheel`)**, centrée sur le curseur. |
| 3 | Quelles bornes d'échelle de zoom appliquer ? | Plage de **0.25x (25%) à 2.0x (200%)**, avec défaut à 1.0x (100%). |
| 4 | Le déplacement modifie-t-il la position persistée des blocs ? | **Non.** Les positions des blocs dans le scénario JSON restent intactes ; seul le viewport caméra est translaté. |
| 5 | Le câblage et le drag de bloc restent-ils opérationnels sous zoom ? | **Oui.** Recalcul matriciel rigoureux dans la projection événementielle `clientToCanvas`. |

---

## 3. Impact — Cahier des charges (**CDC v2.1 → v2.2**)

| Exigence | Impact | Action (v2.2) |
|---|---|---|
| Section 1.2 — Objectifs opérationnels | **Complétée** | Ergonomie avancée du Studio Nodial : navigation bidimensionnelle et manipulation à toute échelle. |
| **REQ-014** (Éditeur graphique canvas) | **Complétée** | Le conteneur du canvas prend en charge le déplacement (Pan) et le zoom continu. |
| **REQ-045** *(nouvelle)* | **Ajoutée** | **Navigation spatiale Canvas (Pan & Zoom)** : déplacement par clic-glissé sur le fond vide (`grab`/`grabbing`), zoom molette centré au curseur borné entre 0.25x et 2.0x, intégrité du câblage et du drag de blocs. |
| **R-49** *(nouvelle)* | **Ajoutée** | **Règle d'invariance des coordonnées du scénario** : les translations de caméra et le facteur d'échelle de la vue n'altèrent pas les coordonnées de persistance `position` des nœuds du scénario. |

---

## 4. Impact — Spécifications Fonctionnelles

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| **`SPEC-UI-02`** (Canvas Nodial & manipulation VDOM) | **Modifiée** | - Ajout du modèle d'état Viewport : `{ pan: { x: number, y: number }, zoom: number }`.<br/>- Ajout du critère `AC-UI-02-13` : Clic-glissé sur le fond vide mettant à jour la translation `pan` avec curseur `grab`/`grabbing`, sans altérer `node.position`.<br/>- Ajout du critère `AC-UI-02-14` : Zoom à la molette centré sur la position de la souris, borné entre 0.25x et 2.0x.<br/>- Ajout du critère `AC-UI-02-15` : Câblage interactif et glisser-déposer de nœuds géométriquement isomorphes quel que soit le zoom et le pan actif (`clientToCanvas`). |
| **`SPEC-UI-01`** (Navigation & Layout) | **Inchangée** | Le canvas reste confiné dans sa zone de travail principale sans déborder sur la sidebar ou l'inspecteur. |
| **`SPEC-DATA-03`** (Persistance scénario) | **Inchangée** | Les fichiers `.agents/data/scenarios/*.json` conservent la même structure (aucune donnée de caméra n'est requise dans le modèle de données en V1). |

---

## 5. Impact — Conception & Architecture

| Artefact | Impact | Ce qui change |
|---|---|---|
| **`ADR-021`** *(nouveau)* | **Créé** | Formalisation de l'architecture du Viewport Canvas : découplage de la caméra, projection matricielle affine inverse `clientToCanvas`, et découplage entre les calques SVG/HTML. |
| Hook `use-canvas-viewport.hook.ts` | **Créé** | Encapsulation de l'état `{ pan, zoom }`, des bornes de clamp `[0.25, 2.0]` et du calcul de zoom centré sur un point `(cx, cy)`. |
| `CanvasPointerManager` | **Modifié** | Intégration de la gestion du pan (détection du clic sur fond vide dans `onDown`, translation dans `onMove`, relâchement dans `onUp`) et mise à niveau de `clientToCanvas`. |
| `canvas-board.tsx` | **Modifié** | Encapsulation des calques SVG et nœuds HTML sous un conteneur transformé `transform: translate(pan.x px, pan.y px) scale(zoom)`. Affichage de la grille d'arrière-plan adaptée au viewport. |
| Schéma de signatures | **Modifié** | `tdd/docs/signature/signature-ui.md` : mise à jour des signatures de `CanvasBoardProps`, `useCanvasViewport` et `CanvasPointerManager`. |

---

## 6. Impact — Cas de Test (TDD)

| Fiche de Test | Impact | Description |
|---|---|---|
| **`CASE-UI-02-20`** *(nouvelle)* | **À créer** | Test unitaire du déplacement de caméra (Pan) : clic-glissé sur le fond vide, mise à jour des coordonnées `pan`, calcul du delta, vérification de l'absence de mutation sur `scenario.nodes`. |
| **`CASE-UI-02-21`** *(nouvelle)* | **À créer** | Test unitaire du zoom à la molette : calcul du point fixe sous le curseur, application du pas de zoom, respect strict des bornes 0.25x et 2.0x. |
| **`CASE-UI-02-22`** *(nouvelle)* | **À créer** | Test unitaire de l'isomorphisme de `clientToCanvas` sous pan non nul et zoom ≠ 1.0 (drag d'un nœud et hit-test de port). |

---

## 7. Impact — Code de Production

| Composant | Rôle & Modification |
|---|---|
| `src/ui/types/canvas.types.ts` | Ajout des types `CanvasViewport` (`pan: Point`, `zoom: number`). |
| `src/ui/hooks/canvas/use-canvas-viewport.hook.ts` | Nouveau hook gérant l'état `pan`/`zoom`, la molette `handleWheel` avec zoom centré, et les mutations de pan. |
| `src/ui/hooks/canvas/use-canvas-pointer-manager.hook.ts` | Détection du clic sur le fond vide pour enclencher le drag de caméra (pan), et formule de projection matricielle inverse dans `clientToCanvas()`. |
| `src/ui/components/canvas/canvas-board.tsx` | Application de la transformation graphique commune (SVG + calque de nœuds HTML), gestion des styles de curseur `grab` / `grabbing`. |

---

## 8. Effets de bord identifiés & Maîtrise des risques

1. **Décalage visuel lors du drag de bloc sous zoom fort :**  
   *Maîtrise :* La vitesse de déplacement du bloc doit être divisée par `zoom` (`delta.x / zoom`, `delta.y / zoom`) pour que le bloc reste exactement sous le curseur de la souris.
2. **Détection erronée du clic sur le fond lors d'un clic sur un nœud ou un port :**  
   *Maîtrise :* La gestion des événements vérifie strictement `e.target` : si l'élément cliqué ou un de ses ancêtres possède `[data-node-id]` ou `[data-port-type]`, le pan n'est pas activé.
3. **Câblage en cours avec zoom molette simultané :**  
   *Maîtrise :* Si un câble est en cours d'étirement (`wireDrag`), la mise à jour de la prévisualisation recalcule la position cible avec le nouveau zoom.

---

## 9. Ce que nous ne ferons pas dans cette étape

- Minimap flottante d'aperçu d'ensemble du scénario (réservée pour une version future).
- Sauvegarde de la position de la caméra dans le fichier JSON du scénario (la caméra s'ouvre toujours en vue initiale 100% à l'ouverture).

---

## 10. Ordre d'exécution retenu

| # | Étape | Livrables associés |
|---|---|---|
| 1 | Amendement du Cahier des charges | `tdd/docs/cdc/cahier-des-charges-v2.1.md` mis à jour vers v2.2 (R-49, REQ-045). |
| 2 | Décision d'Architecture | `tdd/docs/adr/ADR-021-canvas-pan-zoom-interactions.md` rédigé et ratifié. |
| 3 | Spécifications fonctionnelles | `tdd/specs/UI.md` mis à jour avec `SPEC-UI-02` (`AC-UI-02-13..15`) et `sommaire.md`. |
| 4 | Fiches de Test TDD | `tdd/tests/ui/CASE-UI-02-20.md`, `CASE-UI-02-21.md`, `CASE-UI-02-22.md`. |
| 5 | Tests unitaires Vitest (ROUGE) | Écriture de `tests/units/ui/CASE-UI-02-20.test.ts`... |
| 6 | Implémentation du code (VERT) | `use-canvas-viewport.hook.ts`, `use-canvas-pointer-manager.hook.ts`, `canvas-board.tsx`. |
| 7 | Refactoring & Contrôle Qualité | `npm run quality` (typecheck, lint, prettier) et tests E2E Playwright. |
