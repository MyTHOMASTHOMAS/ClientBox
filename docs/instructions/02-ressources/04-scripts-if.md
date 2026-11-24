# Scripts conditionnels (`if/<id>.js`) & structure du sac

Les scripts If pilotent les blocs `If` : ils reçoivent le **sac d'entrées** et retournent un booléen.

## Rôle et consultation dans l'UI (`#/resources/scripts`)

- Visualisation sécurisée (lecture) depuis l'interface
- **Création et édition** : directement sur disque dans `.agents/data/if/<id>.js`
- Pas d'API `POST`/`PUT` pour les scripts (lecture + suppression uniquement)

Identifiant = nom de fichier sans `.js` (ex. fichier `tests-ok.js` → `ifScriptId: "tests-ok"`).

## Formats JavaScript acceptés

### ESM (export default)

```js
export default function (sac) {
  return true;
}
```

### CommonJS

```js
module.exports = function (sac) {
  return false;
};
```

Contrat :

- Fonction **synchrone** (pas `async` : une Promise serait coercée à `true`)
- Retour coercé via `Boolean(...)` : `true` → port `0` (Vrai), `false` → port `1` (Faux)
- Rechargement à chaud des `.js` (cache CommonJS invalidé à chaque exécution)

## Structure exacte du paramètre `sac` (`BlockInputBag`)

```ts
type BlockInputBag = Record<ConnectionKey, BlockMessage>;

interface BlockMessage {
  blockType: 'start' | 'run' | 'if' | 'clearContext' | 'callScenario' | 'command';
  value: unknown;
  power: number; // 0 ou 1
}
```

- Indexation par la **`key`** de chaque connexion entrante (`"0"`, `"1"`, ou clé nommée)
- Aucune propriété `key` sur le message lui-même

### Contenu de `value` selon le bloc source

| `blockType`    | `value` typique                | `power`                           |
| -------------- | ------------------------------ | --------------------------------- |
| `start`        | `null`                         | `1`                               |
| `run`          | `string` (sortie agent parsée) | `1`                               |
| `if`           | `null`                         | `1` branche active / `0` inactive |
| `clearContext` | `null`                         | `1`                               |
| `command`      | `null`                         | `1` (si code sortie `0`)          |
| `callScenario` | `null`                         | `1` (sous-scénario `completed`)   |

## Exemples copiables

### Exemple 1 (ESM) — clé par défaut `"0"`

```js
export default function (sac) {
  const text = sac['0']?.value;
  return typeof text === 'string' && text.includes('OK');
}
```

### Exemple 2 (ESM) — clés nommées multi-entrées

```js
export default function (sac) {
  const code = sac.code?.value;
  const tests = sac.tests?.value;
  return (
    typeof code === 'string' &&
    typeof tests === 'string' &&
    code.includes('OK') &&
    tests.includes('PASS')
  );
}
```

### Exemple 3 (CommonJS) — extraction JSON sécurisée

```js
module.exports = function (sac) {
  const raw = sac['0']?.value;
  if (typeof raw !== 'string') return false;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.status === 'ok';
  } catch {
    return false;
  }
};
```

## Pièges courants

| Piège                                                   | Effet                                   |
| ------------------------------------------------------- | --------------------------------------- |
| Clé renommée / renumérotée après suppression d'un câble | `sac["0"]` devient `undefined`          |
| Oubli de `?.`                                           | Exception runtime → bloc `If` en erreur |
| Retour non booléen intentionnel (`"false"`, `{}`)       | Coercé à `true`                         |
| Fonction `async`                                        | Promise truthy → toujours branche Vrai  |
| `ifScriptId` vide                                       | Erreur : aucun script configuré         |
