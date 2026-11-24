# CASE-UTILS-03-1 — Opérations CRUD élémentaires et isolation multi-domaines du cache interne LRU

**Spécification :** `ADR-016` / `CR-005` (Service de cache interne Node.js à base de domaines LRU)  
**Critère d'acceptation :** `AC-UTILS-03-1`  
**Type :** unitaire / technique  
**Niveau de risque :** modéré  
**Couche DAG :** `2-utils` (`src/utils/cache/`)  

---

## Ce que ce cas protège

Le module `src/utils/cache/` fournit une fabrique générique de cache mémoire multi-domaines (`createInternalCache`) basée sur `lru-cache`. Ce cas de test protège :
1. **L'initialisation opérationnelle** : `createInternalCache` configure et active les domaines déclarés via `defineCacheConfig`.
2. **Le cycle de vie CRUD complet** : `set(args, data)` stocke et retourne la valeur, `get(args)` restitue la valeur exacte, `has(args)` confirme la présence (`true`/`false`), et `delete(args)` supprime l'entrée avec succès.
3. **L'étanchéité multi-domaines** : Deux domaines distincts (`domainA` et `domainB`) utilisant les mêmes arguments de clé génèrent des clés internes préfixées `${domainKey}:${subKey}` sans risque de collision ni écrasement réciproque.
4. **La transformation de données à l'écriture** : Le hook optionnel `set: (data) => transform(data)` est appliqué lors du stockage en cache et sa valeur transformée est immédiatement persistée et retournée.
5. **La résilience sur clé absente** : L'interrogation d'une clé inconnue retourne `undefined` sur `get()`, `false` sur `has()`, et `delete()` retourne `false` sans lever d'exception.

---

## Cas

```gherkin
Étant donné une configuration de cache déclarant deux domaines "models" et "sessions"
Et une instance de cache créée via "createInternalCache"
Quand "cache.models.set(['antigravity'], ['gemini-2.5-pro', 'gemini-2.5-flash'])" est exécuté
Alors "cache.models.get(['antigravity'])" retourne le tableau exact des modèles
Et "cache.models.has(['antigravity'])" retourne true

Étant donné la clé "shared-key" enregistrée dans le domaine "models" avec la valeur "val-models"
Et la même clé "shared-key" enregistrée dans le domaine "sessions" avec la valeur "val-sessions"
Quand on interroge "cache.models.get(['shared-key'])" et "cache.sessions.get(['shared-key'])"
Alors le domaine "models" retourne "val-models"
Et le domaine "sessions" retourne "val-sessions" sans aucune collision

Étant donné un domaine "upper" configuré avec un transformateur "set: (val: string) => val.toUpperCase()"
Quand on exécute "cache.upper.set(['k1'], 'hello')"
Alors la valeur retournée et stockée est "HELLO"
Et "cache.upper.get(['k1'])" retourne "HELLO"

Étant donné une entrée présente dans le cache sous la clé "target"
Quand "cache.models.delete(['target'])" est appelé
Alors la méthode retourne true
Et les appels subséquents à "cache.models.has(['target'])" retournent false
Et "cache.models.get(['target'])" retourne undefined
```

---

## Données

| Élément | Valeur |
|---|---:|
| Capacité maximale `baseConfig.max` | `100` |
| Domaine A | `'models'`, `createKey: (cliId) => cliId` |
| Domaine B | `'sessions'`, `createKey: (sessionId) => sessionId` |
| Domaine C avec transformer | `'upper'`, `set: (s) => s.toUpperCase()` |
| Clé partagée de test | `'shared-key'` |

---

## Résultat attendu, calculé à la main

| Opération | Valeur attendue | Motif |
|---|---:|---|
| `cache.models.get(['antigravity'])` | `['gemini-2.5-pro', 'gemini-2.5-flash']` | Lecture directe de la valeur écrite |
| `cache.models.has(['antigravity'])` | `true` | Entrée présente en mémoire |
| `cache.models.get(['shared-key'])` | `'val-models'` | Isolation de clé préfixée `models:shared-key` |
| `cache.sessions.get(['shared-key'])` | `'val-sessions'` | Isolation de clé préfixée `sessions:shared-key` |
| `cache.upper.get(['k1'])` | `'HELLO'` | Application du transformateur à l'écriture |
| `cache.models.delete(['antigravity'])` | `true` | Suppression effective |
| `cache.models.has(['antigravity'])` post-suppression | `false` | Clé purgée du cache |
| `cache.models.get(['inconnue'])` | `undefined` | Absence de clé sans exception |
