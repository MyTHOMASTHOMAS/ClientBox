# Build et livrable

## Production

```bash
npm run build
```

Produit le fichier standalone :

```text
dist/clientsbox.js
```

Le front (Preact / Tailwind) et les assets sont **embarqués en mémoire** dans ce fichier (pas de dossier `public/` à déployer).

La documentation d'utilisation sous `docs/instructions/` est destinée à être embarquée pour l'UI / l'export ; le dossier `docs/deploy/` **n'est pas** la doc opérateur et n'a pas vocation à être exporté vers `.agents/docs/`.

## Qualité (optionnel avant livraison)

```bash
npm run quality
npm test
```

## Déploiement dans un projet hôte

1. Copier `dist/clientsbox.js` vers `<projet>/.agents/clientsbox.js` (emplacement typique).
2. Lancer depuis la **racine du projet hôte** :

```bash
node .agents/clientsbox.js
```

3. Pour l'usage quotidien, suivre [`docs/instructions/`](../instructions/README.md).

## Suite

- [Lancement depuis les sources](./lancement-dev.md)
- [Index deploy](./README.md)
