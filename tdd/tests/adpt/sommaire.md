# Sommaire des cas de test — Domaine ADPT (Adapters CLI & cursor-cli)

**Domaine :** `ADPT`  
**Document maître des spécifications :** [`tdd/specs/ADPT.md`](../../specs/ADPT.md)  
**ADR d'ancrage :** [`ADR-002`](../../docs/adr/ADR-002-contrat-adapter.md), [`ADR-003`](../../docs/adr/ADR-003-adapter-cursor-cli.md)  
**Référentiel CDC :** `tdd/docs/cdc/cahier-des-charges-v1.md` (statut §12 verrouillé)  

---

## 1. Spécifications couvertes

- [`SPEC-ADPT-01`](../../specs/ADPT.md#spec-adpt-01--contrat-dadapter-typescript-et-typage-des-flux-dévénements) — Contrat d'adapter TypeScript et typage des flux d'événements (`REQ-027`, `REQ-028`, `REQ-103`, `R-18`, `R-27`, `R-28`, `R-29`, `C-01`, `C-12`, `C-13`, `Annexe D.1`)
- [`SPEC-ADPT-02`](../../specs/ADPT.md#spec-adpt-02--spécialisation-opérationnelle-cursor-cli) — Spécialisation opérationnelle cursor-cli (`REQ-008`, `REQ-013`, `REQ-029`, `REQ-031`, `REQ-112`, `R-03`, `R-04`, `R-28`, `R-38`, `R-40`, `C-12`)
- [`SPEC-ADPT-03`](../../specs/ADPT.md#spec-adpt-03--cycle-de-vie-du-processus-stop-manuel-et-clearcontext-obligatoire) — Cycle de vie du processus, Stop manuel et sessions de scénario (`REQ-020`, `REQ-022`, `REQ-025`, `R-23`, `R-24`, `R-32`, `R-33`, `R-34`, `R-39`, `REQ-101`)
- [`SPEC-ADPT-04`](../../specs/ADPT.md#spec-adpt-04--spécialisation-opérationnelle-antigravity-cli) — Spécialisation opérationnelle Antigravity CLI (`REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-28`, `R-38`, `C-12`)
- [`SPEC-ADPT-05`](../../specs/ADPT.md#spec-adpt-05--spécialisation-opérationnelle-codex-cli) — Spécialisation opérationnelle Codex CLI (`REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-28`, `R-38`, `C-12`)
- [`SPEC-ADPT-06`](../../specs/ADPT.md#spec-adpt-06--spécialisation-opérationnelle-claude-cli) — Spécialisation opérationnelle Claude CLI (`REQ-008`, `REQ-013`, `REQ-027`, `REQ-028`, `REQ-029`, `REQ-031`, `R-03`, `R-04`, `R-18`, `R-28`, `R-38`, `R-40`, `C-12`)

---

## 2. Tableau d'indexation des Cas de Test

| numéro | testfile | description rapide | clause / exigence spec liée |
|---|---|---|---|
| 01-1 | `CASE-ADPT-01-1.md` | Conformité du contrat TypeScript de l'interface `CLIAdapter` (`buildCommand`, `parseStreamLine`, `createSession` optionnel ; `clearContext` retiré) | `SPEC-ADPT-01`, `AC-ADPT-01-1`, `REQ-027`, `R-18`, `R-27` |
| 01-2 | `CASE-ADPT-01-2.md` | Typage et transmission stricte du contexte d'exécution `ExecutionContext` (`workspacePath`, `agentId`, `assembledPrompt`, `sessionId`, `cliOpaque`) | `SPEC-ADPT-01`, `AC-ADPT-01-2`, `REQ-028`, `R-45`, `C-13` |
| 01-3 | `CASE-ADPT-01-3.md` | Normalisation robuste de toute ligne de sortie texte brute en `AgentStreamEvent` typé (`stdout`, `stderr`, `exit`, `error`) | `SPEC-ADPT-01`, `AC-ADPT-01-3`, `REQ-103`, `R-29`, `C-01` |
| 01-4 | `CASE-ADPT-01-4.md` | Registre dynamique des adapters CLI et énumération opérationnelle (`SVC-003`) | `SPEC-ADPT-01`, `SPEC-ADPT-02`, `AC-ADPT-01-1`, `AC-ADPT-02-1` |
| 02-1 | `CASE-ADPT-02-1.md` | Validation de l'existence et de l'exécutabilité de la variable d'environnement obligatoire `CURSOR_CLI_BIN` avant toute exécution | `SPEC-ADPT-02`, `AC-ADPT-02-1`, `REQ-031`, `REQ-112`, `R-38` |
| 02-2 | `CASE-ADPT-02-2.md` | Commande `cursor-cli` `-p --resume <sessionId> <prompt>`, `cwd`, refus sans `sessionId` | `SPEC-ADPT-02`, `AC-ADPT-02-2`, `REQ-029`, `R-03`, `R-28` |
| 02-3 | `CASE-ADPT-02-3.md` | Décodage et extraction des lignes de flux stream produites par le binaire Cursor vers `AgentStreamEvent` | `SPEC-ADPT-02`, `AC-ADPT-02-3`, `REQ-013`, `REQ-103`, `R-40` |
| 02-4 | `CASE-ADPT-02-4.md` | `createSession` : `create-chat`, lecture de l'identifiant, rejet sur échec | `SPEC-ADPT-02`, `AC-ADPT-02-4`, `ADR-003` |
| 02-5 | `CASE-ADPT-02-5.md` | Commande `cursor-cli` avec `--model <id>` optionnel et énumération `listModels` | `SPEC-ADPT-02`, `AC-ADPT-02-5`, `REQ-029` |
| 03-1 | `CASE-ADPT-03-1.md` | Stop manuel : kill du processus (SIGTERM/SIGKILL) sans créer ni supprimer de session | `SPEC-ADPT-03`, `AC-ADPT-03-1`, `REQ-022`, `REQ-025`, `R-23`, `R-24`, `R-34` |
| 03-2 | `CASE-ADPT-03-2.md` | Session de scénario réutilisée entre Runs du même agent, renouvelée après ClearContext (via `SVC-001`) | `SPEC-ADPT-03`, `SPEC-ENG-03`, `AC-ADPT-03-2`, `REQ-020`, `R-39` |
| 03-3 | `CASE-ADPT-03-3.md` | Sessions propres à l'exécution, non persistées, création unique en fan-out | `SPEC-ADPT-03`, `AC-ADPT-03-3`, `REQ-101`, `R-32`, `R-33` |
| 03-4 | `CASE-ADPT-03-4.md` | ClearContext n'interrompt pas un Run en cours du même agent (Clear ≠ Stop) | `SPEC-ADPT-03`, `SPEC-ENG-03`, `AC-ADPT-03-2`, `AC-ENG-03-4` |
| 03-5 | `CASE-ADPT-03-5.md` | Nettoyage et non-prolifération des sous-processus CLI orphelins en cas d'interruption du serveur | `SPEC-ADPT-03`, `SPEC-SRV-01`, `AC-ADPT-03-1`, `AC-SRV-01-3`, `ADR-002` |
| 03-6 | `CASE-ADPT-03-6.md` | CallScenario : table de sessions isolée du sous-runner (même `agentId` ⇒ `sessionId` distincts) | `SPEC-ADPT-03`, `SPEC-ENG-03`, `AC-ADPT-03-4`, `REQ-040`, `ADR-018` |
| 04-1 | `CASE-ADPT-04-1.md` | Conformité du contrat TypeScript `CLIAdapter` pour `AntigravityCLIAdapter` (`cliId = 'antigravity'`, `buildCommand`, `parseStreamLine`, `listModels`) | `SPEC-ADPT-04`, `AC-ADPT-04-1`, `REQ-027` |
| 04-2 | `CASE-ADPT-04-2.md` | Validation de la variable `ANTIGRAVITY_CLI_BIN` via `resolveAntigravityCliBin` et génération de commande `buildCommand` (`--print`, `--model`, `--conversation`, cwd) | `SPEC-ADPT-04`, `AC-ADPT-04-2`, `AC-ADPT-04-3`, `REQ-029`, `REQ-031` |
| 04-3 | `CASE-ADPT-04-3.md` | Décodage et normalisation robuste des flux `parseStreamLine` (`step_update.text_delta`, `result.response`, JSON, texte brut sans exception) | `SPEC-ADPT-04`, `AC-ADPT-04-4`, `REQ-103` |
| 04-4 | `CASE-ADPT-04-4.md` | Énumération et parsing des modèles via `listModels` (interrogation `agy models`, format tabulaire, exclusion des lignes préliminaires, fallback résilient) | `SPEC-ADPT-04`, `AC-ADPT-04-5`, `REQ-013` |
| 04-6 | `CASE-ADPT-04-6.md` | Création de session conversationnelle Antigravity par amorce stream-json (`ping`) avec early-kill et réutilisation multi-runs | `SPEC-ADPT-04`, `SPEC-ADPT-03`, `AC-ADPT-04-6`, `AC-ADPT-03-2`, `REQ-020` |
| 05-1 | `CASE-ADPT-05-1.md` | Conformité du contrat TypeScript `CLIAdapter` pour `CodexCLIAdapter` (`cliId = 'codex-cli'`, `buildCommand`, `parseStreamLine`, `listModels`, `createSession`) | `SPEC-ADPT-05`, `AC-ADPT-05-1`, `REQ-027` |
| 05-2 | `CASE-ADPT-05-2.md` | Validation de la variable `CODEX_CLI_BIN` via `resolveCodexCliBin` et génération de commande `buildCommand` (`exec`, `exec resume`, `--json`, `--model`, cwd) | `SPEC-ADPT-05`, `AC-ADPT-05-2`, `AC-ADPT-05-3`, `REQ-029`, `REQ-031` |
| 05-3 | `CASE-ADPT-05-3.md` | Décodage et normalisation robuste des flux `parseStreamLine` (`item.completed`, `agent_message`, texte brut sans exception) | `SPEC-ADPT-05`, `AC-ADPT-05-4`, `REQ-103` |
| 05-4 | `CASE-ADPT-05-4.md` | Énumération et parsing des modèles via `listModels` (interrogation `codex debug models`, extraction JSON slug, cache LRU, fallback `[]`) | `SPEC-ADPT-05`, `AC-ADPT-05-5`, `REQ-013` |
| 05-5 | `CASE-ADPT-05-5.md` | Création de session conversationnelle Codex par amorce stream-json (`ping`) avec capture de `thread_id` et réutilisation multi-runs | `SPEC-ADPT-05`, `SPEC-ADPT-03`, `AC-ADPT-05-6`, `AC-ADPT-03-2`, `REQ-020` |
| 06-1 | `CASE-ADPT-06-1.md` | Conformité du contrat TypeScript `CLIAdapter` pour `ClaudeCLIAdapter` (`cliId = 'claude-cli'`, `buildCommand`, `parseStreamLine`, `listModels`, `createSession`, `extractSessionId`) | `SPEC-ADPT-06`, `AC-ADPT-06-1`, `REQ-027` |
| 06-2 | `CASE-ADPT-06-2.md` | Validation de la variable `CLAUDE_CLI_BIN` via `resolveClaudeCliBin` et génération de commande `buildCommand` (`--print`, `stream-json`, `--verbose`, `--include-partial-messages`, `--dangerously-skip-permissions`, `--model`, `--resume`, cwd) | `SPEC-ADPT-06`, `AC-ADPT-06-2`, `AC-ADPT-06-3`, `REQ-029`, `REQ-031` |
| 06-3 | `CASE-ADPT-06-3.md` | Décodage et normalisation robuste des flux `parseStreamLine` (`stream_event`, `content_block_delta`, `assistant`, texte brut) et épuration textuelle `parseOutput` | `SPEC-ADPT-06`, `AC-ADPT-06-4`, `AC-ADPT-06-6`, `REQ-103` |
| 06-4 | `CASE-ADPT-06-4.md` | Énumération des modèles supportés via `listModels` (alias officiels Claude, cache LRU, fallback `[]`) | `SPEC-ADPT-06`, `AC-ADPT-06-5`, `REQ-013` |
| 06-5 | `CASE-ADPT-06-5.md` | Gestion de session conversationnelle Claude au premier Run sans amorce ping (`extractSessionId`) et reprise multi-runs (`--resume`) | `SPEC-ADPT-06`, `SPEC-ADPT-03`, `AC-ADPT-06-7`, `AC-ADPT-03-2`, `REQ-020` |
