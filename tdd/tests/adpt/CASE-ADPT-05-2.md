# CASE-ADPT-05-2 — Résolution de `CODEX_CLI_BIN` et génération de commande `buildCommand`

**Spécification :** `SPEC-ADPT-05`  
**Critère d'acceptation :** `AC-ADPT-05-2`, `AC-ADPT-05-3`  
**Type :** acceptation  
**Niveau de risque :** critique  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

---

## Ce que ce cas protège

Le binaire du CLI Codex est résolu exclusivement à partir de la variable d'environnement `process.env.CODEX_CLI_BIN` via la fonction `resolveCodexCliBin()` dans `src/lib/process/env/env.layout.ts` (`SPEC-ARCH-03` monopole I/O).  
Si cette variable est absente, vide, pointe vers un fichier inexistant ou non exécutable, une exception bloquante explicite en français doit être levée.

Lorsque le binaire est valide, `CodexCLIAdapter.buildCommand(ctx)` doit construire les options de spawn :
1. `command` = chemin absolu résolu de `CODEX_CLI_BIN`.
2. En l'absence de `ctx.sessionId` (Run initial) :
   - `args` débute par `['exec', '--json', '--dangerously-bypass-approvals-and-sandbox']`.
   - Si `ctx.model` est fourni et non vide (après `trim()`), injection de `['--model', ctx.model.trim()]`.
   - Termine par `[ctx.assembledPrompt]`.
3. En présence de `ctx.sessionId` (reprise de session) :
   - `args` débute par `['exec', 'resume', '--json', '--dangerously-bypass-approvals-and-sandbox']`.
   - Si `ctx.model` est fourni et non vide (après `trim()`), injection de `['--model', ctx.model.trim()]`.
   - Termine par `[ctx.sessionId.trim(), ctx.assembledPrompt]`.
4. Si `ctx.model` est absent ou composé d'espaces uniquement, aucun drapeau `--model` n'est injecté.
5. `cwd` = `ctx.workspacePath`.

---

## Cas

```gherkin
Étant donné la variable "CODEX_CLI_BIN" non définie ou vide
Quand "resolveCodexCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que CODEX_CLI_BIN est obligatoire et manquante ou vide

Étant donné "CODEX_CLI_BIN" pointant vers un fichier inexistant "/bin/codex-inexistant"
Quand "resolveCodexCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que le binaire est introuvable ou inexistant

Étant donné "CODEX_CLI_BIN" pointant vers un fichier sans droits d'exécution
Quand "resolveCodexCliBin()" est invoqué
Alors une erreur explicite est levée indiquant que le binaire n'est pas exécutable

Étant donné "CODEX_CLI_BIN" pointant vers "/opt/codex/bin/codex" valide
Et un contexte d'exécution initial avec :
  | champ           | valeur                  |
  | workspacePath   | "/home/user/project"    |
  | agentId         | "agent-codex"           |
  | assembledPrompt | "Crée le fichier index" |
Quand "adapter.buildCommand(ctx)" est appelé
Alors la commande générée est :
  | propriété | valeur attendue                                                                                  |
  | command   | "/opt/codex/bin/codex"                                                                           |
  | args      | ["exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "Crée le fichier index"]        |
  | cwd       | "/home/user/project"                                                                             |

Étant donné un contexte sans session avec model "gpt-5.6-luna"
Quand "adapter.buildCommand(ctx)" est appelé
Alors les args retournés sont ["exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", "gpt-5.6-luna", "Crée le fichier index"]

Étant donné un contexte de reprise avec sessionId "01a1c467-d234-7020-9cff-1d6cbdfeb8ca" et model "gpt-reserve"
Quand "adapter.buildCommand(ctx)" est appelé
Alors les args retournés sont ["exec", "resume", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", "gpt-reserve", "01a1c467-d234-7020-9cff-1d6cbdfeb8ca", "Crée le fichier index"]

Étant donné un contexte avec model entouré d'espaces "  gpt-reserve  "
Quand "adapter.buildCommand(ctx)" est appelé
Alors le flag model injecté est ["--model", "gpt-reserve"] nettoyé des espaces

Étant donné un contexte avec model "   " et sessionId ""
Quand "adapter.buildCommand(ctx)" est appelé
Alors aucun argument "--model" n'est présent et la commande utilise "exec" direct
```

---

## Données

| Élément | Valeur |
|---|---:|
| `CODEX_CLI_BIN` valide | `"/opt/codex/bin/codex"` (fichier existant avec `X_OK`) |
| `CODEX_CLI_BIN` invalide | `undefined`, `""`, `"/bin/codex-inexistant"` |
| `ctx.workspacePath` | `"/home/user/project"` |
| `ctx.assembledPrompt` | `"Crée le fichier index"` |
| `ctx.model` nominal | `"gpt-5.6-luna"` |
| `ctx.sessionId` nominal | `"01a1c467-d234-7020-9cff-1d6cbdfeb8ca"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Arguments commande initiale | `["exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "Crée le fichier index"]` | `exec` sans session |
| Arguments commande initiale avec modèle | `["exec", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", "gpt-5.6-luna", "Crée le fichier index"]` | Insertion de `--model` |
| Arguments reprise de session | `["exec", "resume", "--json", "--dangerously-bypass-approvals-and-sandbox", "--model", "gpt-reserve", "01a1c467-d234-7020-9cff-1d6cbdfeb8ca", "Crée le fichier index"]` | `exec resume` avec sessionId |
| Diagnostic variable absente | Exception contenant `"CODEX_CLI_BIN est obligatoire"` | Rejet précoce |

---

## Ce que ce cas ne vérifie pas

- L'interrogation de `codex debug models` → `CASE-ADPT-05-4` ;
- Le streaming en temps réel → `CASE-ADPT-05-3` ;
- L'amorce de session `createSession` → `CASE-ADPT-05-5`.

