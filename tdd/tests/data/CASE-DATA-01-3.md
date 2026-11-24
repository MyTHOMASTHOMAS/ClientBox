# CASE-DATA-01-3 — Validation des schémas JSON pour les ressources `prompts/` et `exit/`

**Spécification :** `SPEC-DATA-01`
**Critère d'acceptation :** `AC-DATA-01-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Les ressources `prompts/` et `exit/` partagent le schéma `{ id, name, content }` (`R-01`, `R-02`, `R-07`, CR-012). Si la validation disparaît, des ressources incomplètes peuvent être persistées et le moteur ne pourra plus assembler correctement le prompt d'un bloc `Run`.

## Cas

```gherkin
Étant donné un objet JSON représentant un prompt avec les champs :
  | champ   | valeur                    |
  | id      | "p-init"                  |
  | name    | "Analyse"                 |
  | content | "Analyse le code suivant" |
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit sans erreur
Et la ressource est acceptée pour persistance sous ".agents/data/prompts/"

Étant donné un objet JSON de prompt sans le champ "content"
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "content" est obligatoire

Étant donné un objet JSON représentant un ordre de sortie exit avec les champs :
  | champ   | valeur                                                      |
  | id      | "e-done"                                                    |
  | name    | "Ordre de boucle"                                           |
  | content | "Si complet renvoie TERMINER, sinon CONTINUE"               |
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit sans erreur
Et la ressource est acceptée pour persistance sous ".agents/data/exit/"

Étant donné un objet JSON de ressource exit sans le champ "content"
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "content" est obligatoire
```

## Données

| Élément | Valeur |
|---|---:|
| Prompt id | `"p-init"` |
| Prompt content (valide) | `"Analyse le code suivant"` |
| Prompt content (absent) | *(champ omis)* |
| Exit id | `"e-done"` |
| Exit content (valide) | `"Si complet renvoie TERMINER, sinon CONTINUE"` |
| Exit content (absent) | *(champ omis)* |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Résultat validation prompt complet | `PASS` | Champs `id` + `name` + `content` présents |
| Résultat validation prompt sans `content` | `FAIL` | Champ obligatoire manquant |
| Résultat validation exit complet | `PASS` | Champs `id` + `name` + `content` présents (R-07) |
| Résultat validation exit sans `content` | `FAIL` | Champ `content` obligatoire (CR-012) |

## Ce que ce cas ne vérifie pas

- La validation du schéma d'un agent → `CASE-DATA-01-1` ;
- La validation du schéma d'un profil → `CASE-DATA-01-2` ;
- Le rejet des fichiers JSON corrompus (syntaxiquement) → `CASE-DATA-01-4` ;
- L'assemblage runtime `prompt` + `exit` → `CASE-ENG-04-1` / `CASE-ENG-04-13`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_01_3_prompt_and_exit_schema_validation`
**Fichier :** `tests/units/data/CASE-DATA-01-3.test.ts`

## Revue du test automatisé

- [ ] Le test valide un objet prompt complet (`id` + `name` + `content`).
- [ ] Le test rejette un prompt sans `content` avec diagnostic.
- [ ] Le test valide un objet exit complet (`id` + `name` + `content`).
- [ ] Le test rejette un exit sans `content` avec diagnostic.
- [ ] Le test échoue si les champs obligatoires sont retirés du schéma.
- [ ] Le nom du test contient `CASE_DATA_01_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — abrogation du schéma `matchers`.
