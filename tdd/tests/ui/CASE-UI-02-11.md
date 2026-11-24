# CASE-UI-02-11 — Validation E2E de la création d'un scénario par drag-and-drop, câblage et persistance

**Spécification :** `SPEC-UI-02`, `SPEC-DATA-03`  
**Critère d'acceptation :** `AC-UI-02-1`, `AC-DATA-03-1`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-005`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) l'expérience centrale d'édition du canvas Preact de style N8N (`ADR-013`, `UI-008`, `UI-009`, `UI-020..UI-024`, `UI-031`) :
1. L'ajout d'un nouveau bloc (ex: bloc Run) depuis la palette d'outils vers l'espace de travail SVG.
2. Le déplacement pointer du bloc et son positionnement sur le canvas.
3. Le tirage à la souris d'une liaison câblée entre le bloc Start et le bloc Run.
4. L'ouverture de l'inspecteur latéral, la saisie d'un agent et d'un prompt.
5. La persistance synchrone du document sous `.agents/data/scenarios/<id>.json` avec préservation exacte des coordonnées et de la structure du graphe.

---

## Cas

```gherkin
Scénario : Création complète d'un scénario par composition graphique
  Étant donné le navigateur ouvert sur la page d'un scénario vierge "#/scenarios/nouveau"
  Quand l'utilisateur glisse un bloc de type "Run" depuis la palette vers les coordonnées (300, 150) du canvas
  Alors un nœud carte VDOM [data-node-id="..."] apparaît à ces coordonnées avec son titre "Run"
  
  Quand l'utilisateur tire un câble depuis le port de sortie du bloc Start [data-port-index="default"] vers le port d'entrée du bloc Run [data-port-index="0"]
  Alors un chemin SVG <path class="cable"> relie visuellement les deux blocs
  
  Quand l'utilisateur clique sur le bloc Run pour le sélectionner
  Alors le panneau inspecteur latéral s'ouvre avec le formulaire de configuration
  
  Quand l'utilisateur sélectionne un agent dans la liste déroulante et saisit un titre de scénario
  Et clique sur "Enregistrer le scénario"
  Alors le document de scénario est sauvegardé
  Et le fichier JSON correspondant sur le disque contient 2 nœuds (start, run) et 1 connexion orientée
```

---

## Données

| Élément | Valeur |
|---|---:|
| Coordonnées nœud Run | `x: 300`, `y: 150` |
| Sélecteurs DOM stables | `[data-node-id]`, `[data-port-index]` |
| Connexion attendue | `from: start.id`, `outputPort: default` $\to$ `to: run.id`, `inputKey: "0"` |
| Fichier disque cible | `.agents/data/scenarios/<id>.json` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nœuds dans le fichier JSON | `2` (`start`, `run`) | Validation de la structure persistée |
| Connexions dans le fichier JSON | `1` | Liaison orientée Start $\to$ Run |

---

## Ce que ce cas ne vérifie pas

- Le lancement en exécution → `CASE-UI-03-4` ;
- Le rejet de doublon Start → `CASE-UI-02-12`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_11_e2e_canvas_scenario_creation_and_wiring`  
**Fichier :** `tests/e2e/ui/CASE-UI-02-11.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test glisse un bloc Run sur le canvas SVG en ciblant `data-node-id`.
- [ ] Le test tire un câble de Start à Run via `data-port-index`.
- [ ] Le test configure les champs dans l'inspecteur et sauvegarde.
- [ ] Le test vérifie la présence du fichier JSON sur le disque.
- [ ] Le nom du test contient `CASE_UI_02_11`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
