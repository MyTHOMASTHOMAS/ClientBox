# CASE-ADPT-02-5 — Injection de `--model <id>` dans `buildCommand` et énumération via `listModels`

**Spécification :** `SPEC-ADPT-02`  
**Critère d'acceptation :** `AC-ADPT-02-5`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-003`, `ADR-006`  

## Ce que ce cas protège

La méthode `buildCommand` de l'adapter `cursor-cli` doit permettre de cibler un modèle d'IA particulier configuré sur le profil de l'agent (`SPEC-ADPT-02`, `CR-003`). Lorsque le contexte d'exécution `ExecutionContext` porte la propriété `model` renseignée et non vide (après suppression des espaces superflus), l'adaptateur doit injecter `--model <model>` parmi les arguments de la commande CLI avant la reprise de session.

Si la propriété `model` est omise, indéfinie ou ne contient que des espaces blancs, aucun argument `--model` ne doit être inséré dans la ligne de commande, préservant le modèle par défaut configuré au niveau de l'environnement ou du CLI.

De plus, la méthode `listModels()` doit interroger le binaire Cursor Agent avec l'option `--list-models` pour extraire la liste des identifiants disponibles, mémoriser le résultat en cache mémoire Node.js avec un TTL de 1 heure (ADR-016 / CR-005), et retourner un tableau vide `[]` en cas d'erreur ou d'absence du binaire hôte, sans inventer de catalogue factice.

## Cas

```gherkin
Étant donné la variable "CURSOR_CLI_BIN" pointant vers "/usr/local/bin/agent"
Et un contexte d'exécution avec :
  | champ           | valeur                                                  |
  | workspacePath   | "/var/projects/my-app"                                  |
  | agentId         | "agent-cursor"                                          |
  | sessionId       | "chat-123"                                              |
  | assembledPrompt | "Directives système\n\nRefactorise le composant Button" |
  | model           | "test-model-custom"                                     |
Quand "cursorAdapter.buildCommand(ctx)" est appelé
Alors l'objet retourné contient :
  | propriété | valeur attendue                                                                                                                                  |
  | command   | "/usr/local/bin/agent"                                                                                                                           |
  | args      | ["-p", "--output-format", "json", "--model", "test-model-custom", "--resume", "chat-123", "Directives système\n\nRefactorise le composant Button"] |
  | cwd       | "/var/projects/my-app"                                                                                                                           |

Étant donné un contexte d'exécution identique avec un modèle entouré d'espaces "  test-model-spaced  "
Quand "cursorAdapter.buildCommand(ctx)" est appelé
Alors les arguments contiennent ["--model", "test-model-spaced"] avec la valeur nettoyée

Étant donné un contexte d'exécution sans propriété "model" ou avec model égal à "   "
Quand "cursorAdapter.buildCommand(ctx)" est appelé
Alors les arguments retournés sont ["-p", "--output-format", "json", "--resume", "chat-123", "Directives système\n\nRefactorise le composant Button"]
Et aucun argument "--model" n'apparaît dans la liste

Étant donné l'adaptateur CursorCLIAdapter sollicité pour la découverte des modèles
Quand "cursorAdapter.listModels()" est invoqué pour la première fois
Alors la promesse résout une liste de chaînes de caractères non vides correspondant aux identifiants disponibles
Et un deuxième appel à "cursorAdapter.listModels()" retourne immédiatement la liste depuis le cache mémoire sans réexécuter le CLI

Étant donné un échec du CLI ou un binaire absent
Quand "cursorAdapter.listModels()" est invoqué
Alors la méthode intercepte l'erreur et retourne un tableau vide []
```

## Données

| Élément | Valeur |
|---|---:|
| Binaire | `"/usr/local/bin/agent"` |
| `ctx.workspacePath` | `"/var/projects/my-app"` |
| `ctx.sessionId` | `"chat-123"` |
| `ctx.assembledPrompt` | `"Directives système\n\nRefactorise le composant Button"` |
| Modèle nominal | `"test-model-custom"` |
| Modèle avec espaces | `"  test-model-spaced  "` |
| Modèle vide | `""`, `"   "`, `undefined` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Arguments avec modèle nominal | `["-p", "--model", "test-model-custom", "--resume", "chat-123", prompt]` | Insertion de `['--model', 'test-model-custom']` |
| Arguments avec modèle espacé | `["-p", "--model", "test-model-spaced", "--resume", "chat-123", prompt]` | Insertion avec `trim()` |
| Arguments sans modèle | `["-p", "--resume", "chat-123", prompt]` | Aucun argument `--model` injecté |
| `listModels` succès (1er appel) | `["test-model-a", "test-model-b", ...]` | Extraction des modèles du CLI sans catalogue figé |
| `listModels` succès (2ème appel) | Identique au 1er appel | Retour direct depuis le cache Node.js (0 spawn) |
| `listModels` échec / absence | `[]` | Tableau vide sans inventer de catalogue factice |

## Ce que ce cas ne vérifie pas

- La persistance disque sous `.agents/data/profils/` → `SPEC-DATA-01` et `CASE-DATA-01-2` ;
- Le rendu et l'autocomplétion dans l'IHM web → `SPEC-UI-01` et `CASE-UI-01-13` ;
- L'évaluation des conditions de sortie → `SPEC-ENG-03`.

