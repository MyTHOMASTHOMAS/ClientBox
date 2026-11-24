# Analyse d'impact — CR-013 (Intégration de l'adaptateur Claude CLI `claude-cli`)

**Demande du client :** Adapter un nouveau CLI au sein de ClientsBox : le CLI Claude (`claude` / Claude Code version 2.1+), en répliquant rigoureusement l'architecture et les conventions établies pour les adaptateurs existants (`cursor-cli`, `antigravity`, `codex-cli`), selon la méthodologie stricte TDD (Doc $\rightarrow$ Cases $\rightarrow$ Tests $\rightarrow$ Code).  
**Entretien source :** [`tdd/docs/cr/CR-005.md`](../cr/CR-005.md) (Questions `CR-05/Q01` à `CR-05/Q10`)  
**Reçue le :** 23/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `add-claude-cli`  

---

> **Règle fondamentale TDD :**  
> Interdiction formelle de modifier le code de production avant la validation de la chaîne de spécification et l'écriture des tests unitaires rouges.  
> La chaîne descend impérativement : **CR $\rightarrow$ Analyse d'impact $\rightarrow$ CDC $\rightarrow$ Spécifications $\rightarrow$ Signatures & Architecture $\rightarrow$ Fiches CASE $\rightarrow$ Tests unitaires automatisés (ROUGE) $\rightarrow$ Code de production (VERT) $\rightarrow$ Refactoring & CI.**

---

## 1. Ce que le client demande, reformulé

ClientsBox intègre actuellement trois adaptateurs opérationnels : `cursor-cli` (`SPEC-ADPT-02`), `antigravity` (`SPEC-ADPT-04`) et `codex-cli` (`SPEC-ADPT-05`).  
Le client demande d'ajouter le support officiel d'un **quatrième adaptateur opérationnel** : **Claude CLI** (`claude` / Claude Code) pour permettre :

1. **L'exécution de blocs Run avec le moteur Claude Code :** Tout agent configuré avec `cliId = 'claude-cli'` délègue ses exécutions au binaire `claude`.
2. **La résolution sécurisée et étanche du binaire (`CLAUDE_CLI_BIN`) :** Résolution exclusive via la variable d'environnement `CLAUDE_CLI_BIN`, gérée dans `src/lib/process/env/` sans aucun fallback hasardeux sur le PATH système (`SPEC-ARCH-03`). Le binaire devient le 4ᵉ exécutable obligatoire au démarrage (`REQ-031`, `REQ-112`, `SPEC-SRV-01`).
3. **La construction non interactive des commandes (`buildCommand`) :**
   - Mode initial (sans session, 1er Run) : `claude --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions [--model <model>] "<assembledPrompt>"`.
   - Mode reprise de session (Runs subséquents) : `claude --resume <sessionId> --print --output-format stream-json --verbose --include-partial-messages --dangerously-skip-permissions [--model <model>] "<assembledPrompt>"`.
   - Exclusion mutuelle stricte : `--resume` n'est injecté que si `ctx.sessionId` est renseigné par le registre ; `--session-id` n'est jamais passé en ligne de commande.
4. **Le cycle de vie et la capture paresseuse (lazy) de session conversationnelle :**
   - Alignement sur le pattern de capture paresseuse de Codex (`codex-session.helper.ts`) : au 1er Run (`ctx.sessionId` absent), Claude démarre et émet dès sa première ligne JSONL un événement d'initialisation (`{"type":"system","subtype":"init","session_id":"..."}`).
   - La méthode `extractSessionId(chunk)` extrait ce `session_id`, transmis à `onSessionCaptured` pour enregistrement synchrone dans `ScenarioSessionRegistry.setSession(agentId, sessionId)`.
   - Lors des Runs subséquents du même agent, `ScenarioSessionRegistry.resolve()` renvoie ce `sessionId` en mémoire, injecté dans `ctx.sessionId` puis dans `--resume <sessionId>`.
   - Aucun prompt d'amorce `ping` n'est requis au préalable lors de l'exécution de scénario (0 surcoût de token, 0 latence d'initialisation).
   - Invalidation propre de la session lors du passage par un bloc `ClearContext`.
   - Pour les besoins de conformité de contrat ou d'appel autonome hors scénario, `createSession(ctx)` est implémenté via `probeClaudeSession` avec le timeout `CLAUDE_PROBE_TIMEOUT_MS` (défaut 15 000 ms).
5. **Le décodage résilient du flux de streaming (`parseStreamLine`) et la normalisation stricte de la sortie (`parseOutput`) :**
   - Décodage temps réel du flux JSONL émis par `--output-format stream-json --verbose --include-partial-messages` sans jamais lever d'exception bloquante.
   - Support des deltas incrémentaux (`content_block_delta` avec `delta.type === 'text_delta'` et `delta.text`) et des messages finaux (`assistant` avec `message.content[].text`).
   - Épuration totale des métadonnées de protocole (`parseOutput`) : extraction stricte du texte produit par l'IA (en concaténant les deltas textuels ou les blocs `assistant`) afin que le SAC (`BlockMessage.value`), les blocs `If` et les ordres de sortie (`exit`) reçoivent exclusivement la réponse exploitable.
6. **La découverte et l'énumération des modèles (`listModels`) :** Exposition des modèles supportés (alias natifs `sonnet`, `opus`, `haiku`, `fable`, et identifiants explicites), protégée par le cache mémoire LRU avec TTL (`ADR-016`) et repli résilient sur `[]` en cas d'erreur.
7. **L'intégration dans l'IHM, l'internationalisation et l'écosystème :** Enregistrement dans `AdapterRegistryService`, ajout de `'claude-cli'` dans `TECH_ALLOW_LIST` (`src/ui/i18n/fr.i18n.ts`), proposition de l'option « Claude CLI » (`claude-cli`) dans le formulaire modal d'agent (`AgentFormModal`) et validation des profils.
8. **L'indépendance vis-à-vis des tokens d'API pour les tests :** Implémentation d'un mock CLI local (`scripts/mock/mock-claude.*`) reproduisant rigoureusement le protocole `--print` et `--output-format stream-json` afin de garantir des tests unitaires et E2E 100 % automatisables sans token utilisateur ni consommation de quota.

---

## 2. Bilan de l'exploration technique directe du binaire `claude`

Des tests exploratoires directs dans le terminal hôte (`which claude`, `claude -v`, `claude -h`) ont permis de caractériser formellement le comportement du binaire hôte :

| Composant / Comportement | Constat technique dans le terminal | Décision d'ingénierie ClientsBox |
|---|---|---|
| **Version installée** | `2.1.330 (Claude Code)`. | L'adaptateur s'aligne sur les conventions Claude Code v2+. |
| **Identifiant d'adaptateur (`cliId`)** | Identifiant technique canonique requis. | `cliId = 'claude-cli'` sur l'instance `ClaudeCLIAdapter`. |
| **Résolution du binaire** | Binaire présent sous `/home/thomaz/.local/bin/claude`. | Variable d'environnement dédiée `CLAUDE_CLI_BIN`, résolue par `resolveClaudeCliBin()` dans `src/lib/process/env/env.layout.ts` (conforme `SPEC-ARCH-03`). |
| **Caractère obligatoire au boot** | Cohérence avec les 3 binaires déjà obligatoires (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`). | `CLAUDE_CLI_BIN` devient le **4ᵉ binaire obligatoire** au démarrage (`isRequired: true` dans `env.config.ts`, `SPEC-SRV-01`). |
| **Timeout de communication** | Délai de garde paramétrable pour la communication CLI. | Variable d'environnement `CLAUDE_PROBE_TIMEOUT_MS` avec valeur par défaut 15 000 ms. |
| **Exécution non interactive** | Drapeaux `-p`, `--print` (« Print response and exit, useful for pipes »). Ignore automatiquement la boîte de dialogue de confiance du workspace. | `buildCommand` utilise systématiquement `--print` avec le prompt assemblé (`ctx.assembledPrompt`). |
| **Format du flux** | Option `--output-format <format>` acceptant `"text"`, `"json"`, ou `"stream-json"`. Requièrent `--verbose` pour émettre les métadonnées de session, et `--include-partial-messages` pour le streaming incrémental. | Utilisation systématique de `--output-format stream-json --verbose --include-partial-messages` pour le streaming JSONL en temps réel. |
| **Capture de session (1er Run)** | Le flux émet dès la première ligne `{"type":"system","subtype":"init","session_id":"<id>"}`. | `extractSessionId` extrait `record.session_id` dès la première ligne pour enregistrement dynamique dans `ScenarioSessionRegistry` (aucun ping d'amorce nécessaire au runtime). |
| **Reprise de session (Runs subséquents)** | Option `-r <id>`, `--resume <session-id>`. | Si `ctx.sessionId` est présent, `buildCommand` génère l'argument exclusif `--resume <ctx.sessionId>` (exclusif au 1er Run). |
| **Bypass des approbations** | Drapeau `--dangerously-skip-permissions`. | Injection systématique en exécution autonome pour éviter tout blocage interactif d'approbation d'outils. |
| **Sélection du modèle** | Drapeau `--model <model>` acceptant les alias (`sonnet`, `opus`, `haiku`, `fable`) et noms de versions. | Injection conditionnelle de `--model <ctx.model.trim()>` lorsque `ctx.model` est renseigné. |
| **Absence de jeton utilisateur** | Pas de token configuré sur la machine locale ; les requêtes API directes échouent. | Création d'un mock autonome (`scripts/mock/mock-claude.*`) pour les suites de test, protégeant les quotas et garantissant le vert en CI. |

---

## 3. Impact — Cahier des charges (CDC v2.4 — [`cahier-des-charges-v2.4.md`](../cdc/cahier-des-charges-v2.4.md))

| Exigence | Statut | Impact & Justification |
|---|---|---|
| `REQ-008` (Sélection de l'adaptateur par agent) | **Complétée** | Un agent peut désormais être associé à l'adaptateur `claude-cli` en plus de `cursor-cli`, `antigravity` et `codex-cli`. |
| `REQ-013` (Catalogue d'adaptateurs opérationnels) | **Complétée** | `AdapterRegistryService` fournit désormais quatre adaptateurs opérationnels embarqués : `cursor-cli`, `antigravity`, `codex-cli` et `claude-cli`. |
| `REQ-027` (Interface `CLIAdapter` polymorphe) | **Conforme** | `ClaudeCLIAdapter` implémente rigoureusement le contrat polymorphe commun défini dans `src/types/contracts/cli-adapter.contract.ts`. |
| `REQ-029` (Génération des commandes CLI de spawn) | **Complétée** | `ClaudeCLIAdapter.buildCommand` produit les arguments spécifiques à Claude Code (`--print`, `--output-format stream-json`, `--verbose`, `--dangerously-skip-permissions`, `--model`, `--resume`). |
| `REQ-031` / `REQ-112` (Résolution des binaires par variable d'environnement) | **Complétée** | `CLAUDE_CLI_BIN` devient le 4ᵉ binaire obligatoire validé au boot sans fallback hasardeux sur le PATH. |
| Règle `R-18` (Passage exclusif par un adapter) | **Conforme** | L'invocation du CLI Claude passe exclusivement par `ClaudeCLIAdapter`. |
| Règle `R-29` (Contrat adapter v1) | **Conforme** | `ClaudeCLIAdapter` fournit `buildCommand`, `parseStreamLine`, `parseOutput`, `extractSessionId` et `listModels`. |
| Reste du CDC (`REQ-001..007`, `REQ-009..012`, `REQ-014..044`) | Inchangées | Aucun impact négatif sur le moteur de blocs, l'ordonnanceur de graphe, la persistance ou l'architecture générale. |

---

## 4. Impact — Spécifications fonctionnelles & Architecture

| Fichier de spécification | Nature de l'impact | Description précise des modifications |
|---|---|---|
| [`tdd/specs/ADPT.md`](../specs/ADPT.md) | **Ajout** | Création de **`SPEC-ADPT-06 — Spécialisation opérationnelle Claude CLI`** avec 7 critères d'acceptation `AC-ADPT-06-1` à `AC-ADPT-06-7`. |
| [`tdd/specs/ADPT.md`](../specs/ADPT.md) | **Mise à jour** | Mise à jour du texte de `SPEC-ADPT-01` (Règle §16) pour inclure `claude-cli` aux côtés des 3 autres adaptateurs. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Mise à jour** | Indexation de `SPEC-ADPT-06` dans le catalogue `ADPT` (total porté à 30 spécifications) et passage de 3 à 4 binaires obligatoires dans le résumé `SPEC-SRV-01`. |
| [`tdd/specs/SRV.md`](../specs/SRV.md) | **Mise à jour** | `SPEC-SRV-01` et `AC-SRV-01-9` passent de 3 à **4 binaires d'agents obligatoires** (`CURSOR_CLI_BIN`, `ANTIGRAVITY_CLI_BIN`, `CODEX_CLI_BIN`, `CLAUDE_CLI_BIN`). |
| [`tdd/specs/ARCH.md`](../specs/ARCH.md) | **Mise à jour** | `SPEC-ARCH-03` : ajout de `CLAUDE_CLI_BIN` dans le monopole I/O. `SPEC-ARCH-08` : actualisation de l'inventaire officiel des modules signés (197 $\rightarrow$ 200). |
| [`tdd/specs/UI.md`](../specs/UI.md) | **Mise à jour** | Ajout de l'adaptateur `claude-cli` dans les options sélectionnables du formulaire agent (`AgentFormModal`). |

---

## 5. Impact — Conception & Architecture technique

```text
src/
├── config/
│   └── env.config.ts                     # Ajout: descripteurs CLAUDE_CLI_BIN (isRequired: true) et CLAUDE_PROBE_TIMEOUT_MS
├── lib/
│   ├── process/
│   │   └── env/
│   │       └── env.layout.ts             # Ajout: resolveClaudeCliBin(), resolveClaudeProbeTimeout()
│   └── adapters/
│       ├── cursor-cli.adapter.ts         # [LIB-006] Inchangé
│       ├── antigravity/                  # [LIB-016..018] Inchangé
│       ├── codex/                        # [LIB-020..022] Inchangé
│       └── claude/
│           ├── claude-cli.adapter.ts     # [LIB-033] Nouveau: ClaudeCLIAdapter
│           ├── claude-session.helper.ts  # [LIB-034] Nouveau: extraction et validation session_id
│           └── claude-stream.extractor.ts# [LIB-035] Nouveau: décodage stream-json et parseOutput
├── services/
│   └── adapters/
│       └── adapter-registry.service.ts   # Prise en charge transparente de ClaudeCLIAdapter
├── ui/
│   ├── i18n/
│   │   └── fr.i18n.ts                    # Ajout de 'claude-cli' dans TECH_ALLOW_LIST
│   ├── components/agents/
│   │   └── agent-form-modal.tsx          # Ajout de l'option <option value="claude-cli">Claude CLI</option>
│   └── types/
│       └── ui.types.ts                   # allowedCliIds inclut 'claude-cli'
scripts/
└── mock/
    ├── mock-claude.js                    # Script Node.js émulant claude --print / stream-json
    ├── mock-claude.sh                    # Wrapper exécutable POSIX (Linux/macOS)
    └── mock-claude.cmd                   # Wrapper Windows CMD
env/
├── .env.example                          # Ajout documentation CLAUDE_CLI_BIN (obligatoire) / CLAUDE_PROBE_TIMEOUT_MS
└── .env.test                             # Configuration de test pointant vers scripts/mock/mock-claude.*
docs/
├── deploy/configuration.md               # Ajout du binaire CLAUDE_CLI_BIN dans la table des variables
└── instructions/
    ├── 01-demarrage/02-environnement-et-arborescence.md # Tableau des binaires
    ├── 01-demarrage/README.md            # Mention des 4 CLI supportés
    ├── 02-ressources/02-agents.md        # Documentation de l'agent claude-cli
    ├── 04-exemples-et-depannage/01-workflow-complet-cle-en-main.md # Exemple d'usage
    ├── 04-exemples-et-depannage/03-depannage-et-faq.md # Diagnostic binaire manquant
    └── README.md                         # Énumération des 4 adaptateurs
```

### 5.1 Numérotation stricte des identifiants `LIB-*` et inventaire signé
- Pour éviter la collision avec `[LIB-032]` (`src/lib/process/env/env.executable.ts`), les modules de Claude CLI reçoivent les identifiants officiels suivants :
  - **`LIB-033`** : `src/lib/adapters/claude/claude-cli.adapter.ts`
  - **`LIB-034`** : `src/lib/adapters/claude/claude-session.helper.ts`
  - **`LIB-035`** : `src/lib/adapters/claude/claude-stream.extractor.ts`
- Les tables d'inventaire [`tdd/docs/signature/signature-lib.md`](../signature/signature-lib.md) et [`tdd/docs/signature/signature.md`](../signature/signature.md) sont mises à jour (`LIB-001..035`).
- Le compteur d'inventaire signé (`EXPECTED_SIGNED_MODULE_COUNT`) dans `tests/units/arch/case-arch-08-1.test.ts` passe de **197 à 200 modules signés**.

### 5.2 Monopole I/O & Isolation de l'Environnement (`SPEC-ARCH-03`)
- Les fonctions `resolveClaudeCliBin()` et `resolveClaudeProbeTimeout()` résident exclusivement dans `src/lib/process/env/env.layout.ts`.
- Elles s'appuient sur `process.env.CLAUDE_CLI_BIN` validé au préalable par `validateExecutableField` lors du bootstrap applicatif.
- En cas de binaire manquant, vide ou non exécutable, une exception explicite en français est levée dès l'amorçage, avec renvoi vers `env/.env.example`.
- `resolveClaudeProbeTimeout()` extrait `process.env.CLAUDE_PROBE_TIMEOUT_MS` avec repli sur `15000` ms.

### 5.3 Contrat `ClaudeCLIAdapter` (`SPEC-ADPT-06`)
- Implémente l'interface commune `CLIAdapter` (`src/types/contracts/cli-adapter.contract.ts`).
- Propriété `cliId = 'claude-cli'`.
- Méthode `buildCommand(ctx: ExecutionContext)` :
  - `command` résolu via `resolveClaudeCliBin()`.
  - Arguments ordonnés :
    1. Si `ctx.sessionId` est présent (Runs subséquents) : `['--resume', ctx.sessionId.trim()]`.
    2. Drapeaux d'exécution autonome headless : `['--print', '--output-format', 'stream-json', '--verbose', '--include-partial-messages', '--dangerously-skip-permissions']`.
    3. Si `ctx.model` est fourni et non vide : `['--model', ctx.model.trim()]`.
    4. Prompt utilisateur assemblé : `[ctx.assembledPrompt]`.
  - Exclusion mutuelle : au 1er Run (`ctx.sessionId` absent), aucun drapeau de session n'est passé ; sur les Runs suivants, `--resume <sessionId>` est injecté. Aucun `--session-id` n'est passé en ligne de commande.
  - `cwd = ctx.workspacePath`.
- Méthode `extractSessionId(line: string)` :
  - Extrait la session depuis le flux JSONL au premier Run (`record.session_id` ou `record.sessionId`).
  - Aucun ping d'amorce préalable n'est émis au runtime : la capture est paresseuse, instantanée et calquée sur l'adapter Codex.
- Méthode `createSession(ctx: ExecutionContext)` :
  - Implémentée pour satisfaire le contrat TypeScript et les besoins d'appels autonomes hors scénario, en déléguant à `probeClaudeSession(bin, ctx.workspacePath)` avec le timeout `CLAUDE_PROBE_TIMEOUT_MS`.
- Méthode `parseStreamLine(line: string)` :
  - Décode la ligne JSONL émise par `--output-format stream-json --verbose --include-partial-messages` :
    - Événements `stream_event` (`content_block_delta` avec `delta.type === 'text_delta'` et `delta.text`) $\rightarrow$ `{ type: 'stdout', chunk: delta.text }`.
    - Événements `assistant` (avec `message.content[].text`) $\rightarrow$ `{ type: 'stdout', chunk: text }`.
  - Repli universel sans exception : `{ type: 'stdout', chunk: line }`.
- Méthode `parseOutput(rawOutput: string)` :
  - Analyse l'ensemble du flux accumulé JSONL et extrait exclusivement la réponse textuelle consolidée produite par Claude, sans scories de métadonnées JSON pour les blocs avals (`If`, `exit`).
- Méthode `listModels()` :
  - Retourne la liste des modèles officiels supportés : `['sonnet', 'opus', 'haiku', 'fable', 'claude-sonnet-4-5-20250929', 'claude-opus-4-5-20251101', 'claude-haiku-4-5-20251001']`.
  - Mise en cache en mémoire vive Node.js via le cache LRU (`ADR-016`) et repli résilient sur `[]` en cas d'erreur.

---

## 6. Impact — Tests & Fiches CASE TDD

Pour satisfaire le cycle TDD sans aucune régression :

1. **Critères d'acceptation de la spécification `SPEC-ADPT-06` :**
   - `AC-ADPT-06-1` : `ClaudeCLIAdapter` implémente `CLIAdapter` avec `cliId = 'claude-cli'` (`CASE-ADPT-06-1`).
   - `AC-ADPT-06-2` : `resolveClaudeCliBin` valide la présence physique et les permissions d'exécution de `CLAUDE_CLI_BIN` (`CASE-ADPT-06-2`).
   - `AC-ADPT-06-3` : `buildCommand` génère la commande headless avec `--print`, `--output-format stream-json`, `--verbose`, `--include-partial-messages`, `--dangerously-skip-permissions`, `--model` optionnel, et `--resume <id>` conditionnel à la présence de `ctx.sessionId` (`CASE-ADPT-06-2`).
   - `AC-ADPT-06-4` : `parseStreamLine` normalise les flux JSONL (notamment `stream_event` et `assistant`) et le texte brut sans jamais lever d'exception bloquante (`CASE-ADPT-06-3`).
   - `AC-ADPT-06-5` : `listModels` énumère les modèles Claude, met en mémoire cache Node.js avec TTL (`ADR-016`) et bascule sur `[]` en cas d'anomalie (`CASE-ADPT-06-4`).
   - `AC-ADPT-06-6` : `parseOutput` extrait strictement le texte écrit par l'agent depuis la sortie accumulée JSONL (`CASE-ADPT-06-3`).
   - `AC-ADPT-06-7` : `extractSessionId` permet la capture dynamique de `session_id` au 1er Run et la réutilisation sur les Runs suivants sans amorce préalable (`CASE-ADPT-06-5`).
2. **Fiches CASE TDD à créer sous `tdd/tests/adpt/` :**
   - `CASE-ADPT-06-1.md` : Conformité contrat TypeScript et identifiant `cliId = 'claude-cli'`.
   - `CASE-ADPT-06-2.md` : Résolution d'environnement `CLAUDE_CLI_BIN`, permissions d'exécutable et génération de commande `buildCommand` (initial, avec modèle, avec reprise).
   - `CASE-ADPT-06-3.md` : Décodage résilient de flux `parseStreamLine` et épuration textuelle `parseOutput`.
   - `CASE-ADPT-06-4.md` : Énumération des modèles supportés via `listModels()`, cache LRU et repli résilient.
   - `CASE-ADPT-06-5.md` : Capture paresseuse dynamique au 1er Run et réutilisation de session inter-runs en scénario.
3. **Fichiers de tests automatisés (Phase ROUGE initiale) :**
   - `tests/units/adpt/CASE-ADPT-06-1.test.ts`
   - `tests/units/adpt/CASE-ADPT-06-2.test.ts`
   - `tests/units/adpt/CASE-ADPT-06-3.test.ts`
   - `tests/units/adpt/CASE-ADPT-06-4.test.ts`
   - `tests/units/adpt/CASE-ADPT-06-5.test.ts`
4. **Mise à jour des tests d'architecture, d'environnement & d'intégration :**
   - `tests/units/arch/case-arch-08-1.test.ts` : seuil d'inventaire de modules signés porté de 197 à 200 modules (+3 modules `claude/`).
   - `tests/units/adpt/CASE-ADPT-01-4.test.ts` : vérification que le registre liste les quatre adaptateurs opérationnels.
   - `tests/units/ui/CASE-UI-01-3.test.ts` : prise en compte de `'claude-cli'` dans le formulaire d'agent.
   - `tests/units/srv/CASE-SRV-01-9.test.ts` : validation bootstrap des **4 binaires obligatoires** au lieu de 3 (intégration de `mockClaudeBin`).

---

## 7. Plan séquentiel TDD par étapes

1. **Étape 1 (actuelle) : Documentation & Spécifications**
   - Validation de la présente étude d'impact (`impact-CR-013-claude-cli-adapter.md`).
   - Spécification détaillée `SPEC-ADPT-06` (7 critères d'acceptation `AC-ADPT-06-1` à `AC-ADPT-06-7`) dans `tdd/specs/ADPT.md`.
   - Mise à jour de `SPEC-ADPT-01`, `SPEC-SRV-01` (4 binaires obligatoires), `SPEC-ARCH-03`, `SPEC-ARCH-08`.
   - Indexation dans `tdd/specs/sommaire.md` et `tdd/specs/UI.md`.
   - Mise à jour de la documentation utilisateur et technique (`docs/`).
   - Signatures d'architecture (`signature-lib.md`, `signature.md`, `case-arch-08-1.test.ts`).
2. **Étape 2 : Fiches de cas de test TDD**
   - Rédaction de `CASE-ADPT-06-1.md` à `CASE-ADPT-06-5.md`.
   - Indexation dans `tdd/tests/adpt/sommaire.md` et `tdd/tests/sommaire.md`.
3. **Étape 3 : Mock déterministe et tests unitaires rouges**
   - Création du mock `scripts/mock/mock-claude.js`, `mock-claude.sh`, `mock-claude.cmd`.
   - Mise à jour de `env/.env.test` et `env/.env.example`.
   - Écriture des tests Vitest dans `tests/units/adpt/CASE-ADPT-06-*.test.ts` (vérification de leur échec au ROUGE).
   - Mise à jour de `tests/units/srv/CASE-SRV-01-9.test.ts` pour inclure le 4ᵉ binaire.
4. **Étape 4 : Implémentation du code source de production**
   - Création des modules `claude-stream.extractor.ts` (`LIB-035`), `claude-session.helper.ts` (`LIB-034`), `claude-cli.adapter.ts` (`LIB-033`).
   - Ajout des fonctions de résolution dans `env.layout.ts` et `env.config.ts` (`CLAUDE_CLI_BIN`).
   - Enregistrement dans `AdapterRegistryService`, `agent-form-modal.tsx`, `ui.types.ts` et `TECH_ALLOW_LIST` dans `fr.i18n.ts`.
   - Passage de tous les tests au VERT.
5. **Étape 5 : Refactoring & Portes Qualité Globales**
   - Exécution de `npm run quality` (typecheck, lint, prettier).
   - Validation de la suite complète `npm run ci` (tests unitaires, E2E Playwright, tests d'architecture).
