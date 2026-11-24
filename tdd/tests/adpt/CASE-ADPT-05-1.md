# CASE-ADPT-05-1 — Conformité du contrat TypeScript `CLIAdapter` pour `CodexCLIAdapter`

**Spécification :** `SPEC-ADPT-05`, `SPEC-ADPT-01`  
**Critère d'acceptation :** `AC-ADPT-05-1`, `AC-ADPT-01-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

La classe `CodexCLIAdapter` doit implémenter rigoureusement le contrat d'interface `CLIAdapter` défini dans `src/types/contracts/cli-adapter.contract.ts` (`TYPES-001`).  
Ce cas garantit :
1. Que la propriété `cliId` est égale à la chaîne littérale immuable `'codex-cli'`.
2. Que les méthodes obligatoires `buildCommand(ctx: ExecutionContext)` et `parseStreamLine(line: string)` sont présentes et fonctionnelles.
3. Que les méthodes optionnelles `listModels()` et `createSession(ctx: ExecutionContext)` sont déclarées et renvoient des promesses conformes.
4. L'interchangeabilité polymorphe de l'adaptateur au sein du moteur d'exécution ClientsBox, sans fuite de logique spécifique dans les blocs de scénario.

---

## Cas

```gherkin
Étant donné une instance de "CodexCLIAdapter"
Quand on vérifie sa conformité structurelle avec l'interface "CLIAdapter"
Alors la propriété "cliId" vaut exactement "codex-cli"
Et la méthode "buildCommand" est une fonction
Et la méthode "parseStreamLine" est une fonction
Et la méthode "listModels" est une fonction asynchrone
Et la méthode "createSession" est une fonction asynchrone

Étant donné un contexte d'exécution minimal "ctx" avec workspacePath "/app", agentId "codex-agent" et assembledPrompt "Test"
Quand "adapter.buildCommand(ctx)" est appelé avec un environnement mocké valide
Alors l'objet retourné respecte le contrat CommandSpawnOptions avec command, args et cwd
```

---

## Données

| Élément | Valeur attendue |
|---|---:|
| `cliId` | `'codex-cli'` |
| Méthodes requises | `buildCommand`, `parseStreamLine`, `listModels`, `createSession` |
| `ctx.workspacePath` | `"/app"` |
| `ctx.agentId` | `"codex-agent"` |
| `ctx.assembledPrompt` | `"Test"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Identifiant adaptateur | `'codex-cli'` | Littéral immuable requis par SPEC-ADPT-05 |
| Type de `buildCommand` | `'function'` | Signature `(ctx: ExecutionContext) => CommandSpawnOptions` |
| Type de `parseStreamLine` | `'function'` | Signature `(line: string) => AgentStreamEvent` |
| Type de `listModels` | `'function'` | Signature `() => Promise<readonly string[]>` |
| Type de `createSession` | `'function'` | Signature `(ctx: ExecutionContext) => Promise<string>` |

---

## Ce que ce cas ne vérifie pas

- La validation du binaire physique et des permissions d'exécution → `CASE-ADPT-05-2` ;
- Le détail précis des arguments injectés dans `buildCommand` → `CASE-ADPT-05-2` ;
- Le décodage spécifique des flux JSONL → `CASE-ADPT-05-3` ;
- L'extraction des modèles via `codex debug models` → `CASE-ADPT-05-4` ;
- L'amorce et la capture de session → `CASE-ADPT-05-5`.

