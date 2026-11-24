# Analyse d'impact — CR-003 (Sélection du modèle d'IA sur les profils et propagation à l'adaptateur Cursor CLI)

**Demande du client :** Adapter les profils et les adaptateurs (notamment `CursorCLIAdapter`) pour permettre la sélection d'un modèle d'IA au niveau du profil (`Profile.model?: string`), propager ce modèle à l'exécution de la commande CLI (`--model <id>`), et intégrer la sélection assistée via notre composant d'autocomplétion sur l'IHM, sans intégrer les crochets de paramétrage avancé pour le moment.  
**Reçue le :** 06/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `feat/profile-model-adapter`  

---

> **Interdiction de modifier le code avant que cette analyse soit complète.**
>
> La modification descend la chaîne dans cet ordre : cahier des charges → specs →
> signatures / architecture → cas de test → tests automatisés → code. Commencer par le code,
> c'est perdre la trace de pourquoi il a changé — et c'est exactement ce que ce
> module cherche à vous faire éviter.

---

## 1. Ce que le client demande, reformulé

Aujourd'hui, l'exécution des blocs Run délègue la commande à l'adaptateur CLI embarqué (Cursor CLI) sans spécifier de modèle d'IA particulier, ce qui contraint l'outil à utiliser son modèle configuré par défaut dans l'environnement.

Le client demande :
1. **Attribution d'un modèle d'IA par profil :** Permettre d'associer un modèle d'IA cible à chaque profil déclaratif (`Profile.model?: string`). Ce champ est facultatif (s'il est omis ou vide, le modèle par défaut du CLI hôte reste actif).
2. **Propagation à la commande de spawn CLI :** Lors de l'exécution d'un bloc Run, le contexte d'exécution (`ExecutionContext`) doit recevoir ce modèle via la résolution des ressources du runner (`runner-process-spawner.ts`), et l'adaptateur `CursorCLIAdapter` doit injecter l'argument `--model <id>` dans la commande exécutée.
3. **Sélection assistée dans l'IHM :** Intégrer notre composant `<AutocompleteInput />` dans la modale d'édition/création de profil (`ProfileFormModal`), alimenté par la découverte des modèles disponibles (via une méthode de découverte `listModels()` et une route HTTP dédiée `GET /api/models`).
4. **Exclusion explicite des crochets :** Le client a confirmé expressément de ne pas intégrer de logique ni de syntaxe dédiée aux crochets de surcharges avancées (`[context=1m,effort=high,fast=false]`) pour le moment ; le modèle est une chaîne simple (identifiant brut de modèle).

---

## 2. Questions posées au client & Décisions actées

| # | Question | Réponse / Décision |
|---|---|---|
| 1 | Les informations entre crochets (`[context=1m,effort=high,fast=false]`) visibles dans l'aide de Cursor sont-elles obligatoires ? | **Non, absolument pas.** Le client a confirmé : *"pour le moment juste model on ne vas pas integrer les crochet"*. L'identifiant simple (ex. `gpt-5.3-codex`, `claude-sonnet-5-thinking-high`) est la syntaxe standard nominale. |
| 2 | La spécification d'un modèle sur un profil est-elle obligatoire ? | **Non.** Le champ `model?: string` est facultatif. En cas d'absence, aucun flag `--model` n'est injecté dans la commande CLI, préservant la compatibilité totale avec les profils existants. |
| 3 | Le champ d'autocomplétion du modèle doit-il valider ou contraindre les valeurs saisies ? | **Non.** Saisie libre stricte (*freeform*) garantie par `<AutocompleteInput />` : l'utilisateur peut choisir une suggestion ou taper un identifiant personnalisé sans blocage. |
| 4 | Comment les modèles disponibles sont-ils récupérés ? | Une méthode optionnelle `listModels?(): Promise<readonly string[]>` est ajoutée au contrat `CLIAdapter`. `CursorCLIAdapter` exécute `cursor-agent --list-models` et extrait les identifiants de modèles, avec repli (*fallback*) automatique sur un catalogue prédéfini si le binaire est inaccessible ou renvoie une erreur. |
| 5 | Comment l'IHM web accède-t-elle à ces modèles ? | Un endpoint HTTP `GET /api/models` est exposé par le serveur ClientsBox via `ResourceController` et `AdapterRegistryService`. |

---

## 3. Impact — Cahier des charges (CDC v2)

| Exigence | Impact | Action |
|---|---|---|
| `REQ-027` (Interface d'adaptateur CLI polymorphe) | **Complétée** | Enrichissement du contrat `ExecutionContext` avec la propriété optionnelle `model?: string` et de `CLIAdapter` avec la méthode `listModels?()`. |
| `REQ-029` (Génération des commandes CLI de spawn) | **Modifiée** | Prise en compte du paramètre `--model <id>` dans la génération de la commande d'exécution par `CursorCLIAdapter.buildCommand`. |
| `REQ-011` (CRUD ressources déclaratives) | **Complétée** | Support du champ optionnel `model` dans le schéma, la validation et la persistance des profils sous `.agents/data/profils/*.json`. |
| `REQ-007` (IHM ergonomique en français) | **Complétée** | Intégration du sélecteur prédictif de modèle dans `ProfileFormModal` et affichage du modèle configuré dans le tableau de bord des profils. |
| Reste du CDC (`REQ-001` à `REQ-038`, NFR) | Inchangées | Aucun impact négatif sur l'orchestration des flux, le moteur d'exécution ou les conditions de sortie. |

---

## 4. Impact — Spécifications fonctionnelles

| Spécification | Impact | Ce qui change exactement |
|---|---|---|
| [`SPEC-DATA-01`](../specs/DATA.md#spec-data-01--schémas-json-stricts-pour-les-ressources-déclaratives) | **Modifiée** | Ajout de la propriété optionnelle `model?: string` dans le schéma `Profile` (`TYPES-003`). Validation par `parseProfile` : si renseigné, `model` doit être une chaîne de caractères non vide (nettoyée des espaces). Passage en version v1.2. |
| [`SPEC-ADPT-01`](../specs/ADPT.md#spec-adpt-01--contrat-dinterface-typescript-des-adapters-cli) | **Modifiée** | Ajout du champ `readonly model?: string` dans `ExecutionContext`. Ajout de la méthode optionnelle `listModels?(): Promise<readonly string[]>` dans `CLIAdapter`. Ajout du critère **`AC-ADPT-01-5`**. Passage en version v1.2. |
| [`SPEC-ADPT-02`](../specs/ADPT.md#spec-adpt-02--adapter-cursor-cli) | **Modifiée** | `CursorCLIAdapter.buildCommand` conditionne l'ajout des arguments `['--model', ctx.model.trim()]` si `ctx.model` est fourni et non vide. Implémentation de `listModels()` interrogeant `cursor-agent --list-models` avec fallback résilient. Ajout du critère **`AC-ADPT-02-5`**. Passage en version v1.2. |
| [`SPEC-ENG-04`](../specs/ENG.md#spec-eng-04--cycle-de-vie-dune-exécution-de-scénario) | **Modifiée** | Lors de la préparation de commande dans `prepareRunContext`, transmission de `res.profile?.model` au contexte passé à `buildCommand`. |
| [`SPEC-UI-01`](../specs/UI.md#spec-ui-01--ihm-en-français-navigation-et-formulaires-de-gestion-crud) | **Modifiée** | Ajout de `model?: string` dans `ProfileFormValues`. Ajout du champ `<AutocompleteInput />` dans `ProfileFormModal`. Affichage du badge modèle dans `ProfilesPage`. |
| [`tdd/specs/sommaire.md`](../specs/sommaire.md) | **Modifiée** | Indexation des critères et évolutions de spécifications. |

---

## 5. Impact — Conception & Architecture technique

| Artefact | Impact | Ce qui change |
|---|---|---|
| `tdd/docs/signature/signature-types.md` | **Modifié** | §1 Modèles : `Profile.model?: string`. §2 Contrats : `ExecutionContext.model?: string` et `CLIAdapter.listModels?(): Promise<readonly string[]>`. |
| `tdd/docs/signature/signature-lib.md` | **Modifié** | `CursorCLIAdapter` : documentation de la méthode `listModels()` et du comportement `--model` dans `buildCommand()`. |
| `tdd/docs/signature/signature-services.md` | **Modifié** | `AdapterRegistryService` : méthode `listOperationalModels(): Promise<readonly string[]>`. `runner-process-spawner.ts` : propagation du modèle. |
| `tdd/docs/signature/signature-controllers.md` | **Modifié** | Route HTTP `GET /api/models` retournant la liste JSON des modèles disponibles. |
| `tdd/docs/signature/signature-ui.md` | **Modifié** | `ProfileFormModalProps` et `ProfileFormValues` avec champ `model?: string`. |
| Question nouvelle donnée / état | **Traitée** | **Oui, donnée nouvelle** : propriété déclarative `model` sur l'entité `Profile`, propagée dans `ExecutionContext`. Aucun état runtime complexe supplémentaire (gestion en mode stateless à l'instar des autres options de commande). |
| Couplage & DAG (`SPEC-ARCH-01`) | **Conforme** | La couche UI consomme `GET /api/models` via `HttpClient`. `CursorCLIAdapter` reste dans `src/lib/adapters/`. |
| Complexité cyclomatique (`SPEC-ARCH-07`) | **Conforme** | Parsing des modèles dans `listModels` isolé dans une fonction dédiée : $CC \le 6$. Construction des arguments dans `buildCommand` : $CC \le 4$. |
| Volumétrie (`SPEC-ARCH-05`) | **Conforme** | `ProfileFormModal` passe de 146 à ~175 lignes TSX (seuil nominal 250 lignes TSX). |
| Conventions de nommage (`SPEC-ARCH-07`) | **Conforme** | camelCase strict per convention. |

---

## 6. Impact — Tests

| Cas de test | Impact | Description |
|---|---|---|
| `CASE-ADPT-01-1.test.ts` | **Conforme / Ajusté** | Vérification de la compatibilité de l'interface `CLIAdapter` avec la méthode optionnelle `listModels`. |
| `CASE-ADPT-02-2.test.ts` | **Inchangé (Vert)** | Vérifie `buildCommand` sans modèle (comportement rétro-compatible préservé : aucun `--model` injecté). |
| `CASE-ADPT-02-5.md` *(nouveau)* | **À créer** | Spécification TDD du cas de test vérifiant la génération de commande avec `--model <id>` et le fonctionnement de `listModels()`. |
| `tests/units/adpt/CASE-ADPT-02-5.test.ts` *(nouveau)* | **À écrire** | Test automatisé Vitest pour `CursorCLIAdapter.buildCommand` (avec modèle, sans modèle, avec espaces) et `CursorCLIAdapter.listModels`. |
| `CASE-DATA-01-2.test.ts` | **Inchangé / Complété** | Vérifie que `parseProfile` accepte le champ optionnel `model` et rejette les types invalides. |
| `CASE-SRV-02-13.test.ts` | **Complété** | Vérifie que la route HTTP `GET /api/models` renvoie un tableau JSON de modèles avec entêtes anti-cache. |
| `CASE-UI-01-2.test.ts` | **Inchangé (Vert)** | `PROFILE_FORM_FIELDS` (champs obligatoires) reste inchangé (`id`, `name`, `systemPrompt`, `policy`), le modèle étant optionnel. |
| Tests existants (152 tests) | Inchangés | Zéro régression autorisée sur la suite de tests unitaires et de qualité. |

---

## 7. Impact — Code source

| Fichier / Module | Impact | Description |
|---|---|---|
| `src/types/models/profile.model.ts` | **Évolution** | Ajout de `readonly model?: string;` sur l'interface `Profile`. |
| `src/domain/schemas/profile.schema.ts` | **Évolution** | Prise en compte et validation du champ optionnel `model` dans `parseProfile`. |
| `src/types/contracts/cli-adapter.contract.ts` | **Évolution** | Ajout de `readonly model?: string;` dans `ExecutionContext` et `listModels?(): Promise<readonly string[]>` dans `CLIAdapter`. |
| `src/lib/adapters/cursor-cli.adapter.ts` | **Évolution** | Injection de `['--model', ctx.model.trim()]` dans `buildCommand` et implémentation de `listModels()`. |
| `src/services/runner-process-spawner.ts` | **Évolution** | Transmission de `model: res.profile?.model` à `buildCommand` dans `prepareRunContext`. |
| `src/services/adapter-registry.service.ts` | **Évolution** | Méthode `listOperationalModels(): Promise<readonly string[]>`. |
| `src/controllers/http/resource.controller.ts` | **Évolution** | Enregistrement de la route `GET /api/models`. |
| `src/ui/types/ui.types.ts` | **Évolution** | Ajout de `model?: string` dans `ProfileFormValues`. |
| `src/ui/components/profiles/profile-form-modal.tsx` | **Évolution** | Intégration du composant `<AutocompleteInput />` pour la sélection du modèle. |
| `src/ui/pages/profiles-page.tsx` | **Évolution** | Affichage de l'information du modèle sur la ligne de profil. |

---

## 8. Effets de bord identifiés & Solutions

1. **Environnement d'exécution sans CLI Cursor installé ou sans connexion réseau :**
   * *Risque :* L'appel à `cursor-agent --list-models` peut échouer si le binaire n'est pas encore installé ou configuré sur la machine de test/développement.
   * *Solution :* L'adaptateur encapsule la commande dans un bloc `try/catch` et renvoie une liste statique de modèles de secours de référence (`auto`, `gpt-5.3-codex`, `claude-sonnet-5-thinking-high`, etc.) garantissant la disponibilité continue de l'autocomplétion.
2. **Chaîne vide ou espaces saisis dans le champ modèle :**
   * *Risque :* Une chaîne contenant uniquement des espaces (`"   "`) générerait un argument CLI invalide `--model ""`.
   * *Solution :* Normalisation stricte via `trim()` : si la chaîne résultante est vide, aucun argument `--model` n'est produit par l'adaptateur.
3. **Compatibilité des profils persistés existants :**
   * *Risque :* Des profils créés avant cette évolution ne possèdent pas la clé `model` dans leur fichier JSON.
   * *Solution :* La désérialisation traite l'absence de `model` comme `undefined` sans erreur de schéma.

---

## 9. Ce que nous ne ferons pas dans cette passe

* **Pas de syntaxe ni d'interface dédiée pour les crochets `[...]` :** Conformément à l'arbitrage utilisateur (*"pour le moment juste model on ne vas pas integrer les crochet"*), aucune validation, décomposition ou paramétrage de flags entre crochets (`effort`, `context`, etc.) n'est introduit. La saisie libre permet à l'utilisateur avancé de saisir manuellement ce qu'il désire sans être bloqué.
* **Pas de validation bloquante sur le nom du modèle :** Tout modèle saisi manuellement est accepté et transmis tel quel à l'outil CLI.

---

## 10. Ordre d'exécution retenu (Chaîne TDD)

| # | Étape | Livrable |
|---|---|---|
| 1 | **Spécifications fonctionnelles** | Mise à jour de `tdd/specs/DATA.md` (`SPEC-DATA-01`), `tdd/specs/ADPT.md` (`SPEC-ADPT-01`, `SPEC-ADPT-02`), `tdd/specs/ENG.md` (`SPEC-ENG-04`), `tdd/specs/UI.md` (`SPEC-UI-01`) et `tdd/specs/sommaire.md`. |
| 2 | **Signatures techniques** | Mise à jour de `tdd/docs/signature/signature-types.md`, `signature-lib.md`, `signature-services.md`, `signature-controllers.md` et `signature-ui.md`. |
| 3 | **Fiches de Cas de Test** | Rédaction de `tdd/tests/adpt/CASE-ADPT-02-5.md` et mise à jour de `tdd/tests/adpt/sommaire.md`. |
| 4 | **Tests automatisés (Rouge)** | Rédaction des tests unitaires `tests/units/adpt/CASE-ADPT-02-5.test.ts` et extensions des tests associés. Validation de leur échec initial. |
| 5 | **Code de production (Vert)** | Implémentation de `Profile.model`, `parseProfile`, `CursorCLIAdapter`, `prepareRunContext`, `AdapterRegistryService`, route `GET /api/models` et intégration dans `ProfileFormModal` & `ProfilesPage`. |
| 6 | **Intégration & Qualité** | Recompilation des assets embarqués (`npm run build:assets`), validation des 152+ tests unitaires (`npm run test:unit`) et vérification stricte de la qualité (`npm run quality`). |

---

## 11. Addendum architectural (09/11/2026) — Réassignation du modèle d'IA à l'Agent

Lors de l'intégration multi-CLI (Antigravity et Cursor CLI), une anomalie de conception a été identifiée :
1. Le catalogue des modèles disponibles dépend directement du binaire CLI (`cliId`).
2. Conformément à `REQ-010`, un profil déclaratif (rôle/persona, prompt système et politique d'injection) a vocation à être partagé entre plusieurs agents qui peuvent être rattachés à des CLI distincts (`cursor-cli` ou `antigravity`).
3. Fixer le modèle sur le `Profile` empêchait ce partage sans provoquer de conflits de modèles non reconnus par un CLI tiers.
4. **Décision :** Le champ optionnel `model?: string` est réassigné à l'entité `Agent` (`agent.model.ts`). L'autocomplétion UI est déplacée dans `AgentFormModal` et filtrée dynamiquement selon l'adapter CLI sélectionné (`GET /api/models?cliId=...`). Pour assurer la rétrocompatibilité, le runner résout en priorité `agent.model` avec repli temporaire sur `profile.model`.


