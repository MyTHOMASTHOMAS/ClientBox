# ADR-006 — Stratégie de test unitaire, mocking CLI et isolation asynchrone

**Statut :** accepté  
**Date :** 25/09/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

---

## Ancrage CDC & Spécifications

| Référence | Rôle |
|---|---|
| REQ-001, REQ-002, REQ-005, C-07 | Résolution déterministe de `workspacePath` et gestion de `process.cwd()` |
| REQ-013, REQ-031, REQ-112, R-38 | Résolution et validation de `CURSOR_CLI_BIN` |
| REQ-017, REQ-037, R-42, R-42b, C-15 | Synchronisation asynchrone du moteur, algorithme de Join et bascule en Pause |
| REQ-022, REQ-025, R-23, R-24, R-34 | Cycle de vie des sous-processus CLI, signal `SIGTERM` / `SIGKILL` et délai de grâce 3000 ms |
| ADR-001 à ADR-005 | Cohérence globale du socle, des adapters, du moteur et de la persistance |

Cet ADR **complète** l'architecture technique en définissant les règles et patrons de conception obligatoires pour l'implémentation des suites de tests automatisés (`tests/tests-unitaires/` et `tests/integration/`).

---

## Contexte

Les composants de ClientsBox manipulent des ressources système critiques :
1. **Sous-processus OS (`child_process.spawn`) :** L'adapter CLI orchestre des processus externes lourds avec flux de streaming (`stdio`) et signaux système (`SIGTERM`/`SIGKILL`). Lancer de vrais binaires Cursor dans chaque test unitaire ralentirait drastiquement la suite, créerait une dépendance externe fragile et risquerait de laisser des processus zombies.
2. **Boucles asynchrones & flux événementiels :** Le moteur de blocs gère des graphes réactifs, des agrégations de flux asynchrones (Join), des suspensions (Pause) et des annulations (`AbortController`). Une synchronisation imprécise dans les tests engendre des faux positifs dus à des conditions de course (*race conditions*).
3. **Environnement global d'exécution (`process.cwd()`) :** Le serveur ancre son `workspacePath` sur le répertoire courant. Tout test modifiant `process.cwd()` sans isolation stricte corrompt l'exécution des suites de tests suivantes.

---

## Options envisagées

### Option A — Tests directs sans mocking système (Rejetée)
- **Principe :** Invoquer de vrais binaires système, utiliser des `setTimeout` réels et muter librement `process.cwd()`.
- **Inconvénients :** Suites de tests lentes, instables (flaky), dépendantes de l'environnement hôte, risque élevé de fuite mémoire et de processus orphelins.

### Option B — Stratégie d'isolation stricte par mocks en TU et réservation de TI ciblés (Retenue)
- **Principe :**
  1. Mocker les flux `stdio` (`EventEmitter` / `ReadableStream`) et les processus pour tous les tests unitaires.
  2. Utiliser des faux timers (`FakeTimers`) pour valider les délais d'escalade (3000 ms).
  3. Flusher systématiquement les microtâches / promesses (`flushPromises()`) pour les tests du moteur.
  4. Imposer l'immutabilité de `process.cwd()`, privilégier l'injection de dépendance et nettoyer en `afterEach` strict avec répertoires temporaires sandboxés.
  5. Réserver des tests d'intégration réels dédiés pour valider la résolution de `CURSOR_CLI_BIN`.

---

## Décision

ClientsBox adopte formellement les **trois règles de test unitaire et d'isolation** suivantes :

### 1. Mocking des processus CLI (`child_process.spawn`)
- Les tests unitaires des domaines `ADPT` et `ENG` ne doivent jamais invoquer de vrai binaire système.
- `child_process.spawn` doit être mocké en mémoire en simulant des flux `Readable`/`Writable` (`stdin`, `stdout`, `stderr`) et des événements de cycle de vie (`exit`, `error`).
- L'escalade de `SIGTERM` vers `SIGKILL` après `STOP_GRACE_MS = 3000 ms` est testée exclusivement à l'aide de faux timers (`jest.useFakeTimers()` / `vi.useFakeTimers()`).
- La validation réelle de `CURSOR_CLI_BIN` est cantonnée à des tests d'intégration dédiés.

### 2. Gestion de l'asynchronisme et des boucles d'événements
- Les tests du moteur (`Join`, bascule en pause, déblocage après mise à jour d'un message, émission Start) doivent purger de manière déterministe la file de microtâches (`await new Promise(process.nextTick)` ou `await flushPromises()`).
- Toute assertion sur l'état d'un bloc doit être précédée du flush complet des promesses en cours pour éliminer tout risque de condition de course.

### 3. Immutabilité de `process.cwd()` et isolation des workspaces
- Les composants doivent privilégier l'injection explicite du paramètre `workspacePath?: string` plutôt que la lecture directe de `process.cwd()` en interne.
- Lorsque le test valide spécifiquement la résolution depuis l'environnement (`CASE-SRV-01-4`), le test doit s'exécuter dans un répertoire temporaire sandboxé (`fs.mkdtempSync`) et restaurer scrupuleusement le `process.cwd()` initial dans un bloc `afterEach` / `finally` strict.

---

## Conséquences acceptées

- Mise en place d'un harnais d'aides de test partagé (`tests/helpers/`) fournissant `mockSpawn`, `flushPromises` et `withTempDir`.
- Nettoyage rigoureux des mocks (`jest.restoreAllMocks()`) dans un setup global (`tests/setup.ts`).
- Zéro dépendance externe requise pour exécuter l'intégralité de la suite de tests unitaires.

## Raisons

- Les tests unitaires doivent rester rapides, déterministes et isolés des binaires CLI et de l'environnement hôte (ADR-003, ADR-004).
- Les règles `flushPromises` / FakeTimers / sandbox `cwd` évitent les courses sur le moteur join/pause (REQ-017/037, R-42*) et sur Stop (`STOP_GRACE_MS`, REQ-025).

## Ce qui nous ferait revenir dessus

- Obligation produit d'exécuter cursor-cli réel dans chaque test unitaire (changerait le périmètre ADR-006).
- Framework de test imposant une autre stratégie d'isolation incompatible avec les helpers décrits.

## Liens

- Socle & `cwd` : **ADR-001**. Adapters & spawn : **ADR-002**, **ADR-003**. Moteur join/pause : **ADR-004**. Persistance : **ADR-005**.
- Specs & CASE : domaines `ADPT`, `ENG`, `SRV` ; harnais référencé dans `SPEC-ARCH-04` (`AC-ARCH-04-4`) et signatures `LIB-004`, `SVC-001`.
