# Analyse d'impact — CR-006 (Intégration de l'adaptateur CLI Codex `codex-cli`)

**Demande du client :** Adapter un nouveau CLI au sein de ClientsBox : le CLI Codex (`codex-cli`), en répliquant rigoureusement l'architecture et les conventions établies pour l'adaptateur Antigravity CLI (`SPEC-ADPT-04`), selon la méthodologie stricte TDD (Doc $\rightarrow$ Cases $\rightarrow$ Tests $\rightarrow$ Code).  
**Reçue le :** 10/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `feat/codex-cli-adapter`  

---

> **Règle fondamentale TDD :**
> Interdiction de modifier le code de production avant la validation de la documentation de spécification et l'écriture des tests unitaires rouges.  
> La chaîne descend impérativement : CDC $\rightarrow$ Specs $\rightarrow$ Signatures & Architecture $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.

---

## 1. Ce que le client demande, reformulé

ClientsBox intègre actuellement deux adaptateurs opérationnels : `cursor-cli` (`SPEC-ADPT-02`) et `antigravity` (`SPEC-ADPT-04`).  
Le client demande d'ajouter le support opérationnel du **CLI Codex** (`codex` / `codex.exe`) selon le même pattern technique que l'adaptateur Antigravity pour permettre :
1. **L'exécution de blocs Run avec le moteur Codex :** L'agent configuré avec `cliId = 'codex-cli'` délègue ses exécutions à `codex.exe`.
2. **La résolution sécurisée du binaire :** Résolution exclusive via variable d'environnement `CODEX_CLI_BIN`, sans fallback sur le PATH système (`SPEC-ARCH-03`).
3. **La construction non interactive des commandes (`buildCommand`) :**
   - Mode initial (sans session) : `codex exec --json --dangerously-bypass-approvals-and-sandbox [--model <id>] <assembledPrompt>`.
   - Mode reprise de session : `codex exec resume --json --dangerously-bypass-approvals-and-sandbox [--model <id>] <sessionId> <assembledPrompt>`.
4. **Le décodage résilient du flux de streaming (`parseStreamLine`) et la normalisation stricte de la sortie (`parseOutput`) :**
   - Normalisation des sorties JSONL émettant les événements (`item.completed` avec `agent_message`, `turn.started`, `turn.completed`), ainsi que des sorties brutes sur stdout, sans jamais lever d'exception.
   - Extraction stricte de la réponse agent (`parseOutput`) : épuration totale des métadonnées JSON pour que le SAC, les blocs `If` et les conditions de sortie reçoivent exclusivement le texte produit par l'IA. Pour `cursor-cli` et `antigravity`, `parseOutput` fonctionne en pass-through transparent.
5. **La capture dynamique de session conversationnelle au 1er Run (`extractSessionId`) :**
   - Suppression du `ping` d'amorçage préalable et économie de ~28k tokens par session.
   - Capture de `thread_id` dès la ligne 1 (`thread.started`) du premier Run réel avec son prompt utilisateur.
   - Enregistrement immédiat dans `ScenarioSessionRegistry` et réutilisation fluide sur les Runs subséquents via `codex exec resume <thread_id>`. Invalidation propre sur `ClearContext`.
6. **La découverte et l'énumération des modèles (`listModels`) :** Interrogation dynamique de `codex debug models`, extraction JSON de la liste des slugs de modèles, mise en cache mémoire LRU multi-domaines avec TTL (ADR-016) et tableau de repli `[]` en cas d'erreur.
7. **L'intégration dans l'IHM et l'écosystème :** Enregistrement dans `AdapterRegistryService`, proposition de l'option `Codex CLI` (`codex-cli`) dans le formulaire modal d'agent.

---

## 2. Bilan de l'exploration technique directe du binaire `codex.exe`

Des tests exploratoires directs dans le terminal hôte sur `C:\Users\Autrement\AppData\Local\Programs\OpenAI\Codex\bin\codex.exe` ont permis de caractériser précisément le comportement du binaire :

| Composant / Comportement | Constat technique dans le terminal | Décision d'ingénierie ClientsBox |
|---|---|---|
| **Identifiant d'adaptateur (`cliId`)** | Version `codex-cli 0.167.0` rapportée par `codex --version`. | `cliId = 'codex-cli'` sur l'instance `CodexCLIAdapter`. |
| **Résolution du binaire** | Binaire présent dans l'AppData local utilisateur. | Variable d'environnement dédiée `process.env.CODEX_CLI_BIN`, résolue par `resolveCodexCliBin()` dans `src/lib/process/env-resolver.ts` (conforme `SPEC-ARCH-03`). |
| **Timeout d'amorce** | Délai de garde paramétrable pour l'amorce de session. | Variable d'environnement `CODEX_PROBE_TIMEOUT_MS` avec valeur par défaut 15 000 ms. |
| **Exécution non interactive** | `codex exec --json --dangerously-bypass-approvals-and-sandbox "<prompt>"` exécute le prompt sans interaction humaine. | `buildCommand` utilise systématiquement ces drapeaux pour le premier Run sans session. |
| **Modèle d'IA** | Flag `-m <model>` ou `--model <model>` supporté. | Injection conditionnelle de `--model <ctx.model.trim()>` lorsque `ctx.model` est fourni et non vide. |
| **Reprise de session** | `codex exec resume --json --dangerously-bypass-approvals-and-sandbox <thread_id> "<prompt>"` reprend le fil. | Si `ctx.sessionId` est présent, `buildCommand` génère la sous-commande `resume` avec `ctx.sessionId`. |
| **Amorce et capture de session** | Le tout premier événement émis sur stdout est `{"type":"thread.started","thread_id":"<UUID>"}`. | `probeCodexSession` lance une amorce, capture le `thread_id` dès la première ligne via `extractCodexSessionId`, et résout la promesse. |
| **Énumération des modèles** | `codex debug models` imprime un JSON contenant `{"models":[{"slug":"gpt-reserve",...}]}`. | `listModels()` exécute `codex debug models`, extrait les slugs, les met en cache LRU/TTL, et replie sur `[]` en cas d'erreur. |
| **Format du flux** | Format JSONL avec événements `thread.started`, `turn.started`, `item.completed`. | `parseStreamLine` extrait `item.text` si `item.type === 'agent_message'`, sinon repli universel `{ type: 'stdout', chunk: line }`. |

---

## 3. Impact — Cahier des charges (CDC v2)

| Exigence | Statut | Impact & Justification |
|---|---|---|
| `REQ-008` (Sélection de l'adaptateur par agent) | **Complétée** | Un agent peut être associé à l'adaptateur `codex-cli` en plus de `cursor-cli` et `antigravity`. |
| `REQ-013` (Menu d'adaptateurs opérationnels) | **Complétée** | `AdapterRegistryService` fournit désormais les adaptateurs opérationnels `cursor-cli`, `antigravity` et `codex-cli`. |
| `REQ-027` (Interface `CLIAdapter` polymorphe) | **Conforme** | `CodexCLIAdapter` implémente rigoureusement le contrat d'interface `CLIAdapter`. |
| `REQ-029` (Génération des commandes CLI de spawn) | **Complétée** | `CodexCLIAdapter.buildCommand` produit la commande spécifique à Codex (`exec`, `exec resume`, `--json`, `--model`). |
| `REQ-031` (Résolution des binaires CLI par variable d'environnement) | **Complétée** | `CODEX_CLI_BIN` garantit l'isolation et la configurabilité étanche de l'exécutable Codex. |

---

## 4. Impact — Spécifications fonctionnelles

| Fichier de spécification | Nature de l'impact | Description précise des modifications |
|---|---|---|
| [`tdd/specs/ADPT.md`](../specs/ADPT.md) | **Ajout** | Création de **`SPEC-ADPT-05 — Spécialisation opérationnelle Codex CLI`** avec critères `AC-ADPT-05-1` à `AC-ADPT-05-5`. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Mise à jour** | Indexation de `SPEC-ADPT-05` dans le catalogue du domaine `ADPT` (29 spécifications au total). |
| [`tdd/specs/UI.md`](../specs/UI.md) | **Mise à jour** | Ajout de l'adaptateur `codex-cli` dans les options sélectionnables du formulaire agent (`AgentFormModal`). |

---

## 5. Impact — Conception & Architecture technique

```text
src/
├── lib/
│   ├── process/
│   │   └── env-resolver.ts                   # Ajout: resolveCodexCliBin(), resolveCodexProbeTimeout()
│   └── adapters/
│       ├── cursor-cli.adapter.ts             # [LIB-006] Inchangé
│       ├── antigravity-cli.adapter.ts        # [LIB-016] Inchangé
│       ├── codex-cli.adapter.ts              # [LIB-020] Nouveau: CodexCLIAdapter
│       ├── codex-session.helper.ts           # [LIB-021] Nouveau: probeCodexSession()
│       └── codex-session-extractor.helper.ts # [LIB-022] Nouveau: extractCodexSessionId()
├── services/
│   └── adapter-registry.service.ts           # Prise en charge transparente de CodexCLIAdapter
├── ui/
│   └── components/agents/
│       └── agent-form-modal.tsx              # Ajout de l'option <option value="codex-cli">Codex CLI</option>
└── index.ts                                  # Enregistrement de CodexCLIAdapter dans createServices()
```

### 5.1 Monopole I/O & Isolation de l'Environnement (`SPEC-ARCH-03`)
- `resolveCodexCliBin()` réside exclusivement dans `src/lib/process/env-resolver.ts`.
- Elle lit `process.env.CODEX_CLI_BIN`. Si la variable est absente ou vide, ou si le fichier est introuvable ou non exécutable, elle lève une erreur explicite en français.
- `resolveCodexProbeTimeout()` lit `process.env.CODEX_PROBE_TIMEOUT_MS` (défaut : 15 000 ms).

### 5.2 Contrat `CodexCLIAdapter` (`SPEC-ADPT-05`)
- Implémente `CLIAdapter` (`src/types/contracts/cli-adapter.contract.ts`).
- `cliId = 'codex-cli'`.
- `buildCommand(ctx: ExecutionContext)` :
  - `command` résolu via `resolveCodexCliBin()`.
  - Si `ctx.sessionId` est fourni : sous-commande `resume` avec arguments `['exec', 'resume', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(ctx.model ? ['--model', ctx.model.trim()] : []), ctx.sessionId, ctx.assembledPrompt]`.
  - Si `ctx.sessionId` est absent : arguments `['exec', '--json', '--dangerously-bypass-approvals-and-sandbox', ...(ctx.model ? ['--model', ctx.model.trim()] : []), ctx.assembledPrompt]`.
  - `cwd = ctx.workspacePath`.
- `parseStreamLine(line: string)` :
  - Décode JSONL : si `record.type === 'item.completed'` et `record.item.type === 'agent_message'`, extrait `record.item.text`.
  - Repli universel sans exception : `{ type: 'stdout', chunk: line }`.
- `parseOutput(rawOutput: string)` :
  - Parse l'ensemble du flux accumulé JSONL et isole strictement le texte de réponse écrit par l'agent (`item.text`), éliminant toute pollution de structure JSON pour le SAC et les blocs avals.
- `extractSessionId(line: string)` :
  - Capture paresseuse au premier Run : extrait `thread_id` depuis la ligne 1 (`thread.started`) pour le sauvegarder dans la table de session du scénario sans aucune amorce `ping` préalable.
- `listModels()` :
  - Exécute `resolveCodexCliBin()` avec `['debug', 'models']` via `runCliCommand`.
  - Parse le JSON, extrait `slug` du tableau `models`, mémorise en cache LRU/TTL Node.js, repli `[]` en cas d'erreur.

---

## 6. Impact — Tests & Fiches CASE TDD

1. **Fiches CASE TDD à créer sous `tdd/tests/adpt/` :**
   - `CASE-ADPT-05-1.md` : Contrat TypeScript et identifiant `cliId = 'codex-cli'`.
   - `CASE-ADPT-05-2.md` : Résolution d'environnement `CODEX_CLI_BIN` et génération de commande `buildCommand` (normal et resume).
   - `CASE-ADPT-05-3.md` : Décodage résilient des flux dans `parseStreamLine`.
   - `CASE-ADPT-05-4.md` : Énumération et parsing des modèles via `listModels()` avec cache LRU.
   - `CASE-ADPT-05-5.md` : Amorce de session `createSession` et réutilisation de session inter-runs.
2. **Fichiers de tests automatisés (Phase Rouge) :**
   - `tests/units/adpt/CASE-ADPT-05-1.test.ts`
   - `tests/units/adpt/CASE-ADPT-05-2.test.ts`
   - `tests/units/adpt/CASE-ADPT-05-3.test.ts`
   - `tests/units/adpt/CASE-ADPT-05-4.test.ts`
   - `tests/units/adpt/CASE-ADPT-05-5.test.ts`
3. **Mise à jour des tests d'architecture & d'intégration :**
   - `tests/units/arch/case-arch-08-1.test.ts` : seuil porté à 163 modules.

---

## 7. Plan séquentiel TDD par étapes

1. **Étape 1 (actuelle) : Documentation & Spécifications**
   - Étude d'impact validée (`impact-CR-006-codex-cli-adapter.md`).
   - Spécification détaillée `SPEC-ADPT-05` dans `tdd/specs/ADPT.md`.
   - Indexation dans `tdd/specs/sommaire.md` et `tdd/specs/UI.md`.
   - Documentation utilisateur et déploiement (`.env.example`, `configuration.md`, `agents.md`, `depannage.md`).
   - Signatures d'architecture (`signature-lib.md`, `signature.md`, `case-arch-08-1.test.ts`).
2. **Étape 2 : Fiches de cas de test TDD**
   - Rédaction de `CASE-ADPT-05-1.md` à `CASE-ADPT-05-5.md`.
   - Indexation dans `tdd/tests/adpt/sommaire.md` et `tdd/tests/sommaire.md`.
3. **Étape 3 : Tests unitaires rouges**
   - Écriture des tests Vitest dans `tests/units/adpt/CASE-ADPT-05-*.test.ts`.
4. **Étape 4 : Implémentation du code source**
   - Création de `codex-session-extractor.helper.ts`, `codex-session.helper.ts`, `codex-cli.adapter.ts`.
   - Ajout de `resolveCodexCliBin` et `resolveCodexProbeTimeout` dans `env-resolver.ts`.
   - Enregistrement dans `index.ts` et `agent-form-modal.tsx`.
5. **Étape 5 : Refactoring & Portes Qualité**
   - Validation `npm run quality`, tests d'architecture, tests unitaires, E2E et build.

