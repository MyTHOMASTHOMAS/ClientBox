# Analyse d'impact — CR-001 (Migration Vitest, Nettoyage TS & Port par Défaut 2974)

**Demande du client :**
1. Adoption formelle de Vitest comme framework de test TypeScript natif (ADR-007) et suppression de tous les fichiers/symlinks `.js` intermédiaires.
2. Bascule du port serveur HTTP par défaut de **`974`** à **`2974`** afin de s'affranchir de la restriction des ports privilégiés Linux (`< 1024` / `EACCES`).

**Reçue le :** 06/10/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus Partie 67)  

---

> **Interdiction de modifier le code avant que cette analyse soit complète.**
>
> La modification descend la chaîne dans cet ordre : cahier des charges → specs →
> UML → modèle de données → cas de test → tests → code. Commencer par le code,
> c'est perdre la trace de pourquoi il a changé — et c'est exactement ce que ce
> module cherche à vous faire éviter.

---

## 1. Ce que le client demande, reformulé

Le client demande de sécuriser et d'assainir la chaîne technique sur deux axes majeurs :
1. **Outillage de test propre & pérenne :** Remplacer les mécanismes de chargement expérimentaux et symlinks par **Vitest** pour une exécution 100 % TypeScript native conforme à `SPEC-ARCH-01..09` (ADR-007).
2. **Portabilité et accessibilité réseau :** Le port par défaut initial (`974`) étant un port privilégié sous Linux (`< 1024`), il déclenche une erreur système `EACCES` lors d'une exécution par un utilisateur standard sans droits root. Le client décide d'adopter le port **`2974`** (non privilégié, $\ge 1024$), garantissant une exécution immédiate sans configuration `sysctl` ni élévation de privilèges.

---

## 2. Questions posées au client

| # | Question | Réponse |
|---|---|---|
| 1 | Doit-on supprimer tous les symlinks et fichiers `.js` générés dans `src/` et `tests/helpers/` ? | **Oui**, suppression intégrale pour conserver une arborescence 100 % TypeScript native. |
| 2 | Quel framework de test retenir pour remplacer le runner expérimental Node 24 ? | **Vitest** (acté dans l'ADR-007), pour son support natif TypeScript/ESM et ses utilitaires de timers/mocks (`vi.useFakeTimers()`, `vi.spyOn()`). |
| 3 | Pourquoi passer du port 974 au port 2974 ? | Le port 974 nécessite des droits `root` / `CAP_NET_BIND_SERVICE` sous Linux (`ip_unprivileged_port_start = 1024`). Le port **2974** est libre, non privilégié et conserve la signature mémorielle "974" de la marque. |
| 4 | Quelles couches doivent être synchronisées avec le port 2974 ? | Toute la chaîne : CDC v2 (`REQ-002`, `C-04`, `R-35`), specs (`SPEC-SRV-01..02`, `SPEC-UI-01`), ADR-001/007, signatures, diagrammes UML, fiches CASE `tdd/tests/srv/`, tests unitaires et code source. |

---

## 3. Impact — cahier des charges (CDC v2)

| Exigence | Impact | Action |
|---|---|---|
| Récit Objectif 1 (L45) | **Modifié** | Démarrage du serveur HTTP local sur le port par défaut **`2974`** (au lieu de 974). |
| Périmètre (L88) | **Modifié** | Port par défaut fixé à **`2974`**. |
| `Contrainte 4` (`C-04`, L140) | **Modifiée** | Port par défaut fixé à **`2974`** (surchargeable via `-p` / `--port`). |
| `R-35` (L194) | **Modifiée** | Échec explicite si le port par défaut (`2974`) ou le port surchargé est déjà occupé (`EADDRINUSE`). |
| `REQ-002` (L216) | **Modifiée** | Démarrage par défaut sur le port **`2974`** sans argument. |
| `REQ-001`, `REQ-003` à `REQ-038` | Inchangées | Toutes les autres exigences fonctionnelles restent identiques. |
| `Contrainte 1` (Node ≥ 24, TS) | Inchangée (renforcée) | Exécution sur Node ≥ 24 en TypeScript strict, testée nativement via Vitest. |
| `REQ-101` à `REQ-112` (NFR) | Inchangées | Maintien des exigences de performance et d'exécution locale. |

---

## 4. Impact — spécifications

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| `SPEC-SRV-01` | **Modifiée** | `DEFAULT_SERVER_PORT = 2974` dans les règles et critères d'acceptation `AC-SRV-01-1` et `AC-SRV-01-3` ; mise à jour de l'en-tête de version v1.1. |
| `SPEC-SRV-02` | **Modifiée** | L'URL console générée par défaut devient `http://localhost:2974` (`AC-SRV-02-2`). |
| `SPEC-UI-01` | **Modifiée** | Mention de l'URL console locale `http://localhost:2974`. |
| `tdd/specs/sommaire.md` | **Modifié** | Alignement du sommaire avec les mentions `2974`. |
| `SPEC-DATA-01..04` | Inchangée | Les schémas de données et la persistance restent identiques. |
| `SPEC-ADPT-01..03` | Inchangée | Le contrat d'adaptateur et le cycle de vie du spawner restent identiques. |
| `SPEC-ENG-01..04` | Inchangée | Le comportement du moteur de blocs (join/pause/power) reste identique. |
| `SPEC-ARCH-01..08` | Inchangée | Le DAG des 8 couches, la volumétrie et la pureté TypeScript restent identiques. |
| `SPEC-ARCH-09` | **Facilitée** | L'intégration du reporting automatique sous `out/` (`rapport-arch.md` et `arch-report.json`) s'appuiera nativement sur le moteur de reporting de Vitest. |

---

## 5. Impact — conception & architecture

| Artefact | Impact | Ce qui change |
|---|---|---|
| `ADR-001` | **Modifié (amendé)** | Mention du port par défaut **2974** avec note d'amendement datée (CR-001). |
| `ADR-007` | **Créé** | Formalisation de Vitest comme framework de test TypeScript natif et éradication des artefacts `.js`. |
| `ADR/README.md` | **Modifié** | Référencement de l'ADR-007 dans l'index. |
| `uml/components.puml` | **Modifié** | Mise à jour de l'annotation du port d'écoute HTTP (`2974`). |
| Signatures d'architecture | **Modifiées** | Alignement des fichiers `signature.md`, `signature-lib.md`, `signature-src.md`, `signature-controllers.md` et `signature.template.md` sur le port `2974`. |

---

## 6. Impact — tests & fiches CASE

| Élément | Impact | Action |
|---|---|---|
| Fiches `tdd/tests/srv/CASE-SRV-*.md` | **Modifiées** | Mise à jour des 8 fiches CASE du domaine SRV (`CASE-SRV-01-1..01-3`, `02-1..02-5`) et de leur sommaire pour le port `2974` et l'ID de test `_on_2974`. |
| `tests/srv/CASE-SRV-01-1.test.ts` | **Modifié** | Démarrage et vérification sur port `2974` (`test_CASE_SRV_01_1_default_port_startup_on_2974`). |
| `tests/srv/CASE-SRV-01-3.test.ts` | **Modifié** | Vérification d'échec sur port occupé `2974` et sonde éphémère `2975`. |
| `tests/srv/CASE-SRV-02-2.test.ts` | **Modifié** | Assertion sur l'URL de démarrage `http://localhost:2974`. |
| 57 suites de tests `tests/**/*.test.ts` | **Migrées** | Remplacement des imports `node:test` par `vitest`, adaptation des mocks (`vi.spyOn`, `vi.fn`, `vi.useFakeTimers`, `vi.advanceTimersByTimeAsync`). |
| `tests/helpers/mock-spawn.ts` | **Migré** | Adaptation du contrôleur d'espionnage de spawn vers l'API `vi.spyOn`. |
| `tests/helpers/test-server.ts` | **Ajusté** | Levée d'ambiguïté syntaxique sur la closure de repli pour le parser oxc/vitest. |
| `vitest.config.ts` | **Créé** | Configuration Vitest (environnement `node`, `isolate: true`, `fileParallelism: false`). |

---

## 7. Impact — code source

| Composant | Impact | Ce qui change |
|---|---|---|
| `src/lib/process/cli-args.ts` | **Modifié** | `DEFAULT_SERVER_PORT = 2974` (au lieu de 974). |
| `src/lib/http/http-server.ts` | **Vérifié** | Port injecté dynamiquement depuis les arguments analysés. |
| `src/lib/process/startup-console.ts` | **Vérifié** | Formatage dynamique `http://localhost:${port}`. |
| `src/**/*.ts` (autres) | Inchangés | Zéro modification sur les 48 autres modules applicatifs. |
| `src/**/*.js` (symlinks) | **Supprimés** | Éradication complète des liens symboliques résiduels. |
| `scripts/polyfill-*.mjs` | **Supprimés** | Éradication des scripts de hooks Node 24. |
| `package.json` | **Modifié** | Ajout de `vitest` en `devDependencies` et scripts `"test": "vitest run"`, `"test:watch": "vitest"`. |

---

## 8. Effets de bord résolus & bénéfices

1. **Résolution définitive du blocage Linux EACCES :** L'exécution des tests du serveur HTTP ne nécessite plus aucune élévation de privilèges (`sudo`) ni reconfiguration de `sysctl`.
2. **Taux de succès de la suite de tests :** Atteinte de **100 % de succès (57 / 57 tests au 🟢 VERT)**.
3. **Suppression des erreurs de résolution de module :** Résolution ESM native immédiate via Vitest sans scripts de résolution `ts-js-resolve`.
4. **Propreté du dépôt :** Arborescence 100 % TypeScript native sans doublons `.js`.

---

## 9. Hors périmètre assumé

- Les prompts d'agents (`tdd/docs/prompt/**`) contenant des références historiques à 974 font l'objet d'un alignement dédié dans la partie suivante (`68-alignement_prompts_port_2974`, POINT-008).
- Pas d'ajout d'identifiants LIB artificiels pour les seams `cli-args` ou `startup-console`.
- Conservation des extensions `.js` dans les imports de code TypeScript source (conforme aux spécifications ECMAScript / TypeScript `NodeNext`).

---

## 10. Ordre d'exécution & validation

| # | Étape | Statut |
|---|---|---|
| 1 | Validation formelle de la fiche d'impact et cadrage CDC v2 | ✅ Fait (Partie 67) |
| 2 | Création du CDC v2 (`cahier-des-charges-v2.md`) en préservant v1 intact | ✅ Fait |
| 3 | Alignement des spécifications (`SRV.md`, `UI.md`, `sommaire.md`) | ✅ Fait |
| 4 | Alignement de la conception (`ADR-001`, `ADR-007`, `components.puml`, signatures) | ✅ Fait |
| 5 | Alignement des fiches CASE (`tdd/tests/srv/CASE-SRV-*.md`) | ✅ Fait |
| 6 | Configuration outillage Vitest (`package.json`, `vitest.config.ts`, `mock-spawn.ts`) | ✅ Fait |
| 7 | Mise à jour du code source (`cli-args.ts`) et des tests unitaires (`tests/**/*.test.ts`) | ✅ Fait |
| 8 | Validation globale `npm test` : **57 / 57 tests 🟢 VERT** | ✅ Fait |
