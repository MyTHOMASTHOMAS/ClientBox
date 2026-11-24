# CASE-UI-02-2 — Garantie d'unicité stricte du bloc Start avec blocage visuel de toute tentative d'insertion d'un second Start

**Spécification :** `SPEC-UI-02`
**Critère d'acceptation :** `AC-UI-02-2`
**Type :** acceptation
**Niveau de risque :** critique  
**ADR liés :** `ADR-004`, `ADR-013`, ADR-015  

## Ce que ce cas protège

Tout scénario ClientsBox doit obligatoirement comporter un et un seul bloc Start (`REQ-015`, `R-19`). L'interface du canvas Preact (hook d'état `UI-008 use-canvas-state.hook.ts` et composant `UI-020 canvas-board.tsx`, `ADR-013`) applique et fait respecter cette contrainte d'unicité en temps réel en consommant directement le validateur synchrone du domaine (`domain/graph/graph-integrity.validator.ts`) : dès qu'un bloc Start existe sur le canvas, l'outil d'ajout de bloc Start est désactivé ou toute tentative d'en déposer un second est immédiatement interceptée et refusée avec un message explicatif en français (`UI-004 src/ui/i18n/fr.i18n.ts`). Si le canvas permettait l'insertion de plusieurs blocs Start, le graphe deviendrait ambigu et le moteur d'exécution rejetterait le scénario.

## Cas

```gherkin
Étant donné un canvas de scénario contenant déjà un bloc Start "Start-1"
Quand l'utilisateur tente d'ajouter ou de glisser un second bloc Start "Start-2" sur le canvas
Alors l'action d'ajout est rejetée par l'interface
Et aucun second bloc Start n'est créé sur le canvas
Et un message d'avertissement en français indique que le scénario ne peut contenir qu'un seul bloc Start

Étant donné un canvas où le bloc Start existant "Start-1" est supprimé par l'utilisateur
Quand l'utilisateur ajoute un nouveau bloc Start "Start-New"
Alors l'opération réussit et le nouveau bloc Start est instancié normalement
```

## Données

| Élément | Valeur |
|---|---:|
| Contrainte d'unicité | Exactement `1` bloc Start par scénario (`R-19`, `REQ-015`) |
| État initial 1 | Canvas avec 1 bloc Start existant |
| Action 1 | Tentative d'insertion d'un second Start |
| Résultat action 1 | `REJET / BLOCAGE` avec notification d'erreur en français |
| Action 2 | Suppression du Start existant puis ajout d'un nouveau Start |
| Résultat action 2 | `SUCCÈS` (insertion autorisée) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre maximal de blocs Start sur le canvas | `1` | Règle R-19, REQ-015 |
| Comportement sur tentative d'insertion du 2e Start | Blocage interactif immédiat | Prévention d'incohérence à la source |
| Message d'avertissement | Rédigé en français | Conformité C-06 / REQ-007 |

## Ce que ce cas ne vérifie pas

- La composition générale du canvas → `CASE-UI-02-1` ;
- Le déclenchement de l'exécution depuis Start → `CASE-UI-02-5` ;
- La validation backend du schéma JSON du scénario → `SPEC-DATA-03`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_02_2_start_block_strict_uniqueness_enforcement`
**Fichier :** `tests/tests-unitaires/ui/case-ui-02-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie qu'un premier bloc Start peut être ajouté sur un canvas vide.
- [ ] Le test tente d'ajouter un second bloc Start et vérifie que l'opération est refusée.
- [ ] Le test vérifie la présence d'une notification d'erreur en français lors du blocage.
- [ ] Le test supprime le bloc Start existant et vérifie qu'un nouveau Start peut être réinséré.
- [ ] Le test échoue si deux blocs Start coexistent sur le même canvas.
- [ ] Le nom du test contient `CASE_UI_02_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
