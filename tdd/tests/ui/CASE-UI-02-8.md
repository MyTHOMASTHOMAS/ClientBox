# CASE-UI-02-8 — Interactions pointer, hit-test des ports et capture de tirage de câbles

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-1`  
**Type :** acceptation / composant  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Le gestionnaire d'état (`UI-008 hooks/use-canvas-state.hook.ts`), le calculateur géométrique (`UI-009 hooks/use-canvas-geometry.hook.ts`) et le composant SVG (`UI-020 components/canvas/canvas-board.tsx`) gèrent la réactivité physique de la souris et du tactile sur le canvas SVG dans l'environnement Preact (`ADR-013`). Ce cas garantit :
1. Le déplacement fluide (*drag-and-drop*) d'un nœud sélectionné avec mise à jour des coordonnées `(x, y)` dans le document du scénario.
2. Le tirage interactif d'une liaison câblée depuis un port de sortie avec prévisualisation en temps réel de la courbe temporaire.
3. L'utilisation de `setPointerCapture` pour garantir que le tirage de câble ne perd pas le curseur lors de mouvements rapides hors du viewport SVG.
4. Le hit-test précis sur les ports d'entrée cibles avec détection de proximité et validation de compatibilité.
5. La libération complète de tous les écouteurs pointer lors du démontage du composant Preact (`useEffect` cleanup).
6. La distinction par seuil de tolérance (drag threshold < 4px) entre un simple clic qui notifie la sélection (callback "onSelectNode") pour ouvrir l'inspecteur et un glisser-déposer (déplacement >= 4px) qui déplace le nœud sans déclencher de sélection accidentelle.

---

## Cas

Étapes et scénarios :

```gherkin
Scénario : Distinction entre clic de sélection de bloc et glisser-déposer
  Étant donné un bloc affiché sur le canvas
  Quand l'utilisateur déclenche "pointerdown" puis "pointerup" avec un déplacement inférieur à 4px
  Alors le callback "onSelectNode" est appelé avec l'identifiant du bloc pour ouvrir l'inspecteur
  
  Quand l'utilisateur déclenche "pointerdown", déplace le curseur de plus de 4px puis "pointerup"
  Alors les coordonnées du bloc sont incrémentées via "onMutate"
  Et "onSelectNode" n'est pas appelé

Scénario : Déplacement interactif et câblage de blocs sur le canvas
  Étant donné le composant canvas Preact monté avec ses écouteurs d'interactions ("<CanvasBoard scenario={doc} onMutate={onMutate} />")
  Quand l'utilisateur déclenche "pointerdown" sur l'en-tête d'un bloc et le déplace de 50px
  Alors les coordonnées du nœud sont incrémentées de (+50, +50)
  Et le callback "onMutate" est notifié du déplacement

  Étant donné un port de sortie cliqué avec "pointerdown"
  Quand l'utilisateur tire la souris vers un port d'entrée valide
  Alors un chemin SVG temporaire reliant le port source au curseur est affiché
  Et le hit-test détecte le survol du port d'entrée cible
  Et au relâchement ("pointerup"), une nouvelle connexion est insérée dans le document

  Étant donné les interactions attachées
  Quand le composant est démonté (exécution de la fonction de nettoyage renvoyée par le hook "useEffect")
  Alors les événements "pointerdown", "pointermove", "pointerup" ne déclenchent plus aucune mutation
```

---

## Données

| Élément | Valeur |
|---|---:|
| Événements captés | `pointerdown`, `pointermove`, `pointerup`, `pointercancel` |
| Seuil de tolérance au glissement (drag threshold) | $4\text{ px}$ (distance euclidienne entre pointerdown et pointerup) |
| Rayon de hit-test des ports | $\pm 12\text{ px}$ autour du centre du port SVG |
| API de capture | `element.setPointerCapture(pointerId)` / `releasePointerCapture` |
| Synchronisation documentaire | Méthode `updateDoc(newDoc: Scenario)` pour actualiser le document interne sans recréer les écouteurs |
| Adaptation d'échelle SVG | Conversion des deltas écran $(dx, dy)$ selon le ratio viewBox/rect conteneur |
| Cycle de vie des écouteurs | Attachement au montage, détachement complet au démontage (`useEffect` cleanup) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Précision de câblage | Connexion créée si lâché sur port cible | Hit-test réussi |
| Précision de clic | `onSelectNode` appelé si $\Delta < 4\text{ px}$ | Distinction clic vs drag |
| Synchronisation dynamique | Prise en compte immédiate des nœuds ajoutés via `updateDoc` | Mutation cohérente sur nouveau nœud |
| Nettoyage démontage (`detach`) | 0 écouteur actif sur conteneur | Nettoyage complet sans fuite mémoire |

---

## Ce que ce cas ne vérifie pas

- Le rendu SVG statique → `CASE-UI-02-7` ;
- La vérification d'unicité Start → `CASE-UI-02-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_8_canvas_pointer_interactions_and_hittest`  
**Fichier :** `tests/units/ui/case-ui-02-8.test.ts`  

## Revue du test automatisé

- [ ] Le test simule un clic sans déplacement (< 4px) et vérifie l'appel de `onSelectNode`.
- [ ] Le test simule les événements pointerdown/move pour déplacer un bloc (>= 4px) sans appeler `onSelectNode`.
- [ ] Le test simule le tirage d'un câble d'un port à un autre.
- [ ] Le test vérifie l'appel de `onMutate` avec la nouvelle connexion.
- [ ] Le test vérifie le nettoyage complet des écouteurs pointer lors du démontage (`useEffect` cleanup).
- [ ] Le nom du test contient `CASE_UI_02_8`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
