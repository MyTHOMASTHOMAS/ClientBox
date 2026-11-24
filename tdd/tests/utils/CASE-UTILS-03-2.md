# CASE-UTILS-03-2 — Gestion de la rétention temporelle (TTL par domaine et surcharge) et politique d'éviction LRU

**Spécification :** `ADR-016` / `CR-005` (Service de cache interne Node.js à base de domaines LRU)  
**Critère d'acceptation :** `AC-UTILS-03-2`  
**Type :** unitaire / technique  
**Niveau de risque :** modéré  
**Couche DAG :** `2-utils` (`src/utils/cache/`)  

---

## Ce que ce cas protège

Le service de cache interne `internalCache` doit garantir la péremption automatique des données (TTL) et l'éviction par ancienneté d'accès (LRU) afin de limiter l'empreinte mémoire du processus serveur Node.js. Ce cas de test protège :
1. **L'expiration par TTL de domaine** : Une entrée associée à un domaine doté d'un `ttl` (ex. 50 ms dans le test, 1 heure en production) devient automatiquement inaccessible (`undefined`) après dépassement du temps imparti.
2. **Le repli sur le TTL de base** : Lorsqu'un domaine ne spécifie aucun TTL individuel, le TTL global `baseConfig.ttl` s'applique de façon déterministe.
3. **La surcharge ponctuelle du TTL à l'écriture** : La méthode `set(args, data, overrideTtl)` permet d'imposer un TTL spécifique prioritaire sur la valeur configurée au niveau du domaine.
4. **L'éviction LRU sous contrainte de capacité (`max`)** : Lorsque le nombre d'entrées atteint la limite `baseConfig.max`, l'élément le moins récemment accédé (*Least Recently Used*) est évincé pour faire place à la nouvelle entrée.
5. **Le déterminisme des timers** : Le bon fonctionnement des expirations sans dérive lors de l'utilisation des fausses horloges de test (`vi.useFakeTimers()`).

---

## Cas

```gherkin
Étant donné un domaine "shortLived" configuré avec un TTL de 50 millisecondes
Quand on enregistre "cache.shortLived.set(['temp'], 'valeur')"
Et que le temps avance de 20 millisecondes
Alors "cache.shortLived.get(['temp'])" retourne toujours "valeur"
Et "cache.shortLived.has(['temp'])" retourne true

Étant donné la même entrée sous "shortLived"
Quand le temps avance de 40 millisecondes supplémentaires (total 60 ms > 50 ms)
Alors "cache.shortLived.get(['temp'])" retourne undefined
Et "cache.shortLived.has(['temp'])" retourne false

Étant donné un domaine configuré avec un TTL par défaut de 100 millisecondes
Quand on enregistre une entrée avec surcharge explicite "overrideTtl = 20"
Et que le temps avance de 30 millisecondes
Alors l'entrée est déjà expirée et retourne undefined

Étant donné un cache configuré avec une capacité maximale de max = 2 entrées
Et deux entrées "k1" et "k2" ajoutées dans le cache
Quand on lit "k1" (rendant "k2" la moins récemment utilisée)
Et qu'on insère une troisième entrée "k3"
Alors "k1" et "k3" restent présentes dans le cache
Et l'entrée "k2" a été évincée par la politique LRU
```

---

## Données

| Élément | Valeur |
|---|---:|
| TTL domaine court | `50 ms` |
| Avance temporelle intermédiaire | `20 ms` |
| Avance temporelle d'expiration | `40 ms` (total `60 ms`) |
| Surcharge `overrideTtl` | `20 ms` |
| Capacité maximale de test | `max: 2` |

---

## Résultat attendu, calculé à la main

| Instant / Condition | Clé inspectée | Valeur attendue | Motif |
|---|---|---:|---|
| $t = 20\text{ ms} < 50\text{ ms}$ | `temp` | `'valeur'` | TTL non expiré |
| $t = 60\text{ ms} > 50\text{ ms}$ | `temp` | `undefined` | Expiration par TTL de domaine |
| $t = 30\text{ ms} > 20\text{ ms}$ | `overrideKey` | `undefined` | Expiration par surcharge `overrideTtl` |
| Après insertion de `k3` (capacité 2) | `k1` | `'val1'` | Conservé (récemment lu) |
| Après insertion de `k3` (capacité 2) | `k2` | `undefined` | Évincé par la politique LRU |
| Après insertion de `k3` (capacité 2) | `k3` | `'val3'` | Présent (dernière insertion) |

