# CASE-ADPT-06-4 — Énumération des modèles supportés via `listModels` Claude avec cache LRU

**Spécification :** `SPEC-ADPT-06`  
**Critère d'acceptation :** `AC-ADPT-06-5`  
**Type :** acceptation  
**Niveau de risque :** moyen  
**ADR liés :** `ADR-002`, `ADR-006`, `ADR-016`  

---

## Ce que ce cas protège

La méthode `listModels()` de `ClaudeCLIAdapter` doit permettre au serveur ClientsBox d'exposer la liste des modèles d'IA Claude Code supportés pour alimenter les sélecteurs de formulaires UI (`GET /api/models`).  
Ce cas garantit :
1. La restitution des identifiants et alias officiels de modèles supportés (`sonnet`, `opus`, `haiku`, `fable`, `claude-sonnet-4-5-20250929`, `claude-opus-4-5-20251101`, `claude-haiku-4-5-20251001`).
2. La déduplication et le nettoyage des chaînes (`trim()`).
3. La mémorisation Node.js : après un premier appel, la liste est conservée en mémoire vive via un cache LRU avec TTL d'une heure (`ADR-016`), et les appels ultérieurs répondent instantanément sans recalcul.
4. La résilience totale : si le binaire est inaccessible ou renvoie une erreur, la méthode bascule sur un tableau vide `[]` sans lever d'exception.

---

## Cas

```gherkin
Étant donné un environnement où l'adapter Claude est configuré
Quand "adapter.listModels()" est exécuté pour la première fois
Alors la promesse résout la liste officielle des modèles Claude supportés
Et un second appel à "adapter.listModels()" retourne immédiatement la même liste depuis le cache mémoire Node.js

Étant donné un environnement où le binaire Claude n'est pas accessible
Quand "adapter.listModels()" est exécuté
Alors la méthode bascule sur un tableau vide [] sans propager d'exception
```

---

## Données

| Élément | Valeur |
|---|---:|
| Modèles supportés de base | `['sonnet', 'opus', 'haiku', 'fable', 'claude-sonnet-4-5-20250929', 'claude-opus-4-5-20251101', 'claude-haiku-4-5-20251001']` |
| TTL de cache | `3 600 000 ms` (1 heure) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Liste des modèles au 1er appel | Tableau des identifiants supportés | Résolution nominale |
| Liste des modèles au 2nd appel | Tableau identique issu du cache LRU | Accès mémoire 0 ms |
| Échec binaire | `[]` | Fallback résilient |

---

## Ce que ce cas ne vérifie pas

- La génération de commande de spawn → `CASE-ADPT-06-2` ;
- Le streaming live et le SAC → `CASE-ADPT-06-3` ;
- La capture de session conversationnelle → `CASE-ADPT-06-5`.

