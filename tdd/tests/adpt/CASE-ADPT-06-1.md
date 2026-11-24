# CASE-ADPT-06-1 — Conformité du contrat TypeScript `CLIAdapter` pour `ClaudeCLIAdapter`

**Spécification :** `SPEC-ADPT-06`, `SPEC-ADPT-01`  
**Critère d'acceptation :** `AC-ADPT-06-1`, `AC-ADPT-01-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

La classe `ClaudeCLIAdapter` doit implémenter rigoureusement le contrat d'interface polymorphe `CLIAdapter` défini dans `src/types/contracts/cli-adapter.contract.ts` (`TYPES-001`).  
Ce cas garantit :
1. Que la propriété `cliId` est égale à la chaîne littérale immuable `'claude-cli'`.
2. Que les méthodes obligatoires `buildCommand(ctx: ExecutionContext)` et `parseStreamLine(line: string)` sont présentes et fonctionnelles.
3. Que les méthodes optionnelles `parseOutput(rawOutput: string)`, `extractSessionId(line: string)`, `listModels()` et `createSession(ctx: ExecutionContext)` sont déclarées et conformes.
4. L'interchangeabilité polymorphe de l'adaptateur au sein du moteur d'exécution ClientsBox, sans fuite de syntaxe spécifique dans les blocs de scénario.

---

## Cas

```gherkin
Étant donné une instance de "ClaudeCLIAdapter"
Quand on vérifie sa conformité structurelle avec l'interface "CLIAdapter"
Alors la propriété "cliId" vaut exactement "claude-cli"
Et la méthode "buildCommand" est une fonction
Et la méthode "parseStreamLine" est une fonction
Et la méthode "parseOutput" est une fonction
Et la méthode "extractSessionId" est une fonction
Et la méthode "listModels" est une fonction asynchrone
Et la méthode "createSession" est une fonction asynchrone

Étant donné un contexte d'exécution minimal "ctx" avec workspacePath "/app", agentId "claude-agent" et assembledPrompt "Test"
Quand "adapter.buildCommand(ctx)" est appelé avec un environnement mocké valide
Alors l'objet retourné respecte le contrat CommandSpawnOptions avec command, args et cwd
```

---

## Données

| Élément | Valeur attendue |
|---|---:|
| `cliId` | `'claude-cli'` |
| Méthodes requises | `buildCommand`, `parseStreamLine`, `parseOutput`, `extractSessionId`, `listModels`, `createSession` |
| `ctx.workspacePath` | `"/app"` |
| `ctx.agentId` | `"claude-agent"` |
| `ctx.assembledPrompt` | `"Test"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Identifiant adaptateur | `'claude-cli'` | Littéral immuable requis par SPEC-ADPT-06 |
| Type de `buildCommand` | `'function'` | Signature `(ctx: ExecutionContext) => CommandSpawnOptions` |
| Type de `parseStreamLine` | `'function'` | Signature `(line: string) => AgentStreamEvent` |
| Type de `parseOutput` | `'function'` | Signature `(rawOutput: string) => string` |
| Type de `extractSessionId` | `'function'` | Signature `(line: string) => string | null` |
| Type de `listModels` | `'function'` | Signature `() => Promise<readonly string[]>` |
| Type de `createSession` | `'function'` | Signature `(ctx: ExecutionContext) => Promise<string>` |

---

## Ce que ce cas ne vérifie pas

- La validation du binaire physique et des permissions d'exécution → `CASE-ADPT-06-2` ;
- Le détail précis des arguments injectés dans `buildCommand` → `CASE-ADPT-06-2` ;
- Le décodage spécifique des flux stream-json et le nettoyage textuel → `CASE-ADPT-06-3` ;
- L'énumération des modèles avec cache LRU → `CASE-ADPT-06-4` ;
- La capture paresseuse et la reprise de session en scénario → `CASE-ADPT-06-5`.

