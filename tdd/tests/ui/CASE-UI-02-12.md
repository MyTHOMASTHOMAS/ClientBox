# CASE-UI-02-12 — Validation E2E du blocage préventif d'insertion d'un second bloc Start per REQ-015

**Spécification :** `SPEC-UI-02`, `SPEC-ARCH-02`  
**Critère d'acceptation :** `AC-UI-02-2`, `AC-ARCH-02-4`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-004`, `ADR-011`, `ADR-013`, ADR-015  

---

## Ce que ce cas protège

La spécification `REQ-015` et la règle d'architecture `R-19` imposent l'unicité stricte du bloc Start (exactement 1 bloc Start par scénario, degré entrant 0). Ce cas valide dans un vrai navigateur que, au sein de l'IHM Preact (`UI-008 use-canvas-state.hook.ts` et `UI-020 canvas-board.tsx`, `ADR-013`) :
1. Lorsqu'un scénario ouvert contient déjà son bloc Start obligatoire, l'interface graphique désactive l'outil Start dans la palette ou intercepte toute tentative de glisser-déposer d'un second bloc Start via la validation synchrone du domaine (`graph-integrity.validator.ts`).
2. Une alerte en français (`UI-004 i18n/fr.i18n.ts`) s'affiche immédiatement sans émettre de requête réseau invalide vers le backend.
3. Le canvas conserve strictement un seul bloc Start.

---

## Cas

```gherkin
Scénario : Tentative d'insertion d'un second bloc Start sur le Canvas
  Étant donné un scénario ouvert dans le canvas contenant déjà un bloc Start
  Quand l'utilisateur tente de cliquer sur le bouton d'ajout d'un bloc Start ou de le glisser sur le canvas
  Alors l'action est immédiatement bloquée par la validation du domaine isomorphe
  Et un message d'avertissement en français apparaît : "Un scénario ne peut contenir qu'un seul bloc Start."
  Et aucun second bloc Start n'apparaît dans l'arbre SVG
  Et aucune requête réseau d'erreur n'est envoyée au serveur
```

---

## Données

| Élément | Valeur |
|---|---:|
| Nombre initial de blocs Start | `1` |
| Action testée | Tentative d'ajout d'un 2e bloc Start |
| Règle protégée | `REQ-015`, `R-19`, `DOM-008` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre de blocs Start affichés | Strictement `1` | Prévention client synchrone |
| Requêtes réseau émises | `0` | Validation pure par le domaine isomorphe |

---

## Ce que ce cas ne vérifie pas

- La validation topologique côté backend → `CASE-DATA-03-5` ;
- La fonction pure `validateGraph` → `CASE-ARCH-02-4`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_UI_02_12_e2e_single_start_block_prevention`  
**Fichier :** `tests/e2e/ui/CASE-UI-02-12.e2e.test.ts`  

## Revue du test automatisé

- [ ] Le test ouvre un scénario ayant un bloc Start.
- [ ] Le test tente d'insérer un second bloc Start.
- [ ] Le test vérifie l'apparition de l'alerte en français.
- [ ] Le test compte les balises SVG de nœuds Start (`count() === 1`).
- [ ] Le nom du test contient `CASE_UI_02_12`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
