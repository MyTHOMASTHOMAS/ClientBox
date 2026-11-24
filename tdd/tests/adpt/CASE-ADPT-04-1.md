# CASE-ADPT-04-1 — Conformité du contrat TypeScript `CLIAdapter` pour `AntigravityCLIAdapter`

**Spécification :** `SPEC-ADPT-04`, `SPEC-ADPT-01`  
**Critère d'acceptation :** `AC-ADPT-04-1`, `AC-ADPT-01-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

La classe `AntigravityCLIAdapter` doit implémenter rigoureusement le contrat d'interface `CLIAdapter` défini dans `src/types/contracts/cli-adapter.contract.ts` (`TYPES-001`).  
Ce cas garantit :
1. Que la propriété `cliId` est égale à la chaîne littérale immuable `'antigravity'`.
2. Que les méthodes obligatoires `buildCommand(ctx: ExecutionContext)` et `parseStreamLine(line: string)` sont présentes et fonctionnelles.
3. Que la méthode optionnelle `listModels()` est déclarée et renvoie une promesse résolvant une liste de chaînes de caractères.
4. L'interchangeabilité polymorphe de l'adaptateur au sein du moteur d'exécution ClientsBox, sans fuite de logique dans les blocs de scénario.

---

## Cas

```gherkin
Étant donné une instance de "AntigravityCLIAdapter"
Quand on vérifie sa conformité structurelle avec l'interface "CLIAdapter"
Alors la propriété "cliId" vaut exactement "antigravity"
Et la méthode "buildCommand" est une fonction
Et la méthode "parseStreamLine" est une fonction
Et la méthode "listModels" est une fonction asynchrone

Étant donné un contexte d'exécution minimal "ctx" avec workspacePath "/app", agentId "agy-agent" et assembledPrompt "Test"
Quand "adapter.buildCommand(ctx)" est appelé avec un environnement mocké valide
Alors l'objet retourné respecte le contrat CommandSpawnOptions avec command, args et cwd
```

---

## Données

| Élément | Valeur attendue |
|---|---:|
| `cliId` | `'antigravity'` |
| Méthodes requises | `buildCommand`, `parseStreamLine`, `listModels` |
| `ctx.workspacePath` | `"/app"` |
| `ctx.agentId` | `"agy-agent"` |
| `ctx.assembledPrompt` | `"Test"` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Identifiant adaptateur | `'antigravity'` | Littéral immuable requis par SPEC-ADPT-04 |
| Type de `buildCommand` | `'function'` | Signature `(ctx: ExecutionContext) => CommandSpawnOptions` |
| Type de `parseStreamLine` | `'function'` | Signature `(line: string) => AgentStreamEvent` |
| Type de `listModels` | `'function'` | Signature `() => Promise<readonly string[]>` |

---

## Ce que ce cas ne vérifie pas

- La validation du binaire physique et des permissions d'exécution → `CASE-ADPT-04-2` ;
- Le détail des arguments injectés dans `buildCommand` → `CASE-ADPT-04-2` ;
- Le décodage spécifique des flux JSON → `CASE-ADPT-04-3` ;
- L'extraction des modèles depuis le CLI hôte → `CASE-ADPT-04-4`.

