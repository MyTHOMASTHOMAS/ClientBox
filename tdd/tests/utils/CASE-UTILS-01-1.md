# CASE-UTILS-01-1 — Journalisation structurée isomorphique et kill-switch LOGS_DISABLED

**Spécification :** `SPEC-UTILS-01` (spécification `tdd/docs/utils/logger-spec.md`)  
**Critère d'acceptation :** `AC-UTILS-01-1`  
**Type :** unitaire / technique  
**Niveau de risque :** modéré  
**Couche DAG :** `2-utils` (`src/utils/logger/`)  

---

## Ce que ce cas protège

Le module `src/utils/logger/` fournit un logger structuré isomorphique (Node.js et navigateur) sans dépendance tierce. Ce cas protège :
1. Le bon fonctionnement des 5 niveaux de gravité (`debug`, `info`, `warn`, `error`, `success`) et l'application des formats requis (horodatage, préfixe de service, icônes, tags).
2. La dérivation contextuelle hiérarchique via `.with(...)` avec accumulation ordonnée des tags et surcharge des gardes.
3. La mesure asynchrone des performances via `.timed(...)` consignant la durée en millisecondes et remontant fidèlement les erreurs en cas de rejet.
4. Le respect absolu de la variable d'environnement `LOGS_DISABLED=true` (et `LOGS_ENABLED=false`) ainsi que du flag navigateur `__LOGS_DISABLED__` : aucun appel à `console` ne doit être émis lorsque les logs sont désactivés.
5. L'extinction du niveau `debug` hors environnement de développement (`NODE_ENV=production`).

---

## Cas

```gherkin
Étant donné un logger instancié via "createLogger('test-svc', 'base-tag')"
Quand "logger.info('Message standard')" est appelé
Alors la méthode "console.info" est invoquée avec le préfixe "[TEST-SVC]" et le tag "[base-tag]"

Étant donné un logger dérivé via "logger.with('extra-tag')"
Quand "logger.warn('Avertissement')" est appelé
Alors la méthode "console.warn" est invoquée avec les tags "[base-tag] [extra-tag]"

Étant donné un appel asynchrone mesuré via "logger.timed('opération lente', () => delay(10))"
Quand l'opération se termine avec succès
Alors le log émis contient la mention "(10ms)" ou la durée mesurée

Étant donné la variable d'environnement "LOGS_DISABLED=true"
Quand "logger.info('Message sous silence')" ou "logger.error('Erreur sous silence')" est appelé
Alors aucun appel à "console.info", "console.warn", "console.error" ni "console.debug" n'est déclenché

Étant donné la variable d'environnement "LOGS_ENABLED=false"
Quand n'importe quelle méthode de log est appelée
Alors tous les logs restent totalement inhibés

Étant donné un environnement de production ("NODE_ENV=production") sans "LOGS_DISABLED"
Quand "logger.debug('Message diagnostic')" est appelé
Alors aucun log n'est émis sur la console
```

---

## Données

| Élément | Valeur |
|---|---:|
| Nom de service de test | `'test-svc'` |
| Tag de base | `'base-tag'` |
| Tag additionnel dérivé | `'extra-tag'` |
| Variable kill-switch primaire | `LOGS_DISABLED='true'` |
| Variable kill-switch secondaire | `LOGS_ENABLED='false'` |
| Environnement par défaut | `NODE_ENV='development'` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Appels console quand `LOGS_DISABLED=true` | `0` | Filtrage total dans `shouldLog` |
| Appels console quand `LOGS_ENABLED=false` | `0` | Filtrage total dans `shouldLog` |
| Appels console pour `debug` en production | `0` | Règle `level === 'debug' && !isDev` |
| Tags présents après `.with('tag2')` | `['base-tag', 'tag2']` | Concaténation ordonnée |

---

## Ce que ce cas ne vérifie pas

- Les entrées/sorties réseau ou les formats de logs des flux SSE serveur (couvert par `CASE-SRV-02-14` / `CASE-UI-03-1`).
- L'affichage des logs dans le terminal UI web (couvert par `CASE-UI-03-1`).

---

## Test automatisé

**Nom attendu :** `test_CASE_UTILS_01_1_structured_logger_and_logs_disabled`  
**Fichier :** `tests/units/utils/case-utils-01-1.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie tous les niveaux (`debug`, `info`, `warn`, `error`, `success`).
- [ ] Le test vérifie la dérivation via `.with(...)`.
- [ ] Le test vérifie la mesure via `.timed(...)`.
- [ ] Le test vérifie l'inhibition totale sous `LOGS_DISABLED=true`.
- [ ] Le test vérifie l'inhibition totale sous `LOGS_ENABLED=false`.
- [ ] Le test vérifie le comportement sous `window.__LOGS_DISABLED__`.
- [ ] Le nom du test contient `CASE_UTILS_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.
