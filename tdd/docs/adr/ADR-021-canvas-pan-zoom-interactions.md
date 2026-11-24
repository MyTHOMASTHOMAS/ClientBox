# ADR-021 — Navigation spatiale Canvas (Pan & Zoom) par matrice de vue découplée

**Statut :** proposé  
**Date :** 16/11/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- une **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| REQ-045, R-49 | Navigation spatiale sur le canvas : déplacement libre par clic-glissé (Pan) et zoom molette centré (Zoom) |
| REQ-014, REQ-035, R-08..15 | Composition nodale du canvas, drag-and-drop de blocs et tirage interactif de câbles |
| REQ-030, AC-UI-02-9 | Verrouillage pendant un run : l'édition nodale est verrouillée mais la navigation Pan & Zoom reste permise |
| ADR-004, ADR-013, ADR-015 | Architecture IHM Preact, rendu SVG réactif et stylisation Tailwind CSS v4 |
| CR-002, CDC v2.2 | Agrément UX d'agrippement au clic gauche fond sans entité, zoom molette centré [0.25, 2.0] |

Cet ADR **complète** [`ADR-004`](./ADR-004-moteur-blocs.md) et [`ADR-013`](./ADR-013-ihm-preact-et-tailwind-css.md) : il formalise la gestion matricielle de la caméra spatiale du Scenario Studio, garantissant la fluidité UX tout en préservant l'étanchéité stricte du document de scénario persisté.

---

## Contexte

À mesure que les scénarios ClientsBox montent en complexité (orchestrations multi-agents asynchrones, branches conditionnelles If, sous-scénarios et commandes système), l'espace de travail d'un écran fixe devient trop exigu pour afficher l'ensemble du graphe nodial.

L'utilisateur a spécifié (`CR-002`, `CR-010`, `REQ-045`) le besoin de pouvoir :
1. **Se déplacer librement (Pan) :** agripper le fond du plan de travail par un clic gauche maintenu sur une zone vide (hors entités, nœuds ou ports) et glisser la souris pour translater la vue nodiale ;
2. **Zoomer et dézoomer (Zoom) :** manipuler la molette de la souris pour agrandir ou réduire la vue de façon continue, avec un centrage naturel sur la position du pointeur et des bornes de lisibilité adaptées (`[0.25, 2.0]`) ;
3. **Préserver l'intégrité du document de scénario (`R-49`) :** la navigation spatiale est une commodité d'affichage temporaire ; elle ne doit en aucun cas modifier les coordonnées absolues des blocs (`node.position`) enregistrées dans le fichier JSON du scénario ;
4. **Maintenir la précision absolue des interactions :** le déplacement de blocs par drag-and-drop, le tirage de câbles d'un port à un autre et la détection de survol (hit-testing) doivent conserver une précision parfaite au pixel près quel que soit l'état de translation et le facteur d'échelle actif.

---

## Options envisagées

### Option A — Mutation des coordonnées intrinsèques des nœuds (`node.position`) à chaque pan

| | |
|---|---|
| Ce qu'elle apporte | Rendu trivial sans couche matricielle complexe |
| Ce qu'elle coûte | Dégradation dramatique des performances (recalcul et mutation de tous les nœuds à chaque pixel de déplacement) ; pollution du modèle de données de scénario ; génération de diffs Git intempestifs (`R-49` violée) ; inapplicable pour gérer le zoom |
| Ce qu'elle rend difficile plus tard | Toute notion d'annulation (Undo/Redo), persistance propre et collaboration |

### Option B — Matrice de transformation SVG/VDOM pure avec projection affine inverse `clientToCanvas` découplée (Retenue)

| | |
|---|---|
| Ce qu'elle apporte | Modèle de données 100% immuable (`R-49`) ; performance matérielle optimale via CSS `transform: translate(...) scale(...)` sur les calques graphiques ; séparation nette entre repère écran (pixels physiques) et repère canvas (coordonnées logiques) ; projection mathématique déterministe et testable unitairement |
| Ce qu'elle coûte | Nécessite d'adapter la conversion géométrique de la souris (`clientToCanvas`) et la cinématique de drag de bloc (`delta / zoom`) |
| Ce qu'elle rend difficile plus tard | Aucun verrouillage ; compatible avec de futures fonctionnalités (mini-map, fit-to-view) |

### Option C — Intégration d'une bibliothèque tierce externe (ex. `panzoom`, `react-flow`)

| | |
|---|---|
| Ce qu'elle apporte | Fonctionnalités de navigation clé en main |
| Ce qu'elle coûte | Dépendance externe lourde ; incompatibilité avec le socle Preact natif et Tailwind CSS v4 ; perte de maîtrise sur les micro-interactions de câblage SVG |
| Ce qu'elle rend difficile plus tard | Respect de l'architecture épurée sans framework lourd (`ADR-001`) |

---

## Décision

1. **Architecture de la vue spatiale (`UI-025` / `UI-008`) :**
   - L'état de caméra est représenté par un état React/Preact réactif local au Studio :
     $$\text{viewport} = \{ \text{pan}: \{ x: \text{number}, y: \text{number} \},\, \text{zoom}: \text{number} \}$$
   - Valeurs initiales : `pan = { x: 0, y: 0 }`, `zoom = 1.0` (100%).
   - Cet état est strictement **volatil** (en mémoire de l'IHM) et n'est pas persisté dans le document JSON du scénario (`R-49`).

2. **Cinématique du Pan (Déplacement libre au clic gauche) :**
   - Un écouteur sur le conteneur principal du canvas intercepte l'événement `pointerdown` :
     - Si l'élément cible est le fond vide (absence d'attributs `data-node-id`, `data-port-type`, ou `data-cable-id`), le mode `isPanning` est engagé.
     - Le style du curseur passe visuellement de `cursor: grab` à `cursor: grabbing`.
   - Pendant le déplacement (`pointermove`), le delta souris $\Delta P = P_{\text{actuel}} - P_{\text{précédent}}$ est directement additionné à `pan` :
     $$pan_{\text{nouveau}} = pan_{\text{ancien}} + \Delta P$$
   - Le relâchement (`pointerup`) ou la perte de focus (`pointerleave`) désengage le mode `isPanning` et rétablit le curseur `grab`.

3. **Cinématique du Zoom (Molette continue et bornée) :**
   - L'événement `wheel` est capturé sur le canvas :
     - Le facteur de variation d'échelle suit la formule exponentielle continue :
       $$s = \exp(-\Delta y \times 0.0015)$$
       $$zoom_{\text{cible}} = \text{clamp}(zoom \times s,\, 0.25,\, 2.0)$$
   - Pour assurer que le point virtuel sous le curseur $P_{\text{curseur}} = (x_{\text{client}}, y_{\text{client}})$ reste fixe à l'écran, la translation `pan` est instantanément compensée :
     $$pan_{\text{nouveau}} = P_{\text{curseur}} - (P_{\text{curseur}} - pan_{\text{ancien}}) \times \frac{zoom_{\text{cible}}}{zoom_{\text{ancien}}}$$

4. **Isomorphisme de projection `clientToCanvas` :**
   - Toute coordonnée souris issue du DOM navigateur est traduite dans le repère logique du graphe via la transformation affine inverse :
     $$\text{canvasX} = \frac{clientX - rect.left - pan.x}{zoom}$$
     $$\text{canvasY} = \frac{clientY - rect.top - pan.y}{zoom}$$
   - Lors du drag d'un bloc, le déplacement appliqué aux coordonnées persistées du nœud normalise la vitesse par le zoom actif :
     $$\Delta \text{node} = \frac{\Delta \text{client}}{zoom}$$
     garantissant un suivi fluide au curseur sans effet d'accélération ni de traînée ("zero drift").

5. **Découplage vis-à-vis du verrou d'exécution :**
   - Pendant un run actif (`isRunning === true`), la manipulation des blocs et des liaisons est bloquée per `AC-UI-02-9`.
   - À l'inverse, la navigation spatiale (Pan et Zoom) demeure **pleinement active** pour permettre à l'utilisateur de se déplacer et de zoomer sur les blocs distants afin de visualiser leurs voyants d'état d'exécution en temps réel.

---

## Raisons

- **Performance et fluidité :** L'utilisation conjointe des propriétés CSS `transform: translate3d(...) scale(...)` sur les calques VDOM et SVG permet de déléguer le rendu graphique à l'accélération matérielle du GPU sans forcer de recalculs de layout DOM coûteux.
- **Préservation de la propreté des données :** L'étanchéité absolue garantie entre la matrice d'affichage et les coordonnées métier du scénario (`node.position`) élimine tout risque de corruption ou de pollution des fichiers de configuration.
- **Fidélité ergonomique :** Le centrage exact du zoom au curseur et le maintien de la précision de hit-testing des ports de connexion offrent une expérience utilisateur digne des standards modernes d'orchestration nodale (style N8N).

---

## Conséquences acceptées

- Le canvas doit appliquer la matrice d'échelle et de translation à la fois sur le conteneur HTML des blocs et sur le calque vectoriel SVG des câbles, tout en conservant une synchronisation géométrique parfaite.
- L'affichage de la grille de fond (points de repère) se translate et se met à l'échelle harmonieusement avec le viewport.

---

## Ce qui nous ferait revenir dessus

- L'introduction future d'un mode de présentation ou de canvas infini avec niveaux de détails (LOD) dynamiques si les graphes venaient à dépasser plusieurs milliers de blocs simultanés.
