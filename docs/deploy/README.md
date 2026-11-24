# Déploiement & build — ClientsBox

Documentation réservée à la **construction** et au **déploiement** du projet (dépôt source, pipeline npm, livrable `clientsbox.js`).

> L'utilisation du **binaire** déjà construit est documentée séparément dans [`docs/instructions/`](../instructions/README.md).

## Index

| Page                                               | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- |
| [Installation](./installation.md)                  | Prérequis, `npm install`, modes dev / standalone   |
| [Conteneurisation Docker](./docker.md)             | Image officielle, Docker Compose, volume auth & CI |
| [Configuration](./configuration.md)                | Variables `env/.env` et runtime dynamique          |
| [Build et livrable](./build-et-livrable.md)        | `npm run build`, artefact `dist/clientsbox.js`     |
| [Lancement depuis les sources](./lancement-dev.md) | `npm start`, `npm run dev`, options CLI            |

## Authentification & Approbation rapide des CLI (Docker)

Pour connecter vos 4 CLI d'IA et approuver le dossier de travail actuel sous Docker :

```bash
bash scripts/docker/clientsbox-auth.sh
```

Cette commande ouvre un shell interactif directement positionné dans votre dossier de travail pour exécuter `cursor-agent` (approbation _Workspace Trust_ / `cursor-agent login`), `claude login`, `agy auth` et `codex login`. Les autorisations sont persistées dans le volume partagé `clientsbox-cli-auth`. Voir [Conteneurisation Docker](./docker.md#3-authentification-partagée--approbation-de-workspace).

## Frontière

| Dossier              | Public                      | Contenu                                          |
| -------------------- | --------------------------- | ------------------------------------------------ |
| `docs/deploy/`       | Développeurs / intégrateurs | Build, env de build, déploiement du JS           |
| `docs/instructions/` | Opérateurs du binaire       | UI, ressources, scénarios, exécution, export doc |
