# CASE-ADPT-01-1 — Conformité du contrat TypeScript de l'interface `CLIAdapter`

**Spécification :** `SPEC-ADPT-01`
**Critère d'acceptation :** `AC-ADPT-01-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Tout adapter intégré dans ClientsBox doit obligatoirement implémenter l'interface TypeScript `CLIAdapter` (`R-18`, `R-27`, `REQ-027`, `ADR-002`). Cette interface expose les méthodes requises `buildCommand` et `parseStreamLine`, ainsi que la méthode optionnelle `createSession` (ouverture d'une session conversationnelle native, `SPEC-ADPT-03`). L'ancienne méthode `clearContext` n'existe plus dans le contrat. Si ce contrat d'interface n'est pas respecté ou si des signatures sont altérées, le moteur de blocs ne peut plus piloter les sous-processus CLI de manière polymorphe et découplée.

## Cas

```gherkin
Étant donné une implémentation de module d'adapter "TestCLIAdapter"
Quand le compilateur et le vérificateur de types inspectent la classe
Alors elle implémente l'interface "CLIAdapter" avec les méthodes :
  | méthode         | présence     | signature attendue                                 |
  | buildCommand    | obligatoire  | (ctx: ExecutionContext) => CommandSpawnOptions     |
  | parseStreamLine | obligatoire  | (line: string) => AgentStreamEvent                 |
  | createSession   | optionnelle  | (ctx: ExecutionContext) => Promise<string>         |
Et l'interface garantit le découplage total entre le moteur et la syntaxe CLI sous-jacente

Étant donné un appel à "buildCommand" avec un contexte d'exécution valide
Quand la méthode est exécutée
Alors elle retourne un objet contenant la commande à exécuter, le tableau d'arguments, les variables d'environnement et le répertoire de travail "cwd"
```

## Données

| Élément | Valeur |
|---|---:|
| Interface cible | `CLIAdapter` |
| Méthode 1 (obligatoire) | `buildCommand(ctx: ExecutionContext): CommandSpawnOptions` |
| Méthode 2 (obligatoire) | `parseStreamLine(line: string): AgentStreamEvent` |
| Méthode 3 (optionnelle) | `createSession?(ctx: ExecutionContext): Promise<string>` |
| Méthode retirée | `clearContext` (absente du contrat et de `CursorCLIAdapter`) |
| Propriétés `CommandSpawnOptions` | `command: string`, `args: string[]`, `cwd: string`, `env?: Record<string, string>` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Conformité statique TypeScript | `PASS` | Tous les membres requis déclarés selon ADR-002 / SPEC-ADPT-01 |
| Présence `buildCommand` | `OUI` | Méthode obligatoire de génération de spawn |
| Présence `parseStreamLine` | `OUI` | Méthode obligatoire de décodage de flux |
| Type de retour `buildCommand` | `CommandSpawnOptions` | Objet `{ command, args, cwd, env }` exploitable par `child_process.spawn` |

## Ce que ce cas ne vérifie pas

- La structure détaillée de `ExecutionContext` → `CASE-ADPT-01-2` ;
- Le comportement de décodage de `parseStreamLine` → `CASE-ADPT-01-3` ;
- L'implémentation concrète de `cursor-cli` → `CASE-ADPT-02-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ADPT_01_1_cli_adapter_typescript_contract_compliance`
**Fichier :** `tests/tests-unitaires/adpt/case-adpt-01-1.test.ts`

## Revue du test automatisé

- [ ] Le test valide statiquement l'implémentation de `CLIAdapter` par un mock et par l'adapter réel.
- [ ] Le test vérifie que `buildCommand` retourne les champs `command`, `args` et `cwd`.
- [ ] Le test vérifie que `parseStreamLine` est callable avec une chaîne et retourne un `AgentStreamEvent`.
- [ ] Le test vérifie que l'adapter réel `cursor-cli` expose `createSession` et n'expose plus `clearContext`.
- [ ] Le test échoue si une méthode obligatoire est omise dans l'adapter.
- [ ] Le nom du test contient `CASE_ADPT_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
