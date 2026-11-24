# Analyse d'impact — CR-004 (Intégration de l'adaptateur CLI Antigravity `agy`)

**Demande du client :** Adapter un nouveau CLI au sein de ClientsBox : le CLI Antigravity (`agy`), en répliquant l'architecture et les conventions établies pour l'adaptateur Cursor CLI (`cursor-cli`), selon la méthodologie stricte TDD (Doc $\rightarrow$ Cases $\rightarrow$ Tests $\rightarrow$ Code).  
**Reçue le :** 07/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `feat/antigravity-cli-adapter`  

---

> **Règle fondamentale TDD :**
> Interdiction de modifier le code de production avant la validation de la documentation de spécification et l'écriture des tests unitaires rouges.  
> La chaîne descend impérativement : CDC $\rightarrow$ Specs $\rightarrow$ Signatures & Architecture $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.

---

## 1. Ce que le client demande, reformulé

ClientsBox intègre actuellement un adaptateur opérationnel principal pour Cursor CLI (`cursor-cli`).  
Le client demande d'ajouter le support opérationnel du **CLI Antigravity** (`agy` / `agy.exe`) pour permettre :
1. **L'exécution de blocs Run avec le moteur Antigravity :** L'agent configuré avec `cliId = 'antigravity'` délègue ses exécutions à `agy`.
2. **La résolution sécurisée du binaire :** Résolution exclusive via variable d'environnement `ANTIGRAVITY_CLI_BIN`, sans fallback hasardeux sur le PATH système (`SPEC-ARCH-03` / `SPEC-ADPT-02`).
3. **La construction non interactive des commandes (`buildCommand`) :** Assemblage des arguments avec `--print <assembledPrompt>`, le passage du modèle `--model <id>` (si configuré sur le profil) et la reprise éventuelle de conversation `--conversation <sessionId>`.
4. **Le décodage résilient du flux de streaming (`parseStreamLine`) :** Normalisation des sorties NDJSON émettant des deltas de texte (`step_update.text_delta`, `result.response`), ainsi que des sorties brutes sur stdout, sans jamais lever d'exception.
5. **La découverte et l'énumération des modèles (`listModels`) :** Interrogation dynamique de `agy models`, extraction du format tabulaire `<id>\t<label>`, et catalogue de repli résilient (*fallback*) prédéfini en cas d'indisponibilité du binaire.
6. **L'intégration dans l'écosystème applicatif et l'IHM :** Enregistrement dans `AdapterRegistryService`, proposition de l'option `Antigravity CLI` (`antigravity`) dans le sélecteur d'agent UI et validation des schémas.

---

## 2. Bilan de l'exploration technique du CLI `agy` & Décisions d'ingénierie

Des tests exploratoires directs dans le terminal hôte ont permis de caractériser précisément le comportement du binaire `agy.exe` (`C:\Users\Autrement\AppData\Local\agy\bin\agy.exe`) :

| Composant / Comportement | Constat technique dans le terminal | Décision d'ingénierie ClientsBox |
|---|---|---|
| **Identifiant d'adaptateur (`cliId`)** | Nom formel `antigravity` requis par le client. | `cliId = 'antigravity'` sur l'instance `AntigravityCLIAdapter`. |
| **Résolution du binaire** | Binaire présent dans l'AppData local utilisateur. | Variable d'environnement dédiée `process.env.ANTIGRAVITY_CLI_BIN`, résolue par `resolveAntigravityCliBin()` dans `src/lib/process/env-resolver.ts` (conforme `SPEC-ARCH-03` monopole I/O). |
| **Exécution non interactive** | `agy --print "<prompt>"` ou `-p` exécute un prompt sans interaction et imprime la réponse. | `buildCommand` utilise systématiquement `--print` avec le prompt assemblé (`ctx.assembledPrompt`). |
| **Modèle d'IA** | `agy --model <model> --print "..."` applique le modèle spécifié. | Injection conditionnelle de `--model <ctx.model.trim()>` lorsque `ctx.model` est fourni et non vide. |
| **Sessions & Conversations** | `agy --conversation <uuid>` reprend une conversation existante stockée sous `.gemini/antigravity-cli/conversations/<uuid>.db`. | Si `ctx.sessionId` est fourni, injection de `--conversation <ctx.sessionId.trim()>`. L'adaptateur supporte les exécutions stateless (sans conversation forcée) et stateful. |
| **Énumération des modèles** | `agy models` affiche `Fetching available models...` puis une liste tabulaire `<modelId>\t<displayName>`. | `listModels()` exécute `agy models`, parse les identifiants en ignorant les lignes informatives, et bascule sur `DEFAULT_ANTIGRAVITY_MODELS` en cas d'erreur. |
| **Catalogue par défaut** | Modèles standard observés : Gemini 3.8 Flash (High/Medium/Low), Claude Sonnet 4.6, Claude Opus 4.6, GPT-OSS 120B. | Définition de `DEFAULT_ANTIGRAVITY_MODELS` comme constante immuable dans l'adaptateur. |
| **Format du flux** | `--output-format stream-json` produit du NDJSON (`event: "step_update"`, `text_delta`). | `parseStreamLine` extrait `text_delta` ou `response` si JSON valide, sinon repli `{ type: 'stdout', chunk: line }`. |

---

## 3. Impact — Cahier des charges (CDC v2)

| Exigence | Statut | Impact & Justification |
|---|---|---|
| `REQ-008` (Sélection de l'adaptateur par agent) | **Complétée** | Un agent peut être associé à l'adaptateur `antigravity` en plus de `cursor-cli`. |
| `REQ-013` (Menu d'adaptateurs opérationnels) | **Complétée** | `AdapterRegistryService` fournit désormais les adaptateurs opérationnels embarqués `cursor-cli` et `antigravity`. |
| `REQ-027` (Interface `CLIAdapter` polymorphe) | **Conforme** | `AntigravityCLIAdapter` implémente rigoureusement le contrat d'interface commun défini dans `src/types/contracts/cli-adapter.contract.ts`. |
| `REQ-029` (Génération des commandes CLI de spawn) | **Complétée** | `AntigravityCLIAdapter.buildCommand` produit la commande spécifique à `agy` (`--print`, `--model`, `--conversation`). |
| `REQ-031` (Résolution des binaires CLI par variable d'environnement) | **Complétée** | `ANTIGRAVITY_CLI_BIN` garantit l'isolation et la configurabilité étanche de l'exécutable Antigravity. |
| Reste du CDC (`REQ-001` à `REQ-038`, NFR) | Inchangées | Zéro impact négatif sur le moteur de blocs, l'ordonnanceur de scénario ou l'architecture générale. |

---

## 4. Impact — Spécifications fonctionnelles

| Fichier de spécification | Nature de l'impact | Description précise des modifications |
|---|---|---|
| [`tdd/specs/ADPT.md`](../specs/ADPT.md) | **Ajout** | Création de **`SPEC-ADPT-04 — Spécialisation opérationnelle Antigravity CLI`** avec critères `AC-ADPT-04-1` à `AC-ADPT-04-5`. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Mise à jour** | Indexation de `SPEC-ADPT-04` dans le catalogue du domaine `ADPT`. |
| [`tdd/specs/UI.md`](../specs/UI.md) | **Mise à jour** | Ajout de l'adaptateur `antigravity` dans les options sélectionnables du formulaire agent (`AgentFormModal`). |

---

## 5. Impact — Conception & Architecture technique

```text
src/
├── lib/
│   ├── process/
│   │   └── env-resolver.ts         # Ajout: resolveAntigravityCliBin()
│   └── adapters/
│       ├── cursor-cli.adapter.ts   # Inchangé
│       └── antigravity-cli.adapter.ts # Nouveau: AntigravityCLIAdapter
├── services/
│   └── adapter-registry.service.ts # Prise en compte multi-adapters pour listOperationalModels(cliId?)
├── ui/
│   ├── components/agents/
│   │   └── agent-form-modal.tsx    # Ajout de l'option 'Antigravity CLI'
│   └── types/
│       └── ui.types.ts             # allowedCliIds inclut 'antigravity'
└── index.ts                        # Enregistrement de AntigravityCLIAdapter dans AdapterRegistryService
```

### 5.1 Monopole I/O & Isolation de l'Environnement (`SPEC-ARCH-03`)
- La fonction pure d'extraction et de validation `resolveAntigravityCliBin()` réside exclusivement dans `src/lib/process/env-resolver.ts`.
- Elle lit `process.env.ANTIGRAVITY_CLI_BIN`. Si la variable est absente ou vide, ou si le fichier est introuvable ou non exécutable, elle lève une erreur explicite en français.
- Aucun autre module ne tente de deviner l'emplacement du binaire ou d'appeler `process.env` directement.

### 5.2 Contrat `AntigravityCLIAdapter` (`SPEC-ADPT-04`)
- Implémente `CLIAdapter` (`src/types/contracts/cli-adapter.contract.ts`).
- `cliId = 'antigravity'`.
- `buildCommand(ctx: ExecutionContext)` :
  - `command` résolu via `resolveAntigravityCliBin()`.
  - arguments ordonnés :
    - Si `ctx.model` fourni : `['--model', ctx.model.trim()]`.
    - Si `ctx.sessionId` fourni : `['--conversation', ctx.sessionId.trim()]`.
    - Arguments obligatoires : `['--print', ctx.assembledPrompt]`.
  - `cwd = ctx.workspacePath`.
- `parseStreamLine(line: string)` :
  - Décode JSON si possible :
    - `step_update.text_delta` $\rightarrow$ `{ type: 'stdout', chunk: delta }`
    - `result.response` ou `response` $\rightarrow$ `{ type: 'stdout', chunk: resp }`
    - `type === 'text'` $\rightarrow$ `{ type: 'stdout', chunk: content }`
  - Repli universel sans exception : `{ type: 'stdout', chunk: line }`.
- `listModels()` :
  - Exécute `resolveAntigravityCliBin()` avec `['models']` via `runCliCommand`.
  - Extrait les identifiants sur lignes séparées par tabulation (`parts[0]`).
  - Repli sans planter sur `DEFAULT_ANTIGRAVITY_MODELS` si indisponible.

### 5.3 Extension de `AdapterRegistryService` (`SVC-003`)
- `listOperationalModels(cliId?: string)` :
  - Si `cliId` fourni, interroge l'adaptateur ciblé.
  - Si non fourni, conserve la rétro-compatibilité en priorisant `cursor-cli` puis `antigravity`.

---

## 6. Impact — Tests & Fiches CASE TDD

Pour satisfaire le cycle TDD sans régression :
1. **Fiches CASE TDD à créer sous `tdd/tests/adpt/` :**
   - `CASE-ADPT-04-1.md` : Contrat TypeScript et identifiant `cliId = 'antigravity'`.
   - `CASE-ADPT-04-2.md` : Résolution d'environnement `ANTIGRAVITY_CLI_BIN` et génération de commande `buildCommand`.
   - `CASE-ADPT-04-3.md` : Décodage résilient des flux dans `parseStreamLine`.
   - `CASE-ADPT-04-4.md` : Énumération et parsing des modèles via `listModels()`.
2. **Fichiers de tests automatisés (Phase Rouge) :**
   - `tests/units/adpt/CASE-ADPT-04-1.test.ts`
   - `tests/units/adpt/CASE-ADPT-04-2.test.ts`
   - `tests/units/adpt/CASE-ADPT-04-3.test.ts`
   - `tests/units/adpt/CASE-ADPT-04-4.test.ts`
3. **Mise à jour des tests d'intégration / UI :**
   - `tests/units/adpt/CASE-ADPT-01-4.test.ts` : vérification que le registre liste les deux adaptateurs opérationnels.
   - `tests/units/ui/CASE-UI-01-3.test.ts` : prise en compte de `'antigravity'` dans les formulaires d'agents.

---

## 7. Plan de mise en œuvre TDD par étapes

1. **Étape 1 (actuelle) : Documentation & Spécifications**
   - Étude d'impact validée (`impact-CR-004-antigravity-cli-adapter.md`).
   - Spécification détaillée `SPEC-ADPT-04` dans `tdd/specs/ADPT.md`.
   - Indexation dans `tdd/specs/sommaire.md`.
2. **Étape 2 : Cas de test TDD**
   - Rédaction des spécifications de tests `CASE-ADPT-04-1.md` à `CASE-ADPT-04-4.md`.
   - Indexation dans `tdd/tests/adpt/sommaire.md`.
3. **Étape 3 : Tests unitaires rouges**
   - Écriture des tests Vitest dans `tests/units/adpt/CASE-ADPT-04-*.test.ts`.
   - Constat formel des échecs (Phase Rouge).
4. **Étape 4 : Implémentation du code source**
   - Ajout de `resolveAntigravityCliBin` dans `src/lib/process/env-resolver.ts`.
   - Création de `src/lib/adapters/antigravity-cli.adapter.ts`.
   - Câblage dans `AdapterRegistryService` et `src/index.ts`.
   - Intégration dans `AgentFormModal` et types UI.
   - Passage de 100% des tests au vert (Phase Verte).
5. **Étape 5 : Refactoring & Validation de la Qualité**
   - Conformité stricte aux 8 règles d'architecture (`case-arch-*.test.ts`).
   - Validation `npm run quality` (Prettier, ESLint, TypeScript `tsc --noEmit`).

