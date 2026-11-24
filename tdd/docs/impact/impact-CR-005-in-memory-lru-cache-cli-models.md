# Analyse d'impact — CR-005 : Cache LRU Node.js avec TTL pour modèles de CLI et suppression des catalogues statiques de secours

**Demande du client :** Supprimer les modèles déclarés par défaut en dur dans les adaptateurs, ne proposer aucune fausse liste en cas d'absence de CLI, et mémoriser la liste dans le backend Node.js via un service de cache LRU multi-domaines avec TTL (portage du service MedialogApi).  
**Reçue le :** 2026-11-07  
**Rédigée par :** Antigravity & Autrement  

---

> **Interdiction de modifier le code avant que cette analyse soit complète.**
>
> La modification descend la chaîne dans cet ordre : cahier des charges → specs →
> UML → modèle de données → cas de test → tests → code. Commencer par le code,
> c'est perdre la trace de pourquoi il a changé — et c'est exactement ce que ce
> module cherche à vous faire éviter.

---

## 1. Ce que le client demande, reformulé

1. **Suppression des catalogues par défaut en dur** : Les listes prédéfinies (`DEFAULT_CURSOR_MODELS`, `DEFAULT_ANTIGRAVITY_MODELS`, `DEFAULT_MODEL_SUGGESTIONS`) deviennent rapidement obsolètes face à l'évolution constante des modèles d'IA et induisent l'utilisateur en erreur. Si un CLI n'est pas installé ou ne renvoie aucun modèle, le système doit renvoyer un tableau vide `[]` sans inventer de catalogue factice.
2. **Champ libre préservé dans l'IHM** : En l'absence de suggestions (`[]`), l'interface utilisateur web continue de permettre la saisie manuelle de n'importe quel identifiant de modèle dans le champ de profil.
3. **Mémorisation en mémoire vive Node.js (*In-Memory Caching*)** : Après la première découverte réussie d'un CLI, la liste des modèles doit être mise en cache dans le processus Node.js pour éviter de relancer un sous-processus système lourd à chaque requête HTTP `GET /api/models`.
4. **Portage du service de cache LRU (`internalCache`)** : Adapter et importer le composant issu de `MedialogApi` (`src/utils/internalCache`) sous `src/utils/cache/` avec `@pendingAudit`, en le rendant conforme aux contraintes strictes d'architecture (notamment zéro `any` `SPEC-ARCH-06-3`).
5. **Étanchéité du client front-end** : Le navigateur web reste totalement ignorant de la mécanique de cache. Il continue d'appeler l'API REST `GET /api/models` de façon transparente et standard.

---

## 2. Questions posées au client

| # | Question | Réponse |
|---|---|---|
| 1 | Selon toi doit-on utiliser un service de cache spécifique ? | Oui, portage et adaptation du service `internalCache` issu de `MedialogApi` basé sur `lru-cache`. |
| 2 | Chaque adaptateur aura-t-il donc son propre cache ? | Oui par domaine (`cliModels`), chaque adaptateur gère ou consomme sa clé spécifique de manière isolée pour éviter les interférences. |
| 3 | Le cache doit-il être géré côté navigateur ou Node.js ? | Exclusivement côté Node.js (backend) dans l'adaptateur/service. Le front ne doit rien savoir du cache et fait ses requêtes HTTP normalement. |

---

## 3. Impact — cahier des charges

| Exigence | Impact | Action |
|---|---|---|
| `REQ-027` | inchangée | Le contrat `CLIAdapter` reste fondé sur `listModels?(): Promise<readonly string[]>`. |
| `REQ-028` | modifiée | L'exécution système via spawner n'est déclenchée que si le cache de modèles Node.js est froid ou expiré (TTL). |
| `R-18` | inchangée | Extensibilité des adaptateurs préservée. |
| `R-28` | modifiée | Le registre consolide les modèles découverts par les adaptateurs sans imposer de fallback statique prédéfini ; renvoie `[]` si aucun modèle n'est détecté. |

---

## 4. Impact — spécifications

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| `SPEC-ADPT-01` | **modifiée** | Ajout de la règle de mémorisation en cache Node.js avec TTL pour `listModels()` ; obligation de renvoyer `[]` en cas d'absence de modèle détecté (interdiction des listes statiques de secours factices). |
| `SPEC-ADPT-02` | **modifiée** | Spécialisation Cursor CLI : suppression de `DEFAULT_CURSOR_MODELS`. Retourne `[]` si le binaire est absent ou échoue. Met en cache la liste retournée avec un TTL de 1 heure. |
| `SPEC-ADPT-04` | **modifiée** | Spécialisation Antigravity CLI : suppression de `DEFAULT_ANTIGRAVITY_MODELS`. Retourne `[]` si `agy models` échoue. Met en cache la liste retournée avec un TTL de 1 heure. |
| `SPEC-SRV-02` | **modifiée** | Route `GET /api/models` : retourne `200 []` (JSON vide) si aucun adaptateur n'a pu résoudre de modèle. |
| `SPEC-UI-01` | **modifiée** | Composant de recherche de modèles (`model-search.helper.ts`) : suppression de `DEFAULT_MODEL_SUGGESTIONS`. Si l'API renvoie `[]`, aucune suggestion n'est affichée mais la saisie reste ouverte. |
| `SPEC-ARCH-06` | **inchangée** | Bannissement strict de `any` dans le code du cache (`SPEC-ARCH-06-3`) : conversion intégrale avec `unknown` et génériques TypeScript sûrs. |
| `SPEC-ARCH-08` | **modifiée** | Ajout de 3 nouveaux fichiers sous `src/utils/cache/` tous annotés avec la balise `/** @pendingAudit ... */`. |

---

## 5. Impact — conception & architecture

| Artefact | Impact | Ce qui change |
|---|---|---|
| `package.json` | **modifié** | Ajout de la dépendance de production `"lru-cache": "^11.5.2"`. |
| `src/utils/cache/internal-cache.types.ts` | **nouveau** | Déclaration des types génériques `CacheBaseConfig`, `CacheDomainConfig`, `CacheDomainApi`, `InternalCacheOptions`, `InternalCacheInstance`. Zéro `any`. |
| `src/utils/cache/internal-cache.factory.ts` | **nouveau** | Fabrique `createInternalCache` et fonction utilitaire `defineCacheConfig` avec découpage d'arité et de complexité cyclomatique. |
| `src/utils/cache/index.ts` | **nouveau** | Barrel d'exportation pour le module de cache utilitaire. |
| `src/utils/cache/app-cache.ts` | **nouveau** | Instance de cache applicatif Node.js déclarant le domaine `cliModels` avec TTL de 1h. |
| `src/lib/adapters/cursor-cli.adapter.ts` | **modifié** | Consommation du cache Node.js avec TTL dans `listModels()`. Suppression de `DEFAULT_CURSOR_MODELS` et repli sur `[]`. |
| `src/lib/adapters/antigravity-cli.adapter.ts` | **modifié** | Consommation du cache Node.js avec TTL dans `listModels()`. Suppression de `DEFAULT_ANTIGRAVITY_MODELS` et repli sur `[]`. |
| `src/services/adapter-registry.service.ts` | **modifié** | Suppression du fallback de modèles à la ligne 72. Retour direct de `allModels` (qui sera `[]` si aucun modèle n'est découvert). |
| `src/ui/components/profiles/model-search.helper.ts` | **modifié** | Suppression de `DEFAULT_MODEL_SUGGESTIONS`. Retourne `[]` si l'API renvoie `[]`. |

---

## 6. Impact — tests

| Cas de test | Impact | Ce qui change |
|---|---|---|
| `tests/units/utils/internal-cache.test.ts` | **à écrire** | Suite de tests unitaires complète pour la fabrique de cache LRU : `get`, `set`, `has`, `delete`, isolation multi-domaines, respect du TTL et éviction. |
| `CASE-ADPT-01-2` / `tests/units/adpt/CASE-ADPT-01-2.test.ts` | **modifié** | Vérification que `listModels()` renvoie `[]` en cas d'échec du binaire Cursor (au lieu de `DEFAULT_CURSOR_MODELS`) et vérification du cache Node.js (pas de deuxième exécution). |
| `CASE-ADPT-04-2` / `CASE-ADPT-04-4` | **modifié** | Vérification que `listModels()` d'Antigravity renvoie `[]` en cas d'absence du binaire et que les appels répétés sont servis depuis le cache. |
| `tests/units/srv/CASE-SRV-02-12.test.ts` | **modifié** | Vérification que `GET /api/models` renvoie `200 []` si aucun modèle n'est disponible. |

---

## 7. Impact — code

| Composant | Impact |
|---|---|
| `package.json` | Ajout de `lru-cache: ^11.5.2` dans les dépendances. |
| `src/utils/cache/*` | Implémentation du service utilitaire de cache LRU réécrit sans `any`. |
| `src/lib/adapters/cursor-cli.adapter.ts` | Intégration du cache et purge des modèles statiques. |
| `src/lib/adapters/antigravity-cli.adapter.ts` | Intégration du cache et purge des modèles statiques. |
| `src/services/adapter-registry.service.ts` | Retour fidèle `allModels` sans liste de secours codée en dur. |
| `src/ui/components/profiles/model-search.helper.ts` | Suppression des suggestions par défaut en dur. |

