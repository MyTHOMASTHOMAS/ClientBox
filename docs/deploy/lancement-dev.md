# Lancement depuis les sources

## Après build

```bash
npm start
# équivalent : node dist/clientsbox.js
```

## Mode développement (watch)

```bash
npm run dev
```

Relance le build à chaque modification et redémarre `node dist/clientsbox.js`. Le `workspacePath` est la racine du dépôt.

## Options CLI

```bash
node dist/clientsbox.js --port 8080
```

Si le port est déjà pris (`EADDRINUSE`), le processus s'arrête immédiatement (pas de port de secours).

## Accès UI

Le terminal OS affiche l'URL (ex. `http://127.0.0.1:2974/`). Aucune ouverture automatique de navigateur.

## Arrêt

`Ctrl+C` (`SIGINT`) : fermeture HTTP + arrêt des sous-processus CLI.

## Suite

- Usage binaire / produit : [`docs/instructions/`](../instructions/README.md)
- [Index deploy](./README.md)
