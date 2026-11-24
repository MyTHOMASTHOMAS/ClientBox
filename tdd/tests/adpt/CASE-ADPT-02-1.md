# CASE-ADPT-02-1 — Validation stricte de l'existence et de l'accessibilité du binaire `CURSOR_CLI_BIN`

**Spécification :** `SPEC-ADPT-02`
**Critère d'acceptation :** `AC-ADPT-02-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le binaire `cursor-cli` est résolu exclusivement à partir de la variable d'environnement `process.env.CURSOR_CLI_BIN` (`R-38`, `REQ-031`, `REQ-112`, `ADR-003`). Aucun fallback automatique ou recherche dans le `PATH` n'est autorisé en v1. Si `CURSOR_CLI_BIN` est absent, vide ou pointe vers un binaire inexistant ou non exécutable, le système doit refuser l'exécution immédiatement avec un diagnostic clair. Sans cette validation précoce, des commandes échoueraient silencieusement ou bloqueraient indéfiniment.

## Cas

```gherkin
Étant donné la variable d'environnement "CURSOR_CLI_BIN" pointant vers un fichier exécutable valide "/opt/cursor/bin/cursor-agent"
Quand le système initialise ou sollicite l'adapter "cursor-cli"
Alors la validation du binaire réussit sans erreur
Et l'adapter est prêt pour l'exécution

Étant donné la variable d'environnement "CURSOR_CLI_BIN" non définie (undefined) ou égale à une chaîne vide ""
Quand l'adapter "cursor-cli" est sollicité pour une exécution
Alors l'opération échoue immédiatement
Et un message d'erreur explicite indique que la variable "CURSOR_CLI_BIN" est obligatoire et non renseignée

Étant donné "CURSOR_CLI_BIN" pointant vers un chemin inexistant "/invalid/path/to/cursor" ou vers un fichier sans droits d'exécution
Quand l'adapter tente de vérifier l'accessibilité du binaire
Alors l'opération échoue immédiatement avec un message indiquant que le binaire est introuvable ou non exécutable
```

## Données

| Élément | Valeur |
|---|---:|
| `CURSOR_CLI_BIN` (valide) | `"/opt/cursor/bin/cursor-agent"` (exécutable présent) |
| `CURSOR_CLI_BIN` (absente / vide) | `undefined`, `""` |
| `CURSOR_CLI_BIN` (inexistant / non-exécutable) | `"/invalid/path/to/cursor"`, fichier sans permission `+x` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut binaire valide | `OK` | Fichier présent et droits d'exécution vérifiés |
| Statut variable absente ou vide | `FAIL` (diagnostic explicite) | Erreur `CURSOR_CLI_BIN manquante ou vide` (REQ-031, REQ-112) |
| Statut chemin inexistant ou non exécutable | `FAIL` (diagnostic explicite) | Erreur `Binaire Cursor introuvable ou non exécutable` |
| Recherche implicite dans le PATH | `NON` | Exclusivité stricte de la variable (ADR-003) |

## Ce que ce cas ne vérifie pas

- La construction de la ligne de commande → `CASE-ADPT-02-2` ;
- Le parsing des flux stream → `CASE-ADPT-02-3` ;
- L'arrêt d'un processus spawnable → `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_02_1_cursor_cli_bin_environment_variable_validation`
**Fichier :** `tests/tests-unitaires/adpt/case-adpt-02-1.test.ts`

## Revue du test automatisé

- [ ] Le test simule `CURSOR_CLI_BIN` positionnée vers un binaire exécutable factice et vérifie `PASS`.
- [ ] Le test supprime `process.env.CURSOR_CLI_BIN` (ou lui assigne une chaîne vide `""`) et vérifie le rejet immédiat avec diagnostic.
- [ ] Le test positionne un chemin fictif inexistant ou un fichier dépourvu de permissions d'exécution (`+x`) et vérifie le rejet sans tentative de spawn.
- [ ] Le test unitaire mocke les flux `stdio` (`child_process.spawn`) en mémoire sans invoquer de binaire système lourd (ADR-006).
- [ ] Le test échoue si un fallback sur un chemin par défaut ou sur le `PATH` est déclenché.
- [ ] Le nom du test contient `CASE_ADPT_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
