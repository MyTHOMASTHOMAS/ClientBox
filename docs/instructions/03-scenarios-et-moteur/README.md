# Scénarios & moteur

Un scénario est un **graphe orienté** de blocs et de connexions. Il s'édite dans le Studio (`#/scenarios/<id>`) ou directement dans `.agents/data/scenarios/<id>.json`.

## Du graphe visuel au fichier JSON

- L'UI et le fichier JSON décrivent le **même** document
- Les champs runtime (`status` des nœuds) ne sont **jamais** persistés
- L'exécution suit les règles du moteur (Join, `power`, politiques, Stop)

## Sommaire de la section

| Guide                                                | Contenu                                           |
| ---------------------------------------------------- | ------------------------------------------------- |
| [Studio Canvas](./01-studio-canvas.md)               | Pan/Zoom, inspecteur, câblage, clés, verrouillage |
| [Schéma & 6 blocs](./02-schema-scenario-et-blocs.md) | Contrat JSON + invariants de validation           |
| [Moteur & exécution](./03-moteur-et-execution.md)    | Join, power, Command, CallScenario, Terminal SSE  |
| [Export documentation](./04-export-documentation.md) | Page `#/instructions` et miroir `.agents/docs/`   |

**Règle d'or** : exactement **un** bloc `Start` par scénario ; tout bloc hors `Start` sans entrée reste inactif.
