# ADR-014 — Catalogue d'événements sémantiques et segmentation des logs par sévérité (errors, info, debug)

**Statut :** accepté  
**Date :** 26/10/2026  
**Décidé par :** Autrement (`U`)  

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC & ADR

| Référence | Rôle |
|---|---|
| `SPEC-ARCH-01` | DAG unilatéral d'étanchéité stricte des couches (Palier 2 : `src/utils/`) |
| `SPEC-ARCH-05` | Plafonds stricts de volumétrie : $\le 150$ lignes par fichier (`CASE-ARCH-05-1`), $\le 40$ lignes par corps de fonction (`CASE-ARCH-05-2`), arité $\le 3$ (`CASE-ARCH-05-3`) |
| `SPEC-ARCH-07` | Complexité cyclomatique CC $\le 10$, profondeur AST $\le 3$, nommage kebab-case |
| `SPEC-ARCH-08` | Inventaire légitime et traçabilité par balise `@pendingAudit` |
| `REQ-007`, `C-06` | Tous les messages et libellés intégralement en langue française |
| `ADR-001` | Socle applicatif Node.js standalone |
| `ADR-006` | Stratégie de tests unitaires déterministes et isolation des effets de bord |
| `logger-spec.md` | Spécification du service de log structuré isomorphe (`SPEC-UTILS-01`) |

Cet ADR **complète** les décisions d'architecture précédentes en définissant le modèle de consommation du logger applicatif dans l'ensemble de la base de code ClientsBox.

---

## Contexte

Après l'intégration du service de log isomorphique structuré (`src/utils/logger/`), se pose la question de son injection et de son utilisation au sein des couches métier (`services/`, `controllers/`, `lib/`, `ui/`).

L'écriture classique de logs *in-situ* (construire le message, formater les objets de données et manipuler le logger directement dans les fonctions métier) entre en conflit direct avec les contraintes architecturales fortes du projet :
1. **Saturation de la volumétrie des fichiers (`CASE-ARCH-05-1`) :** Les fichiers critiques comme `scenario-runner.service.ts` (~130 lignes) ou `resource-store.service.ts` (~140 lignes) dépasseraient immédiatement la limite stricte de 150 lignes en ajoutant des blocs de log verbeux.
2. **Plafond physique de 40 lignes par fonction (`CASE-ARCH-05-2`) :** Une fonction métier de 30 lignes franchit la limite dès qu'on y insère 5 lignes de logging structuré avec options et tags.
3. **Plafond d'arité positionnelle $\le 3$ (`CASE-ARCH-05-3`) :** Injecter une instance `logger: Logger` en paramètre des fonctions existantes violerait immédiatement la règle d'arité sur toutes les fonctions prenant déjà 3 arguments.
4. **Cohérence linguistique et sémantique (`REQ-007`) :** Éparpiller les chaînes de log dans des dizaines de fichiers disperse la responsabilité des libellés français et rend l'auditabilité difficile.
5. **Différenciation des cycles de vie opérationnels :** Les erreurs (qui manipulent des objets `unknown` ou des stacks d'exception), les informations opérationnelles (qui manipulent des compteurs et des métriques de temps `ms`) et les traces de débogage (qui inspectent des trames brutes) ont des besoins de typage et des contextes radicalement différents.

---

## Options envisagées

### Option A — Journalisation ad-hoc directe dans le code métier
| | |
|---|---|
| **Ce qu'elle apporte** | Facilité d'écriture locale initiale sans fichier intermédiaire. |
| **Ce qu'elle coûte** | Inflation massive de la volumétrie des fichiers (dépassement garanti des 150 lignes), risque élevé sur les corps de fonctions (> 40 lignes), dispersion des messages en français. |
| **Ce qu'elle rend difficile plus tard** | Maintenance globale des logs, réutilisation des événements récurrents, refactoring. |

### Option B — Dictionnaire centralisé plat (un fichier unique par domaine)
| | |
|---|---|
| **Ce qu'elle apporte** | Centralisation des messages et appels sur une seule ligne. |
| **Ce qu'elle coûte** | Mélange dans un même fichier d'événements informatifs, d'erreurs critiques et de traces verbeuses de diagnostic ; types de paramètres hétérogènes. |
| **Ce qu'elle rend difficile plus tard** | Lisibilité et isolation : pour logger une simple erreur, on charge un module contenant des dizaines de fonctions sans rapport. |

### Option C — Catalogue d'événements sémantiques avec segmentation physique par sévérité (`errors/`, `info/`, `debug/`) [Retenue]
| | |
|---|---|
| **Ce qu'elle apporte** | **Appel en 1 seule ligne** dans le code métier ; **séparation stricte des préoccupations** (dossiers `errors/`, `info/`, `debug/`) ; fichiers minuscules ($\le 40$ lignes) ; typage dédié par niveau ; 100 % conforme aux plafonds `CASE-ARCH-05-*`. |
| **Ce qu'elle coûte** | Création d'une arborescence dédiée dans `src/utils/logger/events/`. |
| **Ce qu'elle rend difficile plus tard** | Rien : la structure est modulaire, extensible et chaque nouveau service peut ajouter son module dédié dans chaque dossier. |

---

## Décision

Nous adoptons l'**Option C** : la journalisation s'effectue exclusivement au travers d'un **catalogue d'événements sémantiques typés**, segmenté physiquement en trois sous-dossiers selon la sévérité :
- **`src/utils/logger/events/errors/`** : Événements d'échec, anomalies et exceptions (ex. `runner-error.event.ts`, `server-error.event.ts`).
- **`src/utils/logger/events/info/`** : Événements opérationnels, étapes franchies et métriques (ex. `runner-info.event.ts`, `server-info.event.ts`).
- **`src/utils/logger/events/debug/`** : Traces approfondies de diagnostic local (ex. `runner-debug.event.ts`, `server-debug.event.ts`).

Chaque événement est matérialisé par une fonction spécialisée acceptant au maximum 3 paramètres primitifs ou un objet de payload, et s'invoque en **strictement une seule ligne** dans le code métier.

---

## Raisons

1. **Garantie mathématique de respect des plafonds architecturaux :**  
   L'appel `logScenarioStart(sc.id, sc.nodes.length)` prend 1 seule ligne. Il n'ajoute aucun argument à la fonction appelante et n'augmente que d'une ligne physique le corps de la fonction hôte.
2. **Orthogonalité et isolation par sévérité :**  
   Les signatures d'erreur prennent des types d'exception (`error: unknown`), tandis que les signatures d'info prennent des grandeurs mesurables (`ms: number`, `count: number`). Séparer les dossiers évite de mélanger des fonctions aux rôles divergents.
3. **Source unique de vérité pour les libellés en français :**  
   L'intégralité des messages de log est répertoriée et documentée au même endroit, facilitant l'audit `REQ-007`.
4. **Conformité stricte au DAG (Palier 2) :**  
   Placé sous `src/utils/logger/events/`, le catalogue est importable par l'ensemble des couches amont (`services/`, `controllers/`, `lib/`, `ui/`, `index.ts`) sans aucune violation d'étanchéité (`CASE-ARCH-01-5`).

---

## Conséquences acceptées

- L'ajout d'un nouvel événement de log requiert de déclarer sa fonction dans le module du dossier correspondant (`errors/`, `info/` ou `debug/`).
- Chaque fichier du catalogue doit porter la balise `@pendingAudit` et respecter les conventions de nommage kebab-case et d'arité.

---

## Ce qui nous ferait revenir dessus

- L'abandon des règles de volumétrie $\le 150$ lignes et $\le 40$ lignes du projet (hautement improbable car au cœur de la rigueur ClientsBox).
