# CASE-DATA-01-2 — Validation du schéma JSON d'un Profil et des 3 politiques d'envoi

**Spécification :** `SPEC-DATA-01`
**Critère d'acceptation :** `AC-DATA-01-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Un profil définit le comportement d'envoi du prompt système via le champ `policy`. Seules trois valeurs sont autorisées (`chaque_prompt`, `debut_scenario`, `une_fois_jusqu_a_clear`) conformément à `R-06`. Si la validation d'énumération disparaît, une valeur invalide peut être persistée, entraînant un comportement d'envoi indéfini à l'exécution.

## Cas

```gherkin
Étant donné un objet JSON représentant un profil avec les champs :
  | champ        | valeur                   |
  | id           | "profil-standard"        |
  | name         | "Standard"               |
  | systemPrompt | "Tu es un assistant TS"  |
  | policy       | "chaque_prompt"          |
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit sans erreur

Étant donné un profil JSON sans le champ "policy"
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit
Et la valeur par défaut "chaque_prompt" est assignée au champ "policy"

Étant donné un profil JSON avec "policy" égal à "debut_scenario"
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit sans erreur

Étant donné un profil JSON avec "policy" égal à "une_fois_jusqu_a_clear"
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit sans erreur

Étant donné un profil JSON avec "policy" égal à "toujours"
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "toujours" n'est pas une valeur autorisée pour "policy"
```

## Données

| Élément | Valeur |
|---|---:|
| id | `"profil-standard"` |
| name | `"Standard"` |
| systemPrompt | `"Tu es un assistant TS"` |
| policy (valide — 1) | `"chaque_prompt"` |
| policy (valide — 2) | `"debut_scenario"` |
| policy (valide — 3) | `"une_fois_jusqu_a_clear"` |
| policy (absent → défaut) | *(champ omis)* |
| policy (invalide) | `"toujours"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Résultat validation (`chaque_prompt`) | `PASS` | Valeur dans l'énumération R-06 |
| Résultat validation (`debut_scenario`) | `PASS` | Valeur dans l'énumération R-06 |
| Résultat validation (`une_fois_jusqu_a_clear`) | `PASS` | Valeur dans l'énumération R-06 |
| Résultat validation (absent) | `PASS` + défaut | `chaque_prompt` assigné par défaut |
| Résultat validation (`toujours`) | `FAIL` | Valeur hors énumération : violation R-06 |

## Ce que ce cas ne vérifie pas

- La validation du schéma d'un agent → `CASE-DATA-01-1` ;
- La validation des ressources `prompts/` et `exit/` → `CASE-DATA-01-3` ;
- Le rejet des fichiers JSON corrompus → `CASE-DATA-01-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_01_2_profil_schema_policy_enum`
**Fichier :** `tests/tests-unitaires/data/case-data-01-2.test.ts`

## Revue du test automatisé

- [ ] Le test valide les 3 valeurs d'énumération autorisées pour `policy`.
- [ ] Le test vérifie qu'en l'absence de `policy`, la valeur `"chaque_prompt"` est assignée par défaut.
- [ ] Le test vérifie que `"toujours"` et autres valeurs invalides sont rejetées avec diagnostic.
- [ ] Le test échoue si la contrainte d'énumération sur `policy` est supprimée du schéma.
- [ ] Le nom du test contient `CASE_DATA_01_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
