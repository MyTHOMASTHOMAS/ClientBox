# CASE-UI-02-7 — Moteur de rendu SVG interactif, câbles de Bézier et cycle de vie du canvas

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-1`, `AC-UI-02-3`, `AC-UI-02-4`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Le calculateur de géométrie (`UI-009 hooks/use-canvas-geometry.hook.ts`), la planche SVG (`UI-020 components/canvas/canvas-board.tsx`) et le composant câble (`UI-022 components/canvas/canvas-cable.tsx`) sont responsables de la génération et de la synchronisation réactive de l'arbre SVG matérialisant les blocs, les ports et les câbles orientés de style N8N au sein de l'architecture Preact (`ADR-013`). Ce cas garantit :
1. Le calcul et le rendu précis des câbles orientés sous forme de courbes cubiques de Bézier SVG (`<path d="M ... C ...">`, `UI-022` via `UI-009`).
2. Le rendu distinctif des ports et câbles de sortie du bloc If (vert `emerald-500` pour Vrai, rouge `red-500` pour Faux).
3. L'affichage temps réel des badges de statut visuel (`BlockStatus`) sur chaque nœud sans régénération intégrale du DOM.
4. La gestion du cycle de vie Preact : synchronisation réactive sur changement de props et libération des ressources au démontage (`useEffect` cleanup).

---

## Cas

```gherkin
Étant donné un conteneur HTML et un document de scénario contenant un bloc Start relié à un bloc Run
Quand le composant Preact "<CanvasBoard scenario={scenarioDoc} />" est rendu dans le conteneur
Alors une balise racine <svg> est injectée dans le conteneur
Et chaque nœud est représenté par un groupe SVG <g class="node" data-node-id="..."> avec ses ports d'entrée/sortie munis de data-port-index
Et chaque liaison est représentée par une balise <path class="cable" data-branch="..."> calculant une courbe de Bézier

Étant donné un bloc If avec deux sorties "true" et "false" connectées
Quand le rendu SVG est généré
Alors le câble issu du port "true" possède la classe CSS "cable-true" (vert) et data-branch="true"
Et le câble issu du port "false" possède la classe CSS "cable-false" (rouge) et data-branch="false"

Étant donné le canvas actif
Quand le statut d'un nœud change vers "running" puis "completed" (BlockStatus per TYPES-012)
Et que les props du composant sont mises à jour avec "scenario={updatedDoc}"
Alors le badge SVG du nœud est immédiatement mis à jour sans recréer tout l'arbre DOM

Étant donné le canvas monté
Quand le composant "<CanvasBoard />" est démonté (unmount Preact / useEffect cleanup)
Alors l'arbre SVG est purgé et tous les écouteurs internes sont détachés
```

---

## Données

| Élément | Valeur |
|---|---:|
| Balise graphique | `<svg viewBox="...">` |
| Attributs data de ciblage stable | `data-node-id`, `data-port-index`, `data-branch` sur nœuds, ports et câbles |
| Trajectoire des câbles | Courbe de Bézier cubique `<path d="M x1 y1 C cx1 cy1, cx2 cy2, x2 y2">` |
| Couleurs câbles If | Vrai: `#10b981` (vert), Faux: `#ef4444` (rouge) per CDC R-10b |
| Cycle de vie Preact | Props réactives `scenario: Scenario`, nettoyage au démontage (`useEffect` cleanup) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre d'éléments `<g.node>` | Égal au nombre de nœuds du document | Rendu 1:1 sans omission avec `data-node-id` |
| Nombre d'éléments `<path.cable>` | Égal au nombre de connexions | Tracé de chaque liaison avec `data-branch` |
| Statut nœud mis à jour | `'completed'` | Alignement strict TYPES-012 |
| Démontage VDOM Preact | Conteneur vidé / nettoyé | Libération complète des écouteurs et nœuds |

---

## Ce que ce cas ne vérifie pas

- Les interactions pointer souris (drag, câblage) → `CASE-UI-02-8` ;
- Le panneau inspecteur latéral → `CASE-UI-02-9`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_7_canvas_svg_renderer_and_lifecycle`  
**Fichier :** `tests/units/ui/case-ui-02-7.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie l'injection de l'arbre SVG dans le conteneur avec `data-node-id`.
- [ ] Le test vérifie les classes CSS et data-branch distinctifs sur les câbles If.
- [ ] Le test vérifie la mise à jour réactive via les props/signaux avec statut `completed`.
- [ ] Le test vérifie le démontage complet via le cycle de vie Preact (`unmount` / `useEffect` cleanup).
- [ ] Le nom du test contient `CASE_UI_02_7`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
