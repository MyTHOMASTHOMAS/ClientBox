# CASE-UI-03-7 — Validation E2E de la conditionnelle If et de l'état Pause Join sur le canvas

**Spécification :** `SPEC-UI-02`, `SPEC-ENG-02`, `SPEC-ENG-03`  
**Critère d'acceptation :** `AC-UI-02-4`, `AC-ENG-02-2`, `AC-ENG-03-3`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-011`, `ADR-013`, `ADR-015`  

---

## Ce que ce cas protège

Lorsqu'un bloc conditionnel `If` s'exécute, il émet du signal `power: 1` sur l'une de ses branches et `power: 0` sur l'autre (`R-15`). Lorsqu'un bloc `Join` en aval reçoit une somme de puissances $\sum power < N$, il bascule en état de pause (`R-42b`). Ce cas valide dans un vrai navigateur que, sur le canvas Preact stylisé avec Tailwind CSS v4 et le Design System (`UI-017 badge.tsx`, `UI-020 canvas-board.tsx`, `UI-021 canvas-node.tsx`, `UI-022 canvas-cable.tsx`, `ADR-013`, `ADR-015`) :
1. Les badges de statut temps réel des nœuds reflètent la branche active (`completed` en vert per `TYPES-012`) et la branche non exécutée (`idle` ou statut neutre).
2. Le bloc `Join` passe visuellement à l'état **Pause** (`BlockStatus: 'paused'` avec badge Tailwind token warning `status-warning` / `bg-status-warning/20 text-status-warning` per `ADR-015` et libellé en français « En pause » per `UI-004 i18n/fr.i18n.ts`).
3. Les blocs situés après le bloc Join en pause ne sont pas exécutés.
4. Le terminal notifie la mise en pause de manière compréhensible sans planter le runner.

---

## Cas

```gherkin
Scénario : Exécution d'un flux conditionnel avec mise en pause d'un nœud Join
  Étant donné un scénario ouvert sur le canvas comprenant :
    | Nœud   | Configuration                                  |
    | Start  | Relié à If                                     |
    | If     | Évalue une condition retournant true           |
    | Run-A  | Relié à la sortie Vrai du If (entrée 0 de Join)|
    | Run-B  | Relié à la sortie Faux du If (entrée 1 de Join)|
    | Join   | N=2 entrées, relié à un bloc Final             |
  Quand l'utilisateur lance le scénario depuis le canvas
  Alors le bloc If est évalué à Vrai
  Et le bloc Run-A s'exécute et passe à l'état "Terminé" (completed)
  Et le bloc Run-B ne s'exécute pas (power: 0)
  Et le bloc Join reçoit ses 2 entrées mais totalise sum(power) = 1 < 2
  Et le nœud Join affiche sur le canvas le badge visuel orange "En pause" (paused per TYPES-012)
  Et le bloc Final en aval demeure inactif
  Et le scénario se stabilise proprement sans erreur critique
```

---

## Données

| Élément | Valeur |
|---|---:|
| Statut visuel Join | Classe CSS `.status-pause` / couleur orange (`#f59e0b`) |
| Libellé badge Join | `"En pause"` (`REQ-007`) |
| Blocs avals exécutés | `0 bloc` (suspension du flux) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut du bloc Join | `'paused'` (BlockStatus) / `'pause'` (JoinDecision) | $\sum power = 1 < 2$ per CDC R-42b |
| Animation canvas | Badge orange visible | Restitution temps réel per `AC-UI-02-4` |

---

## Ce que ce cas ne vérifie pas

- L'algorithme pur `evaluateJoin` → `CASE-ENG-02-1` ;
- La renumérotation des clés → `CASE-UI-02-13`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_03_7_e2e_if_conditional_and_join_pause_state`  
**Fichier :** `tests/e2e/ui/CASE-UI-03-7.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test exécute un scénario à branche conditionnelle et Join.
- [ ] Le test vérifie que le nœud Join affiche le badge orange « En pause ».
- [ ] Le test vérifie que le nœud aval n'a pas été déclenché.
- [ ] Le nom du test contient `CASE_UI_03_7`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
