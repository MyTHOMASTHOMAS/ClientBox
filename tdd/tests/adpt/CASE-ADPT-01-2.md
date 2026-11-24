# CASE-ADPT-01-2 — Typage et transmission stricte du contexte d'exécution `ExecutionContext`

**Spécification :** `SPEC-ADPT-01`
**Critère d'acceptation :** `AC-ADPT-01-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le type `ExecutionContext` encapsule l'intégralité des paramètres d'exécution transmis par le moteur à l'adapter (`REQ-028`, `C-13`). Il contient obligatoirement `workspacePath` (répertoire racine du projet cible), `agentId` (identifiant de l'agent), `assembledPrompt` (chaîne de prompt complète assemblée en amont, `R-45`), le champ optionnel `sessionId` (session de scénario à reprendre, fournie par le runner, `SPEC-ADPT-03`), et le relais pass-through optionnel `cliOpaque` (`C-13`). Si l'un de ces champs manquait ou si `assembledPrompt` était altéré, le CLI s'exécuterait dans un mauvais dossier ou sans instructions complètes.

## Cas

```gherkin
Étant donné un contexte d'exécution instancié avec les champs :
  | champ           | valeur                                          |
  | workspacePath   | "/home/user/workspace/app"                      |
  | agentId         | "agent-backend"                                 |
  | assembledPrompt | "Directives système\n\nPrompt utilisateur test" |
  | sessionId       | "chat-abc-123"                                  |
  | cliOpaque       | { "customFlag": true }                          |
Quand le moteur transmet ce contexte à la méthode "buildCommand(ctx)"
Alors l'adapter accède à "ctx.workspacePath" pour définir le répertoire de travail
Et l'adapter injecte "ctx.assembledPrompt" tel quel sans re-concaténation
Et l'adapter transmet "ctx.sessionId" au CLI
Et l'adapter peut relayer les options spécifiques définies dans "ctx.cliOpaque"

Étant donné un contexte d'exécution sans le champ optionnel "cliOpaque"
Quand l'adapter traite ce contexte
Alors l'exécution réussit normalement en appliquant le comportement par défaut
```

## Données

| Élément | Valeur |
|---|---:|
| `workspacePath` | `"/home/user/workspace/app"` |
| `agentId` | `"agent-backend"` |
| `assembledPrompt` | `"Directives système\n\nPrompt utilisateur test"` |
| `sessionId` | `"chat-abc-123"` |
| `cliOpaque` (renseigné) | `{ customFlag: true }` |
| `cliOpaque` (omis) | `undefined` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Répertoire `cwd` résultant | `"/home/user/workspace/app"` | Mappé directement depuis `ctx.workspacePath` |
| Prompt exploité dans la commande | `"Directives système\n\nPrompt utilisateur test"` | Préservation intégrale de `ctx.assembledPrompt` (R-45) |
| Tolérance absence `cliOpaque` | `PASS` sans erreur | Cas limite 2 : champ optionnel traité par défaut |
| `sessionId` présent dans les arguments | `OUI` (`"chat-abc-123"`) | Reprise de session (SPEC-ADPT-02) |
| Persistance de `cliOpaque` / `sessionId` sur disque | `AUCUNE` | Pass-through en mémoire vive uniquement (C-13, SPEC-ADPT-03) |

## Ce que ce cas ne vérifie pas

- L'assemblage amont de `assembledPrompt` par le moteur → `CASE-ENG-04-1` ;
- La génération des flags spécifiques de `cursor-cli` → `CASE-ADPT-02-2` ;
- Le parsing des flux stream → `CASE-ADPT-01-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_01_2_execution_context_typing_and_propagation`
**Fichier :** `tests/tests-unitaires/adpt/case-adpt-01-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que `ExecutionContext` contient `workspacePath`, `agentId`, `assembledPrompt`, `sessionId` et `cliOpaque`.
- [ ] Le test vérifie que `sessionId` est transmis dans les arguments générés.
- [ ] Le test vérifie que `buildCommand` utilise `workspacePath` pour `cwd`.
- [ ] Le test vérifie que `assembledPrompt` n'est pas modifié lors de la construction des arguments.
- [ ] Le test valide le comportement sans erreur lorsque `cliOpaque` est absent (`undefined`).
- [ ] Le test échoue si `assembledPrompt` est ré-assemblé ou tronqué.
- [ ] Le nom du test contient `CASE_ADPT_01_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
