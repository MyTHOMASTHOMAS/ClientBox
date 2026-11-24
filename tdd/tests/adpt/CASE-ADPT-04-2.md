# CASE-ADPT-04-2 — Résolution de `ANTIGRAVITY_CLI_BIN` et génération de commande `buildCommand`

**Spécification :** `SPEC-ADPT-04`  
**Critère d'acceptation :** `AC-ADPT-04-2`, `AC-ADPT-04-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

---

## Ce que ce cas protège

Le binaire du CLI Antigravity est résolu exclusivement à partir de la variable d'environnement `process.env.ANTIGRAVITY_CLI_BIN` via la fonction `resolveAntigravityCliBin()` dans `src/lib/process/env/env.layout.ts` (`SPEC-ARCH-03` monopole I/O).  
Si cette variable est absente, vide, pointe vers un fichier inexistant ou non exécutable, une exception bloquante explicite en français doit être levée.

Lorsque le binaire est valide, `AntigravityCLIAdapter.buildCommand(ctx)` doit construire les options de spawn :
1. `command` = chemin absolu résolu de `ANTIGRAVITY_CLI_BIN`.
2. `args` = drapeau obligatoire `--print <assembledPrompt>`.
3. Si `ctx.model` est fourni et non vide (après `trim()`), injection de `['--model', ctx.model.trim()]` avant `--print`.
4. Si `ctx.sessionId` est fourni et non vide (après `trim()`), injection de `['--conversation', ctx.sessionId.trim()]` avant `--print`.
5. Si `ctx.model` ou `ctx.sessionId` sont absents ou composés d'espaces blancs uniquement, aucun flag `--model` ni `--conversation` n'est injecté.
6. `cwd` = `ctx.workspacePath`.

---

## Cas

```gherkin
Étant donné la variable "ANTIGRAVITY_CLI_BIN" non définie ou vide
Quand "resolveAntigravityCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que ANTIGRAVITY_CLI_BIN est obligatoire et manquante ou vide

Étant donné "ANTIGRAVITY_CLI_BIN" pointant vers un fichier inexistant "/bin/agy-inexistant"
Quand "resolveAntigravityCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que le binaire est introuvable ou inexistant

Étant donné "ANTIGRAVITY_CLI_BIN" pointant vers un fichier sans droits d'exécution
Quand "resolveAntigravityCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que le binaire n'est pas exécutable

Étant donné "ANTIGRAVITY_CLI_BIN" pointant vers "/opt/agy/bin/agy" valide
Et un contexte d'exécution avec :
  | champ           | valeur                  |
  | workspacePath   | "/home/user/project"    |
  | agentId         | "agent-1"               |
  | assembledPrompt | "Crée le fichier index" |
Quand "adapter.buildCommand(ctx)" est appelé
Alors la commande générée est :
  | propriété | valeur attendue                                                                              |
  | command   | "/opt/agy/bin/agy"                                                                           |
  | args      | ["--dangerously-skip-permissions", "--output-format", "stream-json", "--print", "Crée le fichier index"] |
  | cwd       | "/home/user/project"                                                                         |

Étant donné un contexte avec model "test-model-custom" et sessionId "conv-abc-123"
Quand "adapter.buildCommand(ctx)" est appelé
Alors les args retournés sont ["--dangerously-skip-permissions", "--output-format", "stream-json", "--model", "test-model-custom", "--conversation", "conv-abc-123", "--print", "Crée le fichier index"]

Étant donné un contexte avec model entouré d'espaces "  test-model-spaced  "
Quand "adapter.buildCommand(ctx)" est appelé
Alors le flag model injecté est ["--dangerously-skip-permissions", "--output-format", "stream-json", "--model", "test-model-spaced"] nettoyé des espaces

Étant donné un contexte avec model "   " et sessionId ""
Quand "adapter.buildCommand(ctx)" est appelé
Alors aucun argument "--model" ni "--conversation" n'est présent
Et "--dangerously-skip-permissions" et "--print" sont présents
```

---

## Données

| Élément | Valeur |
|---|---:|
| `ANTIGRAVITY_CLI_BIN` valide | `"/opt/agy/bin/agy"` (fichier existant avec `X_OK`) |
| `ANTIGRAVITY_CLI_BIN` invalide | `undefined`, `""`, `"/bin/agy-inexistant"` |
| `ctx.workspacePath` | `"/home/user/project"` |
| `ctx.assembledPrompt` | `"Crée le fichier index"` |
| `ctx.model` nominal | `"test-model-custom"` |
| `ctx.sessionId` nominal | `"conv-abc-123"` |
| `ctx.model` avec espaces | `"  test-model-spaced  "` |
| `ctx.model` vide | `""`, `"   "`, `undefined` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Arguments commande minimale | `["--dangerously-skip-permissions", "--output-format", "stream-json", "--print", "Crée le fichier index"]` | `--dangerously-skip-permissions` + `--output-format stream-json` + `--print` + prompt |
| Arguments avec modèle et session | `["--dangerously-skip-permissions", "--output-format", "stream-json", "--model", "test-model-custom", "--conversation", "conv-abc-123", "--print", "Crée le fichier index"]` | Insertion ordonnée des flags |
| Arguments avec modèle espacé | `["--dangerously-skip-permissions", "--output-format", "stream-json", "--model", "test-model-spaced", "--print", "Crée le fichier index"]` | Nettoyage `trim()` |
| Arguments sans modèle ni session | `["--dangerously-skip-permissions", "--output-format", "stream-json", "--print", "Crée le fichier index"]` | Drapeaux headless sans options model/session |
| Diagnostic variable absente | Exception contenant `"ANTIGRAVITY_CLI_BIN est obligatoire"` | Rejet précoce |

---

## Ce que ce cas ne vérifie pas

- L'interrogation de `agy models` → `CASE-ADPT-04-4` ;
- Le streaming en temps réel → `CASE-ADPT-04-3`.

