# CASE-UI-02-24 — Validation E2E de la suppression interactive de câble et de bloc en situation de Canvas navigué

**Spécification :** `SPEC-UI-02`, `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-UI-02-7`, `AC-UI-02-10`, `AC-UI-02-15`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-011`, `ADR-013`, `ADR-015`, `ADR-021`  
**Modules cibles :** `UI-020` (`canvas-board.tsx`), `UI-021` (`canvas-node.tsx`), `UI-022` (`canvas-cable.tsx`), `UI-024` (`inspector-panel.tsx`), `UI-031` (`scenario-studio-page.tsx`), `UI-045` (`use-canvas-pointer-manager.hook.ts`)  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) que les actions de suppression interactives sur l'espace de travail nodal ne subissent aucune interception parasite par la couche de navigation Pan & Zoom :
1. **Suppression réelle d'un câble en 2 clics :**
   - Un premier clic sur la liaison SVG sélectionne le câble et fait apparaître l'option d'action "Supprimer" (`data-action="delete-connection"`).
   - Un second clic direct sur cette option supprime la liaison sans être intercepté par `setPointerCapture` ni déclencher un panoramique de caméra.
   - Le chemin SVG du câble disparaît immédiatement de l'arborescence DOM.
2. **Suppression réelle d'un bloc depuis l'inspecteur latéral :**
   - La sélection d'un bloc ouvre le panneau inspecteur contextuel.
   - Le clic sur le bouton d'action « Supprimer ce bloc » (`data-action="delete-node"`) supprime immédiatement le nœud et tous ses câbles connectés (amont et aval).
   - Le panneau d'inspection se referme automatiquement (sélection annulée).
3. **Persistance intègre :** L'enregistrement du scénario reflète immédiatement l'élimination des composants supprimés dans le stockage local JSON.

---

## Cas

```gherkin
Scénario : Suppression interactive d'un câble et d'un bloc sans collision avec le panoramique
  Étant donné le navigateur ouvert sur un nouveau scénario Studio vierge
  Quand l'utilisateur renomme le scénario "Workflow Suppression Clean" (data-field="scenario-name")
  Et clique sur le bouton "Start" (data-action="add-start") puis sur "Run" (data-action="add-run")
  Et relie le bloc Start au bloc Run
  Quand l'utilisateur clique sur le chemin SVG du câble reliant Start à Run
  Alors la pastille d'action "Supprimer" (data-action="delete-connection") apparaît près du centre de la liaison

  Quand l'utilisateur clique sur la pastille "Supprimer" du câble
  Alors le câble SVG disparaît immédiatement du canvas
  Et la caméra du canvas ne subit aucun déplacement parasite (pas de pan grabbing)

  Quand l'utilisateur clique sur la carte du bloc Run
  Alors le panneau inspecteur latéral s'ouvre à droite
  Et le bouton "Supprimer ce bloc" (data-action="delete-node") est visible et cliquable

  Quand l'utilisateur clique sur "Supprimer ce bloc" dans l'inspecteur
  Alors le bloc Run disparaît immédiatement du canvas
  Et le panneau latéral d'inspection se referme
  Et le canvas ne conserve que le bloc Start initial

  Quand l'utilisateur clique sur "Enregistrer" (data-action="save-scenario")
  Alors le scénario est persisté sur disque
  Et le fichier JSON correspondant ne comporte plus le bloc Run ni la connexion supprimée
```

---

## Données

| Élément | Sélecteur DOM | Rôle / Comportement attendu |
|---|---|---|
| Câble SVG | `g.cable path.cable` | Élément cliquable pour sélection |
| Option suppression câble | `[data-action="delete-connection"]` | Pastille SVG "Supprimer" visible après 1er clic |
| Carte de nœud | `[data-node-id]` | Bloc sélectionnable |
| Panneau inspecteur | `aside[data-section="inspector"]` | Volet latéral d'édition |
| Bouton suppression nœud | `button[data-action="delete-node"]` | Bouton rouge "Supprimer ce bloc" |
| Bouton sauvegarde | `button[data-action="save-scenario"]` | Déclencheur de persistance locale |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Câbles SVG après suppression | `0` | Disparition du câble Start $\to$ Run |
| Nœuds après suppression du bloc Run | `1` (`start`) | Disparition du nœud Run du canvas et fermeture inspecteur |
| Fichier persistant | Conforme | Absence de `run` et de `connections` dans le JSON |

---

## Ce que ce cas ne vérifie pas

- L'affichage des flux SSE temps réel dans le terminal → `CASE-UI-03-1`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_24_e2e_interactive_cable_and_node_deletion_under_navigated_canvas`  
**Fichier :** `tests/e2e/ui/CASE-UI-02-24.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test sélectionne un câble par clic et vérifie la présence de `data-action="delete-connection"`.
- [ ] Le test clique sur le bouton "Supprimer" du câble et vérifie sa disparition sans déclencher de pan.
- [ ] Le test sélectionne un bloc et clique sur `data-action="delete-node"`.
- [ ] Le test vérifie la disparition du bloc et la fermeture de l'inspecteur.
- [ ] Le test sauvegarde le scénario et vérifie la mise à jour du fichier sur le disque.
- [ ] Le nom du test contient `CASE_UI_02_24`.
