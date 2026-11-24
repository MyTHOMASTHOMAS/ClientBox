# Spécification Technique — Module de Journalisation Isomorphique (`src/utils/logger/`)

> **Document de référence :** `tdd/docs/utils/logger-spec.md`  
> **Méthodologie TDD :** Chaîne `CDC/ADR → SPEC → CASE → TEST → CODE`  
> **Domaine :** `UTILS` (Palier 2 — Primitives Techniques Pures)  
> **Contrat d'architecture :** `SPEC-ARCH-01`, `SPEC-ARCH-05`, `SPEC-ARCH-06`, `SPEC-ARCH-07`, `SPEC-ARCH-08`  
> **Décision d'architecture liée :** [`ADR-014`](../adr/ADR-014-catalogue-evenements-logger-et-separation-severite.md)  

---

## 1. Contexte & Rôle du Module

Le module de journalisation structurée `src/utils/logger/` fournit aux différentes couches de l'application ClientsBox (serveur Node.js et client web navigateur) un mécanisme de traçabilité unifié, typé, et contrôlable via variables d'environnement.

### 1.1 Principes Directeurs
1. **Isomorphisme Serveur / Client :**
   - **Serveur (Node.js)** : mise en forme terminal avec codes couleurs ANSI, horodatage au format français (`HH:mm:ss.SSS`), icône de niveau, service en majuscules entre crochets `[SERVICE]`, tags contextuels `[tag1] [tag2]` et sérialisation indentée des objets `data`.
   - **Client (Navigateur)** : journalisation native propre vers la console DevTools (`console.info`, `console.warn`, `console.error`, `console.debug`), préservant l'interactivité d'inspection d'objets du moteur JavaScript hôte.
2. **Couche d'architecture Palier 2 (`src/utils/`) :**
   - Dépendance unilatérale stricte : `src/utils/logger/` ne dépend d'aucun concept métier de ClientsBox (`Agent`, `Scenario`, `BlockMessage`).
   - Aucune dépendance npm externe : pur code TypeScript/JavaScript natif.
   - Modularité et compacité : chaque fichier est strictement $\le 150$ lignes avec inférence native des types de retour (`CASE-ARCH-06-1`) et balise `@pendingAudit` (`CASE-ARCH-08-2`).
3. **Kill-Switch Global via Variable d'Environnement (`LOGS_DISABLED`) :**
   - Présence de la variable d'environnement `LOGS_DISABLED=true` (ou `LOGS_ENABLED=false`).
   - Support d'extinction côté navigateur via `window.__LOGS_DISABLED__ = true` ou `localStorage.getItem('LOGS_DISABLED') === 'true'`.
   - Coupure immédiate à la source dans la garde `shouldLog` : aucun appel à `console.*` n'est émis.

---

## 2. Niveaux de Gravité & API

### 2.1 Niveaux Supportés

| Niveau | Icône | Style ANSI (Node) | Méthode console | Comportement en production |
| :--- | :---: | :---: | :---: | :--- |
| `debug` | 🐛 | Gris atténué (`\x1b[90m`) | `console.debug` | Silencieux par défaut hors environnement dev |
| `info` | ℹ️ | Cyan (`\x1b[36m`) | `console.info` | Actif |
| `success` | ✅ | Vert (`\x1b[32m`) | `console.info` | Actif (mise en valeur des succès opérationnels) |
| `warn` | ⚠️ | Jaune (`\x1b[33m`) | `console.warn` | Actif |
| `error` | 🚨 | Rouge (`\x1b[31m`) | `console.error` | Actif (affichage d'erreurs ou d'exceptions) |

### 2.2 Méthodes de l'Instance `Logger`

- `logger.debug(message, options?)`
- `logger.info(message, options?)`
- `logger.warn(message, options?)`
- `logger.error(message, options?)`
- `logger.success(message, options?)`
- `logger.with(...tags | options)` : dérive un sous-logger enrichi de tags ou de contraintes `isDevOnly` / `enables`.
- `logger.group(title, fn, options?)` : englobe l'exécution d'un bloc synchrone dans un groupe console repliable (`console.group` / `console.groupEnd`).
- `logger.timed(label, asyncFn, options?)` : exécute une fonction asynchrone, mesure son temps d'exécution en millisecondes et consigne le résultat avec mention `(Xms)`.

---

## 3. Matrice de Configuration d'Environnement

| Variable | Type | Défaut | Description |
| :--- | :--- | :--- | :--- |
| `LOGS_DISABLED` | `boolean` (`"true"` / `"false"`) | `"false"` | **Kill-switch global**. Désactive l'intégralité des sorties de log si positionné à `"true"`. |
| `LOGS_ENABLED` | `boolean` (`"true"` / `"false"`) | `"true"` | Complémentaire à `LOGS_DISABLED`. Si positionné à `"false"`, les logs sont également désactivés. |
| `NODE_ENV` | `string` | `"development"` | Mode d'exécution standard. Si `"production"`, le niveau `debug` est filtré. |

---

## 4. Organisation des Fichiers du Socle Logger

```text
src/utils/logger/
├── logger.config.ts          # Configuration des niveaux, icônes et codes ANSI
├── logger.factory.ts         # Fabrique d'instances Logger et composition
├── logger-formatter.utils.ts # Formatage de l'horodatage et des tags
├── logger.index.ts           # Point d'entrée public du socle logger
├── logger-state.utils.ts     # Gestion d'état interne, dérivation et fusion des options
├── logger-runtime.utils.ts   # Détection isomorphique (Node/Navigateur, Dev, LOGS_DISABLED)
├── logger-filter.utils.ts    # Garde d'évaluation avant émission vers la console
├── logger.types.ts           # Contrats de types publics et signatures du logger
└── logger-writer.utils.ts    # Formatage final et écriture vers la console hôte
```

---

## 5. Spécification `SPEC-UTILS-02` : Catalogue d'Événements Sémantiques par Sévérité

Conformément à l'[`ADR-014`](../adr/ADR-014-catalogue-evenements-logger-et-separation-severite.md), les appels de journalisation dans le code applicatif s'effectuent au travers d'un catalogue d'événements sémantiques typés.

### 5.1 Segmentation Physique des Répertoires

Les fonctions d'événements sont réparties dans trois sous-dossiers distincts selon leur gravité :

```text
src/utils/logger/events/
├── errors/                          # Sous-dossier 1 : Échecs et exceptions (niveau 'error')
│   ├── agent-error.event.ts         # Événements d'erreurs des agents / CLI
│   ├── runner-error.event.ts        # Événements d'erreurs du runner de scénario
│   ├── server-error.event.ts        # Événements d'erreurs HTTP / SSE
│   ├── storage-error.event.ts       # Événements d'erreurs de persistance disque
│   └── ui-error.event.ts            # Événements d'erreurs frontend / canvas
│
├── info/                            # Sous-dossier 2 : Opérations nominales (niveaux 'info' / 'success')
│   ├── agent-info.event.ts          # Processus démarré, fin de commande, signal reçu
│   ├── runner-info.event.ts         # Démarrage, fin de scénario, exécution de bloc réussie
│   ├── server-info.event.ts         # Démarrage serveur, route appelée, connexion SSE
│   ├── storage-info.event.ts        # Ressource sauvegardée, fichier purgé
│   └── ui-info.event.ts             # Requête client, action canvas
│
├── debug/                           # Sous-dossier 3 : Diagnostic détaillé (niveau 'debug')
│   ├── agent-debug.event.ts         # Traces brutes du flux stdout/stderr
│   ├── runner-debug.event.ts        # Sac d'entrées, état de synchronisation Join
│   ├── server-debug.event.ts        # En-têtes HTTP, pattern de route matché
│   ├── storage-debug.event.ts       # Cache et synchronisation stockage
│   └── ui-debug.event.ts            # Traces de charge utile côté navigateur
│
└── index.ts                         # Export consolidé de l'ensemble du catalogue
```

### 5.2 Contrat d'Ingénierie des Fonctions d'Événement

1. **Appel en une ligne :** Chaque fonction d'événement encapsule la composition du message, les tags et les données associées. Dans le code métier, l'appel s'effectue en une seule ligne :
   ```ts
   logScenarioStarted(sc.id, sc.nodes.length);
   ```
2. **Arité bornée ($\le 3$) :** Chaque fonction n'accepte qu'un maximum de 3 paramètres positionnels (`id: string, count: number, ms: number`) ou un objet de payload unique.
3. **Typage strict des erreurs :** Les fonctions du sous-dossier `errors/` acceptent un paramètre `error: unknown` (obligation `CASE-ARCH-06-3`).
4. **Langue française (`REQ-007`) :** Tous les messages générés sont rédigés en langue française claire et concise.

### 5.3 Critères d'Acceptation (`AC-UTILS-02`)

- **`AC-UTILS-02-1` (Isolation par répertoires) :** Les fonctions de log de niveau `error` sont situées exclusivement sous `events/errors/`, les fonctions `info` et `success` sous `events/info/`, et les fonctions `debug` sous `events/debug/`.
- **`AC-UTILS-02-2` (Événements Info & Succès) :** Les fonctions de `events/info/` invoquent le logger interne au niveau `info` ou `success` avec tags et données contextuelles associées.
- **`AC-UTILS-02-3` (Événements d'Erreur) :** Les fonctions de `events/errors/` invoquent le logger interne au niveau `error` et transmettent fidèlement l'exception ou l'objet de cause à la console.
- **`AC-UTILS-02-4` (Respect du Kill-Switch) :** L'activation de `LOGS_DISABLED=true` (ou `LOGS_ENABLED=false`) inhibe l'ensemble des fonctions du catalogue sans lever d'exception.
