# ADR-016 — Cache LRU en mémoire Node.js pour la découverte des modèles de CLI et suppression des catalogues statiques de secours

**Statut :** accepté  
**Date :** 2026-11-07  
**Décidé par :** Équipe d'architecture ClientsBox & Product Owner  

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous avons décidé, et pourquoi*.

---

## Contexte

Dans le cadre des évolutions CR-003 (support des modèles de profil) et CR-004 (adaptateur Antigravity CLI), les adaptateurs intègrent la méthode `listModels()` pour énumérer dynamiquement les modèles supportés par interrogation du CLI hôte (`cursor-agent --list-models`, `agy models`).

Deux problèmes d'architecture et d'expérience utilisateur majeurs ont été identifiés :
1. **Obsolescence et tromperie des catalogues par défaut en dur** : En cas d'échec ou d'absence du binaire CLI, les adaptateurs et le registre basculaient sur des constantes en dur (`DEFAULT_CURSOR_MODELS`, `DEFAULT_ANTIGRAVITY_MODELS`, `DEFAULT_MODEL_SUGGESTIONS`). Or, les catalogues des fournisseurs d'IA évoluent en permanence. Maintenir ces listes constitue une dette technique récurrente et proposer à l'utilisateur des modèles non supportés ou obsolètes dégrade la fiabilité du système. Si le CLI n'est pas disponible ou ne renvoie rien, le système doit renvoyer une liste vide `[]`.
2. **Coût système des spawns répétitifs** : Chaque requête HTTP vers `GET /api/models` relançait un sous-processus système complet (`runCliCommand`). Cela engendre une consommation inutile de CPU/mémoire et une latence de réponse.
3. **Étanchéité du client front-end** : Le navigateur web (`src/ui/`) ne doit pas gérer de cache complexe de modèles (pas de rétention locale dans `localStorage` ni d'état opaque). L'IHM doit simplement exécuter sa requête HTTP normale vers `GET /api/models` de façon agnostique (*stateless*).

---

## Options envisagées

### Option A — Cache interne ad-hoc par adaptateur sans TTL

| | |
|---|---|
| **Ce qu'elle apporte** | Simplicité minimale : une simple propriété d'instance `cachedModels: string[] \| null`. |
| **Ce qu'elle coûte** | Aucun rafraîchissement automatique sans redémarrage complet du serveur ClientsBox si de nouveaux modèles apparaissent ou si l'utilisateur installe son CLI en cours de session. |
| **Ce qu'elle rend difficile plus tard** | Impossibilité de mutualiser une politique de cache propre pour d'autres domaines futurs. |

### Option B — Service de cache LRU multi-domaines avec TTL en mémoire Node.js (`internalCache`)

| | |
|---|---|
| **Ce qu'elle apporte** | • Pattern éprouvé (portage du service `internalCache` de MedialogApi).<br>• Gestion déclarative par domaines fortement typés (`cliModels`).<br>• Rétention avec TTL (Time-To-Live) garantissant un rafraîchissement transparent à l'expiration.<br>• Éviction LRU automatique protégeant la mémoire vive Node.js.<br>• Transparence totale pour le front-end. |
| **Ce qu'elle coûte** | Ajout de la dépendance officielle `lru-cache` (`^11.5.2`) dans `package.json` et réécriture stricte sans mot-clé `any` (`SPEC-ARCH-06-3`). |
| **Ce qu'elle rend difficile plus tard** | Nécessite de maintenir une suite de tests unitaires pour la fabrique de cache. |

---

## Décision

Nous retenons l'**Option B** : intégrer le service de cache LRU multi-domaines avec TTL (`src/utils/cache/`) côté Node.js, supprimer tous les catalogues de modèles codés en dur dans les adaptateurs, le registre et l'IHM au profit d'un repli strict vers `[]`, et mémoriser les modèles découverts avec un TTL de 1 heure dans le domaine `cliModels`.

---

## Raisons

1. **Source unique de vérité (*Single Source of Truth*)** : Seul le CLI installé sur la machine fait foi. S'il n'est pas présent, le système ne ment pas à l'utilisateur : il retourne `[]`. L'IHM propose alors un champ de saisie libre sans suggestions artificielles.
2. **Performance et zéro latence** : Après la première découverte réussie, tous les appels HTTP `GET /api/models` sont servis en 0 ms depuis la RAM Node.js sans spawn de processus.
3. **Auto-actualisation par TTL** : Grâce au TTL de 1 heure (3 600 000 ms), si l'utilisateur installe de nouveaux modèles ou met à jour son CLI, ceux-ci sont automatiquement pris en compte à l'expiration sans intervention manuelle.
4. **Découplage Front/Back** : Le front continue de faire des requêtes HTTP universelles pures. Aucun état de cache n'est déporté dans le navigateur.

---

## Conséquences acceptées

- Ajout de la dépendance de production `lru-cache` (`^11.5.2`) dans `package.json`.
- Réécriture et typage strict du code issu de MedialogApi pour respecter scrupuleusement `SPEC-ARCH-06-3` (zéro `any`).
- Adaptation des tests unitaires `CASE-ADPT-01-2`, `CASE-ADPT-04-2` et `CASE-SRV-02-12` qui s'attendaient auparavant à recevoir une liste de modèles de secours en dur.

---

## Ce qui nous ferait revenir dessus

- Si les CLI locaux intégraient un protocole d'invalidation d'événements en temps réel via socket ou bus IPC rendant obsolète la temporisation par TTL.

