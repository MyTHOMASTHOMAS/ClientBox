# CASE-UTILS-02-1 — Catalogue d'événements sémantiques et segmentation physique par sévérité (errors, info, debug)

**Spécification :** `SPEC-UTILS-02` (spécification [`tdd/docs/utils/logger-spec.md`](../../docs/utils/logger-spec.md) §5)  
**Critère d'acceptation :** `AC-UTILS-02-1`, `AC-UTILS-02-2`, `AC-UTILS-02-3`, `AC-UTILS-02-4`  
**ADR liés :** [`ADR-014`](../../docs/adr/ADR-014-catalogue-evenements-logger-et-separation-severite.md)  
**Type :** unitaire / architecture  
**Niveau de risque :** modéré  
**Couche DAG :** `2-utils` (`src/utils/logger/events/`)  

---

## Ce que ce cas protège

Le catalogue d'événements sémantiques centralise l'ensemble des émissions de logs applicatifs afin de garantir des appels en une seule ligne dans le code métier sans enfreindre les règles d'architecture (`CASE-ARCH-05-1` $\le 150$ lignes/fichier, `CASE-ARCH-05-2` $\le 40$ lignes/fonction, `CASE-ARCH-05-3` arité $\le 3$). Ce cas protège :
1. **La segmentation physique stricte par sévérité (`AC-UTILS-02-1`) :**
   - Les fonctions de niveau `error` résident exclusivement sous `src/utils/logger/events/errors/`.
   - Les fonctions de niveaux `info` et `success` résident exclusivement sous `src/utils/logger/events/info/`.
   - Les fonctions de niveau `debug` résident exclusivement sous `src/utils/logger/events/debug/`.
2. **Le fonctionnement nominal des événements d'information (`AC-UTILS-02-2`) :**
   - Formatage correct du message en français (`REQ-007`), préfixe de service `[RUNNER]` et inclusion des tags contextuels et durées d'exécution (`Xms`).
3. **La transmission des exceptions et erreurs (`AC-UTILS-02-3`) :**
   - Prise en charge d'un paramètre typé `error: unknown` (`CASE-ARCH-06-3`) avec affichage structuré sur `console.error`.
4. **L'étanchéité et le filtrage dev/prod du niveau debug :**
   - Émission active sur `console.debug` en environnement de développement, silence complet en production.
5. **Le respect du Kill-Switch global (`AC-UTILS-02-4`) :**
   - L'activation de `LOGS_DISABLED=true` (ou `LOGS_ENABLED=false`) inhibe immédiatement l'intégralité des événements du catalogue sans lever d'erreur.

---

## Cas

```gherkin
Étant donné un événement opérationnel issu du sous-dossier "events/info/"
Quand "logScenarioStarted('sc-demo', 5)" est appelé
Alors la méthode "console.info" est invoquée avec le préfixe "[RUNNER]" et le tag "[scenario]"
Et le message contient "Démarrage du scénario \"sc-demo\" (5 blocs)"

Étant donné un événement de mesure de performance issu de "events/info/"
Quand "logBlockExecuted('sc-demo', 'block-1', 45)" est appelé
Alors la méthode "console.info" est invoquée avec la mention "(45ms)"
Et le tag "[node]" est présent

Étant donné un événement d'échec issu du sous-dossier "events/errors/"
Quand "logScenarioFailed('sc-demo', new Error('Connexion perdue'))" est appelé
Alors la méthode "console.error" est invoquée avec le message d'échec en français
Et l'objet d'erreur sous-jacent est transmis à la console

Étant donné un événement de diagnostic issu du sous-dossier "events/debug/"
Quand l'environnement est en mode développement ("NODE_ENV=development")
Alors la méthode "console.debug" est invoquée avec les données de trace

Étant donné un événement de diagnostic issu du sous-dossier "events/debug/"
Quand l'environnement est en mode production ("NODE_ENV=production")
Alors la méthode "console.debug" n'est pas appelée

Étant donné la variable d'environnement "LOGS_DISABLED=true"
Quand n'importe quel événement de "events/info/", "events/errors/" ou "events/debug/" est appelé
Alors aucun appel à "console.info", "console.error" ni "console.debug" n'est déclenché
```

---

## Données

| Élément | Valeur |
|---|---:|
| Répertoire racine du catalogue | `src/utils/logger/events/` |
| Sous-dossier Erreurs | `src/utils/logger/events/errors/` |
| Sous-dossier Informations | `src/utils/logger/events/info/` |
| Sous-dossier Diagnostic | `src/utils/logger/events/debug/` |
| Identifiant de scénario de test | `'sc-demo'` |
| Nombre de blocs | `5` |
| Identifiant de nœud | `'block-1'` |
| Durée mesurée | `45` ms |
| Exception de test | `new Error('Connexion perdue')` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Arité maximale des fonctions d'événement | $\le 3$ paramètres | Règle `CASE-ARCH-05-3` |
| Appels console quand `LOGS_DISABLED=true` | `0` | Coupure stricte dans `shouldLog` |
| Appels console debug en production | `0` | Règle `level === 'debug' && !isDev` |
| Appels console info lors d'un start | `1` | `runnerLog.info` |
| Appels console error lors d'un fail | $\ge 1$ | `runnerLog.error` + données de l'erreur |

---

## Ce que ce cas ne vérifie pas

- L'affichage des événements dans le terminal de l'IHM web (couvert par `CASE-UI-03-1`).
- La persistance disque des fichiers de log (ClientsBox opère en streaming in-memory / console).

---

## Test automatisé

**Nom attendu :** `test_CASE_UTILS_02_1_structured_events_catalog_and_severity_separation`  
**Fichier :** `tests/units/utils/case-utils-02-1.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie les événements opérationnels du sous-dossier `events/info/`.
- [ ] Le test vérifie les événements d'erreur du sous-dossier `events/errors/`.
- [ ] Le test vérifie les événements de diagnostic du sous-dossier `events/debug/`.
- [ ] Le test vérifie l'inhibition totale sous `LOGS_DISABLED=true`.
- [ ] Le test vérifie l'arité $\le 3$ sur chaque fonction d'événement.
- [ ] Le nom du test contient `CASE_UTILS_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.
