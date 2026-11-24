# CASE-ADPT-06-2 — Résolution de `CLAUDE_CLI_BIN` et génération de commande `buildCommand`

**Spécification :** `SPEC-ADPT-06`  
**Critère d'acceptation :** `AC-ADPT-06-2`, `AC-ADPT-06-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

---

## Ce que ce cas protège

Le binaire du CLI Claude est résolu exclusivement à partir de la variable d'environnement `process.env.CLAUDE_CLI_BIN` via la fonction `resolveClaudeCliBin()` dans `src/lib/process/env/env.layout.ts` (`SPEC-ARCH-03` monopole I/O).  
Si cette variable est absente, vide, pointe vers un fichier inexistant ou non exécutable, une exception bloquante explicite en français doit être levée renvoyant vers `env/.env.example`.

Lorsque le binaire est valide, `ClaudeCLIAdapter.buildCommand(ctx)` doit construire les options de spawn :
1. `command` = chemin absolu résolu de `CLAUDE_CLI_BIN`.
2. En l'absence de `ctx.sessionId` (Run initial) :
   - `args` débute par `['--print', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--dangerously-skip-permissions']`.
   - Si `ctx.model` est fourni et non vide (après `trim()`), injection de `['--model', ctx.model.trim()]`.
   - Termine par `[ctx.assembledPrompt]`.
   - Aucun argument `--resume` ni `--session-id` n'est injecté.
3. En présence de `ctx.sessionId` (reprise de session conversationnelle) :
   - `args` débute par `['--resume', ctx.sessionId.trim(), '--print', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--dangerously-skip-permissions']`.
   - Si `ctx.model` est fourni et non vide (après `trim()`), injection de `['--model', ctx.model.trim()]`.
   - Termine par `[ctx.assembledPrompt]`.
4. Si `ctx.model` est absent ou composé d'espaces uniquement, aucun drapeau `--model` n'est injecté.
5. `cwd` = `ctx.workspacePath`.

---

## Cas

```gherkin
Étant donné la variable "CLAUDE_CLI_BIN" non définie ou vide
Quand "resolveClaudeCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que CLAUDE_CLI_BIN est obligatoire et manquante ou vide

Étant donné "CLAUDE_CLI_BIN" pointant vers un fichier inexistant "/bin/claude-inexistant"
Quand "resolveClaudeCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que le binaire est introuvable ou inexistant

Étant donné "CLAUDE_CLI_BIN" pointant vers un fichier sans droits d'exécution
Quand "resolveClaudeCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que le binaire n'est pas exécutable

Étant donné "CLAUDE_CLI_BIN" pointant vers "/opt/claude/bin/claude" valide
Et un contexte d'exécution initial avec :
  | champ           | valeur                    |
  | workspacePath   | "/home/user/project"      |
  | agentId         | "agent-claude"            |
  | assembledPrompt | "Analyse l'architecture"  |
Quand "adapter.buildCommand(ctx)" est appelé
Alors la commande générée est :
  | propriété | valeur attendue                                                                                                                                  |
  | command   | "/opt/claude/bin/claude"                                                                                                                         |
  | args      | ["--print", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--dangerously-skip-permissions", "Analyse l'architecture"] |
  | cwd       | "/home/user/project"                                                                                                                             |

Étant donné un contexte sans session avec model "sonnet"
Quand "adapter.buildCommand(ctx)" est appelé
Alors les args retournés contiennent ["--model", "sonnet"] placé avant le prompt assemblé

Étant donné un contexte de reprise avec sessionId "session_01j83abc123" et model "opus"
Quand "adapter.buildCommand(ctx)" est appelé
Alors les args retournés débutent par ["--resume", "session_01j83abc123"] suivis des drapeaux headless, de ["--model", "opus"] et du prompt

Étant donné un contexte avec model entouré d'espaces "  haiku  "
Quand "adapter.buildCommand(ctx)" est appelé
Alors le flag model injecté est ["--model", "haiku"] nettoyé des espaces

Étant donné un contexte avec model "   " et sessionId ""
Quand "adapter.buildCommand(ctx)" est appelé
Alors aucun argument "--model" n'est présent et aucun argument "--resume" n'est présent
```

---

## Données

| Élément | Valeur |
|---|---:|
| `CLAUDE_CLI_BIN` valide | `"/opt/claude/bin/claude"` (fichier existant avec droits d'exécution) |
| `CLAUDE_CLI_BIN` invalide | `undefined`, `""`, `"/bin/claude-inexistant"` |
| `ctx.workspacePath` | `"/home/user/project"` |
| `ctx.assembledPrompt` | `"Analyse l'architecture"` |
| `ctx.model` nominal | `"sonnet"` |
| `ctx.sessionId` nominal | `"session_01j83abc123"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Arguments commande initiale | `["--print", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--dangerously-skip-permissions", "Analyse l'architecture"]` | 1er Run sans session |
| Arguments commande avec modèle | `["--print", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--dangerously-skip-permissions", "--model", "sonnet", "Analyse l'architecture"]` | Insertion de `--model` |
| Arguments reprise de session | `["--resume", "session_01j83abc123", "--print", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--dangerously-skip-permissions", "--model", "opus", "Analyse l'architecture"]` | Insertion de `--resume` en tête |
| Diagnostic variable absente | Exception contenant `"CLAUDE_CLI_BIN"` et renvoyant vers `env/.env.example` | Arrêt fatal explicite |

---

## Ce que ce cas ne vérifie pas

- Le décodage du flux JSONL et l'épuration textuelle → `CASE-ADPT-06-3` ;
- L'énumération des modèles avec cache LRU → `CASE-ADPT-06-4` ;
- La capture dynamique de session au runtime d'un scénario → `CASE-ADPT-06-5`.

