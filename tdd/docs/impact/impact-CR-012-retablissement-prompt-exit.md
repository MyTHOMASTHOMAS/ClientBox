# Analyse d'impact — CR-012 (Rétablissement du Prompt d'Ordre de Sortie Exit — R-07)

**Demande du client :** Abroger l'interprétation erronée de la ressource `exit` par « matchers » (`substring` / `regex`) interrompant prématurément les sous-processus CLI d'un bloc `Run`, et rétablir son rôle contractuel initial (`R-07`) de **prompt d'ordre de sortie** (`{ id, name, content }`) additionné à la suite du prompt de mission lorsqu'`exitId` est défini, tout en laissant le processus CLI s'exécuter jusqu'à sa terminaison naturelle.  
**Reçue le :** 20/11/2026  
**Rédigée par :** Autrement (`U`) / Cursor (Consensus TDD)  
**Entretien source :** [`tdd/docs/cr/CR-004.md`](../cr/CR-004.md) (Questions `CR-04/Q01` à `CR-04/Q06`)  
**Cible documentaire :** **CDC v2.3** ([`cahier-des-charges-v2.3.md`](../cdc/cahier-des-charges-v2.3.md) — brouillon ouvert ; bases `v1`, `v2`, `v2.1`, `v2.2` archivées intactes)  

---

> **Règle fondamentale TDD :**  
> Interdiction formelle de modifier le code de production avant la ratification de cette analyse, la clarification du **CDC v2.3**, la mise à jour des spécifications, signatures, diagrammes UML, guides utilisateur et fiches de cas de test, et la vérification des tests unitaires au **ROUGE**.  
> La chaîne descend impérativement : CR $\rightarrow$ Impact $\rightarrow$ CDC v2.3 $\rightarrow$ Specs / Signatures / UML / Docs $\rightarrow$ Cas de test $\rightarrow$ Tests automatisés (ROUGE) $\rightarrow$ Code & Templates (VERT).

---

## 1. Ce que le client demande, reformulé

Lors des phases antérieures de spécification détaillée et d'implémentation, une hallucination des agents de développement a dévoyé le rôle de la ressource **`exit`** (`R-07`) :
1. **Dérive constatée :** La ressource `exit` a été modélisée comme un tableau de critères d'arrêt `matchers` (`substring` | `regex`) évalués en temps réel sur `stdout`/`stderr` (`DOM-009` / `evaluateExitMatchers`), déclenchant `getHandle()?.stop()` (`SIGTERM` puis `SIGKILL`) dès qu'un mot-clé apparaissait dans le flux.
2. **Conséquence bloquante :** L'ordre de sortie n'était jamais transmis au modèle (obligeant à le dupliquer manuellement dans le prompt de mission), et toute apparition intermédiaire d'un marqueur (ex. `TERMINER` ou `CONTINUE` dans un raisonnement) tuait prématurément l'agent avant l'achèvement de sa tâche.

Le client acte le rétablissement intégral de la conception d'origine de **`R-07`** :
1. **Ressource `exit` = Prompt d'ordre de sortie (`{ id, name, content }`) :** Stockée sous `.agents/data/exit/<id>.json` avec la même structure JSON qu'un prompt, elle permet de définir hors prompt de mission comment l'agent doit conclure sa réponse (ex. dans une boucle : *« Si tu estimes que le rapport est complet, renvoie TERMINER dans ta réponse, sinon renvoie CONTINUE pour passer à l'agent suivant »*).
2. **Assemblage additif côté moteur :** Lorsqu'un bloc `Run` référence un `exitId`, le moteur concatène dans l'ordre `systemPrompt` (selon la politique `R-06`) $\rightarrow$ `prompt.content` $\rightarrow$ `exit.content` avec le séparateur `\n\n` (sans saut parasite si un segment est vide). Sans `exitId`, l'assemblage reste inchangé.
3. **Exécution CLI jusqu'à complétion naturelle :** Suppression totale de `DOM-009` (`evaluateExitMatchers`), du drapeau `isExitMatched` et de tout `stop()` automatique en cours de streaming. Un bloc `Run` attend la fin naturelle du processus CLI (`code === 0` ou `null`).
4. **Séparation franche `Run` / `exit` / `If` :** Le bloc `Run` émet la sortie complète du CLI dans `{ blockType: 'run', value: output, power: 1 }`, et ce sont les scripts JavaScript des blocs `If` en aval (`R-14`) qui inspectent `sac[key].value` pour orienter le graphe (`TERMINER` vs `CONTINUE`).

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision actée (`CR-004`) |
|---|---|---|
| 1 (`CR-04/Q01`) | Quel est le rôle métier d'une ressource `exit` (`R-07`) ? | Un **prompt d'ordre de sortie** réutilisable, découplé du prompt de mission, additionné au prompt du bloc `Run` si `exitId` est défini. |
| 2 (`CR-04/Q02`) | L'`exit` doit-il surveiller le flux ou arrêter prématurément le CLI (`stop()`) ? | **Non, jamais.** Abrogation complète des matchers temps réel et de l'interruption anticipée ; attente de la fin naturelle du CLI. |
| 3 (`CR-04/Q03`) | Quel est le schéma JSON de `.agents/data/exit/<id>.json` ? | **`{ "id": string, "name": string, "content": string }`** (`id` et `name` non vides, `content` chaîne obligatoire). Suppression de `matchers` et `ExitMatcher`. |
| 4 (`CR-04/Q04`) | Quel est l'ordre d'assemblage du prompt envoyé à l'adapter ? | **`systemPrompt`** (selon `policy`) $\rightarrow$ **`prompt.content`** $\rightarrow$ **`exit.content`** (si `exitId` présent), joints par `\n\n` sans saut parasite sur segment vide. |
| 5 (`CR-04/Q05`) | Quel est le payload émis par `Run` et qui route la suite du graphe ? | Payload = sortie complète résolue du CLI (`power: 1`) ; routage conditionnel assuré exclusivement par les blocs **`If`** (`if(sac)`). |
| 6 (`CR-04/Q06`) | Quel ancrage documentaire adopter ? | `CR-004` + `impact-CR-012` portés par le **CDC v2.3** (brouillon ouvert dérivé de la v2.2 archivée) par clarification de **`R-07`**, sans toucher à `CR-003` (`CR-011`) ni aux CDC archivés (`v1`, `v2`, `v2.1`, `v2.2`). |

---

## 3. Impact — Cahier des charges (**CDC v2.3**)

| Exigence / Règle | Impact | Action (`cahier-des-charges-v2.3.md`) |
|---|---|---|
| **`R-07`** | **Précisée** | Levée de toute ambiguïté d'interprétation : *« Un prompt `exit` (`data/exit/<id>.json`, schéma `{ id, name, content }`) définit l'ordre de sortie additionné à la fin du prompt d'un bloc `Run` (lorsqu'`exitId` est renseigné) afin d'indiquer à l'agent ce qu'il doit renvoyer en fin de tâche pour alimenter la sortie du bloc (payload), sans interrompre prématurément le processus CLI. »* |
| **`R-22`, `R-45`, `REQ-017`, `REQ-032`** | **Précisées** | Explicitation de la terminaison naturelle du CLI pour `Run` et de l'inclusion optionnelle de `exit.content` dans l'assemblage du prompt côté moteur. |
| **En-tête, §6, §11, §12 & Annexe B.4** | **Modifiés** | Passage en version **v2.3**, ajout de la décision figée **`CR-012`** (`CR-004` / `impact-CR-012-retablissement-prompt-exit.md`) et inscription des matchers temps réel en hors périmètre. |
| **`R-01`, `R-02`, `REQ-011`** | **Inchangées** | La ressource `exit` demeure un fichier JSON unitaire sous `.agents/data/exit/` géré en CRUD complet (UI + API REST). |
| **`R-14`, `R-15`, `REQ-018..019`** | **Inchangées** | Les blocs `If` lisent déjà `sac[key].value` via leurs scripts `.js` pour décider de la branche active (`power: 1` / `power: 0`). |
| **CDC `v1`, `v2`, `v2.1`, `v2.2` archivés** | **Inchangés** | Archives scellées sous `tdd/docs/cdc/archived/` strictement préservées. |

---

## 4. Impact — Spécifications Fonctionnelles & Architecture (`tdd/specs/`)

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| **`SPEC-DATA-01`** (`DATA.md` & `sommaire.md`) | **Modifiée** | - Le schéma de `.agents/data/exit/<id>.json` passe de `{ id, name, matchers }` à **`{ id, name, content }`** (homogène avec `prompts/`).<br/>- Mise à jour du scénario Gherkin (« Validation d'un prompt et d'un prompt d'ordre de sortie exit »).<br/>- Suppression de l'entrée obsolète *« Schéma détaillé des matchers avancés pour la ressource exit »* dans *Ce qui n'est pas défini*. |
| **`SPEC-ENG-03`** (`ENG.md` & `sommaire.md`) | **Modifiée** | - Bloc **Run** : retrait complet de la clause *« la fin de tâche et le payload de sortie sont déterminés par l'évaluation des matchers (`DOM-009` / `evaluateExitMatchers`) »*.<br/>- Rétablissement : le bloc `Run` attend la terminaison naturelle du processus CLI (`code === 0` ou `null`) et émet `{ blockType: 'run', value: <sortie CLI résolue>, power: 1 }`. |
| **`SPEC-ENG-04`** (`ENG.md` & `sommaire.md`) | **Modifiée** | - Règle d'assemblage du prompt étendue à 3 segments ordonnés : `systemPrompt` (selon `policy` `R-06`) + `prompt.content` + `exit.content` (si `exitId` est défini sur le bloc `Run`, `R-07`), séparés par `\n\n` sans saut de ligne parasite lorsqu'un segment est vide.<br/>- Ajout d'un scénario Gherkin nominal avec et sans `exitId`. |
| **`SPEC-ARCH-02`** (`ARCH.md`) | **Modifiée** | - Retrait des mentions de `DOM-009` (`exit-matcher.evaluator`) dans la Portée et la Revue IA.<br/>- Mise à jour de **`AC-ARCH-02-2`** : passage de **11 à 10 fonctions pures exportées** dans `src/domain/` (retrait de `evaluateExitMatchers`). |
| **`SPEC-ARCH-08`** (`ARCH.md`) | **Modifiée** | - Mise à jour du total canonique scellé de **198 $\rightarrow$ 197 modules signés** suite au retrait légitime de `DOM-009` (`domain/exit/exit-matcher.evaluator.ts`). |
| **`SPEC-UI-01` & `SPEC-UI-02`** (`UI.md`) | **Inchangées** | *Justification :* `UI.md` exige le CRUD des ressources `exit` (`AC-UI-01-2`) et la présence de `exitId` dans l'inspecteur `Run` sans prescrire de syntaxe de matchers. |
| **`SPEC-SRV-01..02` & `SPEC-ADPT-01..05`** | **Inchangées** | *Justification :* Les routes HTTP `/api/exit` restent génériques sur le payload JSON et les adapters CLI reçoivent déjà la chaîne `assembledPrompt` opaque (`ADR-002`). |

---

## 5. Impact — Conception, UML, Signatures & Documentation

| Artefact | Impact | Ce qui change |
|---|---|---|
| **`ADR-001` à `ADR-022`** | **Inchangés** | Aucun nouvel ADR requis : `ADR-004` confie déjà l'assemblage du prompt au moteur et `ADR-005` délègue les schémas JSON détaillés aux specs (`R-41`). |
| **`tdd/docs/uml/domain.puml`** | **Modifié** | Classe `ExitCondition` alignée sur `{ id: String, name: String, content: String }` (retrait de `description` / `promptOverride`) ; relation `RunBlock --> ExitCondition` libellée `additionne l'ordre de sortie >` au lieu de `surveille >`. |
| **`tdd/docs/uml/sequences/sequence-run-streaming.puml`** | **Modifié** | Étape 2 complétée avec la résolution optionnelle `loadExit(exitId)` et l'ajout de `exit.content` à `assembledPrompt` (l'étape 4 modélisait déjà la fin naturelle `exit(code: 0)`). |
| **`tdd/docs/signature/signature-types.md`** | **Modifié** | `TYPES-005` (`types/models/exit-condition.model.ts`) : description mise à jour (`id, name, content`), retrait de `ExitMatcher`. |
| **`tdd/docs/signature/signature-domain.md`** | **Modifié** | - Suppression du sous-domaine `domain/exit/` et de la ligne d'inventaire `DOM-009` (`domain/exit/exit-matcher.evaluator.ts`) ; le Micro-DAG passe de 7 à **6 sous-domaines**.<br/>- `DOM-004` (`domain/prompt/prompt.assembler.ts`) : assemblage `systemPrompt`, `userPrompt` et `exitPrompt` optionnel.<br/>- `DOM-014` (`domain/schemas/exit-condition.schema.ts`) : validation `{ id, name, content }`.<br/>- Nettoyage de la référence résiduelle `CASE-DATA-01-6`. |
| **`tdd/docs/signature/signature.md`** | **Modifié** | Décompte global actualisé de **198 à 197 modules canoniques signés** et formule du Micro-DAG `domain/` ramenée à 6 sous-domaines (sans `exit`). |
| **`tdd/docs/signature/signature-ui.md`** | **Modifié** | Ajustement terminologique mineur sur `UI-029` / `UI-034` et les champs du formulaire Exit (`id, name, contenu`). |
| **`docs/instructions/**`** | **Modifié** | - `docs/instructions/README.md` & `02-ressources/README.md` : rôle de `exit/<id>.json` = ordre de sortie additionné au prompt.<br/>- `docs/instructions/02-ressources/03-prompts-et-exit.md` : refonte complète (schéma `{ id, name, content }`, concaténation `\n\n`, fin naturelle du CLI, exemple de boucle `TERMINER` / `CONTINUE` avec script `If`).<br/>- `docs/instructions/04-exemples-et-depannage/01-workflow-complet-cle-en-main.md` : transfert de la consigne `TERMINE` dans `exit-termine.json` (`content`), épurant `prompt-coder.json` et `prompt-corriger.json`.<br/>- `docs/instructions/04-exemples-et-depannage/03-depannage-et-faq.md` : mise à jour des cas d'erreur de schéma et suppression du faux symptôme « condition Exit jamais matchée ». |

**Question d'état / modèle de données :**  
La demande n'introduit **aucun état runtime nouveau ni aucune entité nouvelle**. À l'inverse, elle **supprime** une structure de données erronée (`ExitMatcher[]`) ainsi qu'un état mutable transitoire de streaming (`isExitMatched` dans `runner-process.handlers.ts`), en ramenant `ExitCondition` à une structure déclarative `{ id, name, content }` strictement isomorphe à `Prompt`.

---

## 6. Impact — Tests (`tdd/tests/` & `tests/`)

| Cas de test / Fichier | Impact | Détail des modifications |
|---|---|---|
| **`CASE-DATA-01-3`** (`tdd/tests/data/CASE-DATA-01-3.md` & `tests/units/data/CASE-DATA-01-3.test.ts`) | **Modifié** | Validation de `parseExitCondition` sur `{ id, name, content }` et rejet explicite lorsque `content` est absent ou non-chaîne, ou lorsque `id` / `name` sont vides. |
| **`CASE-DATA-01-6`** (`tdd/tests/data/CASE-DATA-01-6.md`, `sommaire.md` & `tests/units/data/CASE-DATA-01-6.test.ts`) | **Supprimé (abrogé)** | Cas dédié exclusivement à `DOM-009` (`evaluateExitMatchers` substring/regex), devenu sans objet suite à l'abrogation des matchers. |
| **`CASE-ENG-04-1`** (`tdd/tests/eng/CASE-ENG-04-1.md` & `tests/units/eng/CASE-ENG-04-1.test.ts`) | **Modifié** | Extension du contrat de `assemblePrompt(systemPrompt, userPrompt, exitPrompt?)` : concaténation des 3 segments par `\n\n` et absence de sauts parasites lorsque `systemPrompt` ou `exitPrompt` est vide/absent. |
| **`CASE-ENG-04-13`** *(nouveau)* (`tdd/tests/eng/CASE-ENG-04-13.md`, `sommaire.md` & `tests/units/eng/CASE-ENG-04-13.test.ts`) | **À écrire** | Test d'acceptation de bout en bout sur `Run` + `exitId` :<br/>1. Vérifie que `adapter.buildCommand` reçoit `prompt.content + "\n\n" + exit.content` (précédé de `systemPrompt` selon `policy`).<br/>2. Vérifie que l'émission d'un mot-clé (`TERMINER` / `CONTINUE`) dans un premier chunk **n'appelle jamais `handle.stop()`** et attend la clôture naturelle `onExit(0)` pour émettre l'intégralité des chunks dans `BlockMessage.value`.<br/>3. Vérifie qu'un bloc `Run` sans `exitId` n'ajoute aucun suffixe au prompt. |
| **`CASE-ENG-04-4`** (`tests/units/eng/CASE-ENG-04-4.test.ts`) | **Modifié** | Alignement du mock `getExitCondition` sur `{ id: 'ex-1', name: 'Exit', content: 'Conclus par TERMINER.' }`. |
| **`CASE-UI-01-2`** (`tdd/tests/ui/CASE-UI-01-2.md` & `tests/units/ui/CASE-UI-01-2.test.ts`) | **Modifié** | Alignement de `EXIT_FORM_FIELDS` sur `['id', 'name', 'contenu']` et de `validateExitForm`, plus vérification que `buildMutationPayload` pour `kind: 'exits'` produit `{ id, name, content }` sans découpage en matchers. |
| **`CASE-UI-01-5`** (`tdd/tests/ui/CASE-UI-01-5.md` & `tests/e2e/ui/CASE-UI-01-5.e2e.test.ts`) | **Modifié** | Alignement des libellés et aperçus de contenu des 3 ressources `exit` issues des templates de seed (`exit-termine`, `exit-audit`, `exit-fait`). |
| **`CASE-ADPT-02-3` & `CASE-UI-03-1`** (fiches `.md`) | **Modifiés** | Nettoyage de la mention textuelle *« filtrage par condition Exit »* dans la section *Ce que ce cas ne vérifie pas*. |
| **`CASE-ARCH-01-6`** (`tdd/tests/arch/CASE-ARCH-01-6.md`) | **Modifié** | Retrait de `exit` dans la formule documentaire du sous-graphe `domain/`. |
| **`CASE-ARCH-02-2`** (`tdd/tests/arch/CASE-ARCH-02-2.md` & `tests/units/arch/case-arch-02-2.test.ts`) | **Modifié** | Audit de pureté sur les **10 fonctions** exportées de `src/domain/` (retrait du chargement dynamique de `evaluateExitMatchers`). |
| **`CASE-ARCH-02-3` & `CASE-ARCH-03-2`** (`tests/units/arch/case-arch-02-3.test.ts` & `case-arch-03-2.test.ts`) | **Modifiés** | Retrait de `exit/exit-matcher.evaluator.ts` et du marqueur regex `/\bevaluateExitMatchers\b/gu`. |
| **`CASE-ARCH-08-1` & `CASE-ARCH-08-2`** (`tdd/tests/arch/CASE-ARCH-08-1..2.md`, `sommaire.md` & `tests/units/arch/case-arch-08-1.test.ts`) | **Modifiés** | Passage de `EXPECTED_SIGNED_MODULE_COUNT` et des tables documentaires de **198 à 197 modules signés**. |

---

## 7. Impact — Code & Templates

| Composant | Statut | Responsabilité cible |
|---|---|---|
| `src/types/models/exit-condition.model.ts` (`TYPES-005`) | **Modifié** | Interface `ExitCondition { readonly id: ExitConditionId; readonly name: string; readonly content: string }` ; suppression de `ExitMatcher`. |
| `src/domain/schemas/exit-condition.schema.ts` (`DOM-014`) | **Modifié** | `parseExitCondition(input)` valide `id` et `name` non vides ainsi que `content` de type `string` (homogène avec `parsePrompt`). |
| `src/domain/exit/exit-matcher.evaluator.ts` (`DOM-009`) | **Supprimé** | Retrait complet du fichier et du répertoire `src/domain/exit/`. |
| `src/domain/prompt/prompt.assembler.ts` (`DOM-004`) | **Modifié** | `assemblePrompt(systemPrompt: string, userPrompt: string, exitPrompt = '')` concatène les segments non vides avec `\n\n` (arité $\le 3$ conforme `SPEC-ARCH-05` / `CASE-ARCH-05-3`). |
| `src/services/runner/process/runner-process.spawner.ts` | **Modifié** | `prepareRunContext` passe `res.exitCondition?.content ?? ''` en 3e argument de `assemblePrompt(...)` ; retrait du champ `exitCondition` devenu inutile dans `PreparedRunContext` / `ExecuteSpawnParams`. |
| `src/services/runner/process/runner-process.handlers.ts` | **Modifié** | Suppression de l'import `evaluateExitMatchers`, de `isExitMatched` et du `getHandle()?.stop()` dans `onChunk` ; `onExit` ne résout avec succès que sur `isStopped() || code === 0 || code === null`. |
| `src/services/runner/process/runner-active-processes.ts` | **Modifié** | Suppression du relais de `ctx.exitCondition` vers `executeRunnerSpawn`. |
| `src/ui/types/ui.types.ts` | **Modifié** | `ExitFormValues { id, name, contenu }`, `EXIT_FORM_FIELDS = ['id', 'name', 'contenu']` et `validateExitForm` alignés sur la validation d'un texte d'ordre de sortie obligatoire. |
| `src/ui/hooks/common/use-resources.hook.ts` | **Modifié** | `buildMutationPayload` retourne `{ id, name, content }` pour `prompts` comme pour `exits` (fin du découpage `.split(/[,;\n]/)` en `matchers`) ; nettoyage de la branche `raw.matchers` dans `resolveResourceText`. |
| `src/ui/components/resources/resource-form-modal.tsx` | **Modifié** | Libellé du champ de saisie pour `kind === 'exits'` remplacé par `'Ordre de sortie'` au lieu de `'Matchers (séparés par virgule)'`. |
| `templates/data/exit/*.json` & `templates/data/prompts/*.json` | **Modifiés** | Conversion de `exit-termine.json`, `exit-fait.json` et `exit-audit.json` au format `{ id, name, content }` avec de vraies consignes de sortie en français, et épuration des répétitions redondantes dans les prompts de démonstration associés. |

---

## 8. Effets de bord identifiés

1. **Gouvernance stricte de l'inventaire signé (`SPEC-ARCH-08` / `CASE-ARCH-08-1` / `08-2`) :** La suppression de `src/domain/exit/exit-matcher.evaluator.ts` (`DOM-009`) modifie le cardinal exact de l'inventaire (`198` $\rightarrow$ `197`). Toute désynchronisation entre `signature-domain.md`, `signature.md`, `case-arch-08-1.test.ts` et le disque ferait échouer immédiatement `npm run test:arch`.
2. **Contrainte d'arité maximale (`SPEC-ARCH-05` / `CASE-ARCH-05-3`) :** L'audit AST impose $\le 3$ paramètres positionnels par fonction sous `src/`. La signature `assemblePrompt(systemPrompt: string, userPrompt: string, exitPrompt = '')` compte exactement **3 paramètres**, respectant la limite sans exemption.
3. **Codes de sortie CLI non nuls désormais pleinement respectés :** Dans l'ancien code, un processus CLI qui plantait avec un code d'erreur non nul *après* avoir affiché un mot-clé matché était considéré en succès à cause de `isExitMatched === true`. En retirant `isExitMatched`, tout `code !== 0` (hors Stop manuel) remonte fidèlement en échec de bloc conformément à `R-25` / `REQ-026`.
4. **Fichiers locaux `.agents/data/exit/*.json` préexistants chez un utilisateur :** Conformément à `CR-04/Q06`, les éventuels fichiers locaux créés sous l'ancien format `matchers` dans un espace `.agents/data/exit/` non versionné devront être réécrits au format `{ id, name, content }` (ou régénérés via `npm run seed:dev`).
5. **Documentation embarquée (`ADR-017`) :** La mise à jour des guides sous `docs/instructions/` se répercutera automatiquement sur l'onglet Documentation de l'IHM et sur l'export `POST /api/docs/export` lors du build.

---

## 9. Ce que nous ne ferons pas dans cette itération

- **Pas de rétrocompatibilité ni de migration heuristique `matchers` $\rightarrow$ `content` :** Tolérer `matchers` dans le schéma ou dans l'UI perpétuerait la confusion conceptuelle à l'origine de l'hallucination.
- **Pas d'interpolation de variables dynamiques dans `exit.content` :** La ressource `exit` reste un texte statique réutilisable (`R-08`, `R-22`).
- **Pas d'altération des archives historiques :** `tdd/docs/cdc/archived/*`, `tdd/docs/cr/CR-001..003.md`, `tdd/docs/impact/impact-CR-001..011*.md` et `rapports/archived/*` demeurent strictement intacts.

---

## 10. Ordre d'exécution retenu

| # | Étape | Responsable |
|---|---|---|
| 1 | Validation de la présente analyse d'impact `impact-CR-012` | Autrement (`U`) |
| 2 | Mise à jour du **CDC v2.3** (`tdd/docs/cdc/cahier-des-charges-v2.3.md` : en-tête, §6, `R-07`, `R-22`, `R-45`, `REQ-017`, `REQ-032`, §11, §12, Annexe B.4) | Cursor |
| 3 | Mise à jour des **Spécifications**, **UML**, **Signatures** et **Guides utilisateur** (`tdd/specs/`, `tdd/docs/uml/`, `tdd/docs/signature/`, `docs/instructions/`) | Cursor |
| 4 | Mise à jour des **Fiches CASE** (`tdd/tests/`) et des **Tests automatisés** (`tests/`), puis constatation de l'état **ROUGE** attendu sur les cas métier modifiés/ajoutés | Cursor |
| 5 | Mise en conformité du **Code source** (`src/`) et des **Templates** (`templates/data/`), passage au **VERT** intégral | Cursor |
| 6 | Vérification complète de non-régression et d'architecture (`npm test`, `npm run test:arch`, `npm run quality`, `npm run build`) | Cursor |
