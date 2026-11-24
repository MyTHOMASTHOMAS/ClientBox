# CASE-ENG-04-13 — Assemblage `Run` + `exitId` et fin naturelle du CLI sans arrêt anticipé

**Spécification :** `SPEC-ENG-04`, `SPEC-ENG-03`
**Critère d'acceptation :** `AC-ENG-04-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Lorsqu'un bloc `Run` référence un `exitId`, le moteur doit additionner `exit.content` au prompt transmis à l'adapter (`R-07`, `R-45`, CR-012) et laisser le processus CLI s'exécuter jusqu'à sa terminaison naturelle. Si un mot-clé d'ordre de sortie (ex. `TERMINER`) apparaissant en cours de streaming déclenchait encore un `stop()` anticipé, l'agent serait coupé avant la fin réelle de sa tâche — dérive abrogée par CR-012.

## Cas

```gherkin
Étant donné un bloc Run avec promptId "p-mission" (content "Rédige le rapport")
Et exitId "e-boucle" (content "Si complet renvoie TERMINER, sinon CONTINUE")
Et une politique chaque_prompt avec systemPrompt "Expert"
Quand le moteur prépare l'exécution via prepareRunContext
Alors adapter.buildCommand reçoit un assembledPrompt contenant dans l'ordre :
  "Expert", "Rédige le rapport", "Si complet renvoie TERMINER, sinon CONTINUE"
  séparés par "\n\n"

Étant donné le même bloc Run en cours d'exécution
Et un premier chunk stdout contenant le mot "TERMINER"
Quand d'autres chunks suivent puis le processus se termine avec code 0
Alors handle.stop() n'est jamais appelé suite au matching du mot-clé
Et le BlockMessage émis a value égal à l'intégralité des chunks accumulés
Et power vaut 1

Étant donné un bloc Run sans exitId
Quand le moteur prépare l'exécution
Alors le prompt assemblé ne contient aucun suffixe d'ordre de sortie
```

## Données

| Élément | Valeur |
|---|---:|
| `systemPrompt` | `"Expert"` |
| `prompt.content` | `"Rédige le rapport"` |
| `exit.content` | `"Si complet renvoie TERMINER, sinon CONTINUE"` |
| Chunk intermédiaire | `"... TERMINER ..."` |
| Code de sortie CLI | `0` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| `assembledPrompt` avec exit | `"Expert\n\nRédige le rapport\n\nSi complet renvoie TERMINER, sinon CONTINUE"` | R-07 / R-45 |
| Appels `handle.stop()` sur mot-clé | `0` | Fin naturelle uniquement (CR-012) |
| `BlockMessage.value` | Texte complet de tous les chunks | Payload Run (SPEC-ENG-03) |
| `assembledPrompt` sans exitId | `"Expert\n\nRédige le rapport"` | Pas de 3e segment |

## Ce que ce cas ne vérifie pas

- La pureté unitaire de `assemblePrompt` seule → `CASE-ENG-04-1` ;
- Les 3 politiques d'injection → `CASE-ENG-04-2` ;
- Le routage If sur `TERMINER` / `CONTINUE` → `CASE-ENG-03-3` ;
- Le schéma JSON de la ressource exit → `CASE-DATA-01-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_04_13_run_exit_prompt_assembly_and_natural_cli_completion`
**Fichier :** `tests/units/eng/CASE-ENG-04-13.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie l'assemblage `system + prompt + exit` transmis à `buildCommand`.
- [ ] Le test vérifie qu'aucun `stop()` n'est déclenché par un mot-clé en cours de streaming.
- [ ] Le test vérifie l'émission du payload complet après `onExit(0)`.
- [ ] Le test vérifie l'absence de suffixe exit lorsque `exitId` est omis.
- [ ] Le nom du test contient `CASE_ENG_04_13`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** Nouveau cas CR-012.
