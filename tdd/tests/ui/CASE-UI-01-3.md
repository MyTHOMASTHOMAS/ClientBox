# CASE-UI-01-3 — Filtrage strict du sélecteur de CLI d'agent restreint aux adapters opérationnels embarqués

**Spécification :** `SPEC-UI-01`
**Critère d'acceptation :** `AC-UI-01-3`
**Type :** acceptation
**Niveau de risque :** élevé
**ADR liés :** `ADR-002`, `ADR-013`, ADR-015

## Ce que ce cas protège

Lors de la création ou de la modification d'un agent dans l'interface utilisateur (composant Preact `select.tsx` `UI-014` orchestré par `use-resources.hook.ts` `UI-007` au sein de `agents-page.tsx` `UI-027`), la liste déroulante du sélecteur de CLI doit être strictement filtrée pour ne proposer que les adapters opérationnels embarqués dans le système (`REQ-008`, `R-04`, `R-28`). En version v1, l'adapter opérationnel exclusif est `cursor-cli`. Aucun adapter inexistant, non opérationnel ou externe non embarqué ne doit pouvoir être sélectionné. Si l'IHM permettait la saisie libre ou la sélection d'un CLI tiers non pris en charge, le moteur échouerait au moment de la résolution du binaire lors de l'exécution.

## Cas

```gherkin
Étant donné un utilisateur ouvrant le formulaire de création ou d'édition d'un agent
Quand il consulte la liste déroulante "CLI"
Alors la liste ne contient que les adapters opérationnels vérifiés
Et en version v1, seul l'adapter "cursor-cli" est disponible et sélectionnable
Et aucune option CLI non installée ou fictive n'est proposée

Étant donné une tentative d'injection d'un nom de CLI non supporté (ex. "unsupported-cli") via l'IHM
Quand le formulaire est validé
Alors la validation refuse la valeur
Et un message d'erreur en français informe l'utilisateur que le CLI n'est pas disponible
```

## Données

| Élément | Valeur |
|---|---:|
| Champ testé | Sélecteur de CLI dans le formulaire Agent |
| Adapters opérationnels en v1 | `["cursor-cli"]` |
| Valeurs rejetées | Saisie libre, adapters tiers non embarqués (ex. `claude-code`, `aider`) |
| Comportement par défaut | Sélection prépositionnée sur `cursor-cli` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Options de CLI proposées en v1 | `["cursor-cli"]` | Filtrage exclusif sur les adapters opérationnels embarqués (R-04, R-28) |
| Possibilité de sélectionner un CLI invalide | `NON` | Liste fermée contrôlée par l'API des adapters disponibles |
| Rejet d'un CLI non supporté | `FAIL` immédiat | Validation formulaire stricte |

## Ce que ce cas ne vérifie pas

- La vérification système de l'existence de la variable `CURSOR_CLI_BIN` → `CASE-ADPT-02-1` ;
- La génération de la commande de spawn → `CASE-ADPT-02-2` ;
- L'assignation du profil de l'agent → `CASE-UI-01-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_UI_01_3_agent_cli_selector_filtered_to_embedded_adapters`
**Fichier :** `tests/tests-unitaires/ui/case-ui-01-3.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que la liste déroulante des CLI dans le formulaire Agent propose `cursor-cli`.
- [ ] Le test vérifie qu'aucun adapter non supporté n'est injecté dans les options disponibles.
- [ ] Le test vérifie le rejet côté client de toute valeur de CLI non présente dans la liste blanche.
- [ ] Le test échoue si un CLI non opérationnel peut être sélectionné.
- [ ] Le nom du test contient `CASE_UI_01_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
