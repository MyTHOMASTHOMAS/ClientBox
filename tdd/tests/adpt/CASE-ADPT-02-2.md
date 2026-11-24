# CASE-ADPT-02-2 — Génération de la commande de spawn `cursor-cli` avec reprise de session, prompt assemblé et répertoire de travail

**Spécification :** `SPEC-ADPT-02`
**Critère d'acceptation :** `AC-ADPT-02-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

La méthode `buildCommand` de l'adapter `cursor-cli` traduit le contexte d'exécution en arguments de spawn adaptés au binaire Cursor Agent (`REQ-029`, `R-03`, `R-28`, `ADR-003`). Elle lance une exécution non interactive (`-p`) **dans la session de scénario de l'agent** (`--resume <ctx.sessionId>`), injecte le prompt déjà assemblé (`ctx.assembledPrompt`) sans altération en dernier argument, et configure le répertoire de travail (`cwd`) sur `ctx.workspacePath`.

Sans `--resume`, chaque Run ouvrirait une conversation vierge : l'agent perdrait toute mémoire entre deux blocs, même sans ClearContext. Un `buildCommand` qui accepterait un contexte sans `sessionId` masquerait silencieusement ce défaut : il doit donc refuser.

## Cas

```gherkin
Étant donné la variable "CURSOR_CLI_BIN" égale à "/usr/local/bin/agent"
Et un contexte d'exécution avec :
  | champ           | valeur                                                  |
  | workspacePath   | "/var/projects/my-app"                                  |
  | agentId         | "agent-cursor"                                          |
  | sessionId       | "chat-123"                                              |
  | assembledPrompt | "Directives système\n\nRefactorise le composant Button" |
Quand "cursorAdapter.buildCommand(ctx)" est appelé
Alors l'objet retourné contient :
  | propriété | valeur attendue                                                                                                            |
  | command   | "/usr/local/bin/agent"                                                                                                     |
  | args      | ["-p", "--output-format", "json", "--resume", "chat-123", "Directives système\n\nRefactorise le composant Button"]         |
  | cwd       | "/var/projects/my-app"                                                                                                     |

Étant donné le même contexte sans "sessionId"
Quand "cursorAdapter.buildCommand(ctx)" est appelé
Alors une erreur explicite en français est levée (session absente)
```

## Données

| Élément | Valeur |
|---|---:|
| Binaire | `"/usr/local/bin/agent"` |
| `ctx.workspacePath` | `"/var/projects/my-app"` |
| `ctx.sessionId` | `"chat-123"` |
| `ctx.assembledPrompt` | `"Directives système\n\nRefactorise le composant Button"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| `command` | `"/usr/local/bin/agent"` | Issu de `process.env.CURSOR_CLI_BIN` |
| `cwd` | `"/var/projects/my-app"` | Issu de `ctx.workspacePath` |
| `args` | `["-p", "--output-format", "json", "--resume", "chat-123", <prompt intégral>]` | Égalité stricte du tableau (ordre compris) |
| `--print` / `--clear-context` dans `args` | absents | Syntaxe abandonnée |
| Contexte sans `sessionId` | erreur levée | Cas limite 4 SPEC-ADPT-02 |

## Ce que ce cas ne vérifie pas

- La vérification d'accessibilité de `CURSOR_CLI_BIN` → `CASE-ADPT-02-1` ;
- La création de la session (`create-chat`) → `CASE-ADPT-02-4` ;
- Le décodage du flux retour Cursor → `CASE-ADPT-02-3` ;
- L'arrêt d'un process actif → `CASE-ADPT-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_02_2_cursor_cli_command_generation_with_prompt_and_cwd`
**Fichier :** `tests/units/adpt/CASE-ADPT-02-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie que `command` correspond exactement à `CURSOR_CLI_BIN`.
- [ ] Le test vérifie que `cwd` correspond exactement à `workspacePath`.
- [ ] Le test vérifie l'égalité stricte de `args` avec `["-p", "--resume", sessionId, prompt]` (prompt multi-lignes intact).
- [ ] Le test vérifie qu'un contexte sans `sessionId` lève une erreur.
- [ ] Le test échoue si `--resume` est omis ou si le prompt est tronqué ou altéré.
- [ ] Le nom du test contient `CASE_ADPT_02_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** v2 (2026-11-03) — sessions de scénario via `--resume`.
