# CASE-UI-02-9 — Panneau inspecteur latéral d'édition dynamique des paramètres de bloc

**Spécification :** `SPEC-UI-02`  
**Critère d'acceptation :** `AC-UI-02-1`  
**Type :** acceptation / composant  
**Niveau de risque :** modéré  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

Le panneau inspecteur Preact (`UI-024 components/canvas/inspector-panel.tsx`, `<InspectorPanel />`, `ADR-013`) monte dynamiquement l'interface latérale de configuration du bloc sélectionné sur le canvas stylisée avec Tailwind CSS v4. Ce cas garantit :
1. L'adaptation réactive directe du formulaire selon le type de bloc sélectionné, affichant exclusivement les propriétés éditables qui lui sont propres sans système d'onglets statiques (champs d'agent, de prompt et de condition de sortie pour Run, script conditionnel pour If, agent cible pour ClearContext, informatif pour Start).
2. L'absence d'onglets superflus ou de vues transverses vides non applicables au bloc inspecté.
3. La mise à jour synchrone du document de scénario lors de la modification des champs (`onUpdate`).
4. La validation immédiate des entrées avec retours en français (`UI-004 i18n/fr.i18n.ts`).
5. Le démontage déclaratif Preact lorsque la sélection de nœud est désactivée (`useEffect` cleanup).

---

## Cas

```gherkin
Étant donné un conteneur DOM pour l'inspecteur
Et un bloc Run sélectionné possédant les paramètres '{ agentId: "agent-1", promptId: "prompt-1" }'
Quand le composant Preact "<InspectorPanel selectedNodeId='run-1' scenario={scenarioDoc} onUpdate={onUpdate} />" est rendu
Alors le formulaire d'inspection s'affiche avec les sélecteurs d'agent et de prompt
Et le titre du panneau indique en français "Configuration du bloc : Run"

Étant donné l'inspecteur monté
Quand l'utilisateur change la valeur du sélecteur d'agent vers "agent-2"
Alors le callback "onUpdate" est notifié avec les nouveaux paramètres du nœud

Étant donné l'inspecteur monté pour un bloc Run ayant "agentId: 'agent-1'"
Quand l'utilisateur efface intégralement l'agent (valeur vide "")
Alors le callback "onUpdate" est notifié avec un nœud dont la propriété "agentId" est purgée
Et le champ d'inspection demeure vide sans restaurer l'ancienne valeur

Étant donné la sélection désactivée (clic dans le vide du canvas)
Quand le panneau inspecteur est démonté (sélection réinitialisée à null)
Alors le formulaire d'inspection est vidé et retiré du DOM
```

---

## Données

| Type de bloc sélectionné | Formulaire d'inspection attendu (champs éditables spécifiques) |
|:---|:---|
| `start` | Paramètres informatifs (point d'entrée, degré entrant 0), libellé `label` optionnel |
| `run` | Sélecteur d'agent (`agentId`), template de prompt (`promptId`), condition de sortie (`exitId`) |
| `if` | Sélecteur de script conditionnel (`ifScriptId`), rappel des branches de sortie (Vrai / Faux) |
| `clearContext` | Sélecteur d'agent cible (`agentId`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Réactivité sur sélection | Formulaire adapté au type | Monté immédiatement avec champs exclusifs |
| Absence d'onglets | 0 barre d'onglets statiques | Affichage unifié direct sans navigation par onglet |
| Démontage Preact | Conteneur inspecteur vidé | Retrait propre des champs sans fuite |

---

## Ce que ce cas ne vérifie pas

- Le rendu visuel des nœuds dans le SVG → `CASE-UI-02-7` ;
- La modale d'affichage du script If → `CASE-UI-01-7`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_9_inspector_view_reactive_editing`  
**Fichier :** `tests/units/ui/case-ui-02-9.test.ts`  

## Revue du test automatisé

- [ ] Le test monte l'inspecteur pour chaque type de bloc via `<InspectorPanel />` et valide la présence exclusive des champs spécifiques.
- [ ] Le test vérifie l'absence de boutons d'onglets de navigation statique (`<nav>`).
- [ ] Le test vérifie la mise à jour lors d'un changement de champ via `onUpdate`.
- [ ] Le test vérifie le démontage propre du composant Preact lorsque la sélection est désactivée.
- [ ] Le nom du test contient `CASE_UI_02_9`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
