# Installation (sources)

## Prérequis

- **Node.js** version **24** ou supérieure
- Un binaire **cursor-cli** (ou `cursor-agent`) installé et exécutable
- Accès au dépôt source ClientsBox

## Installation des dépendances

Depuis la racine du dépôt :

```bash
npm install
cp env/.env.example env/.env
```

Renseignez ensuite `CURSOR_CLI_BIN` dans `env/.env` — voir [Configuration](./configuration.md).

## Modes

| Mode              | Objectif                                                          |
| ----------------- | ----------------------------------------------------------------- |
| Développement     | Itérer sur le code (`npm run dev`)                                |
| Production locale | Produire et lancer le livrable (`npm run build` puis `npm start`) |
| Standalone hôte   | Copier `dist/clientsbox.js` dans `.agents/` d'un projet tiers     |

## Suite

- [Configuration](./configuration.md)
- [Build et livrable](./build-et-livrable.md)
- [Index deploy](./README.md)
