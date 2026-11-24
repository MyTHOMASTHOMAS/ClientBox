# Analyse d'impact — CR-007 (Unification des sorties JSON et Lazy Session Antigravity & Cursor)

**Demande du client :** Convertir les adaptateurs Antigravity CLI (`antigravity`) et Cursor CLI (`cursor-cli`) au mode JSON. Pour Antigravity, s'aligner sur Codex en supprimant le prompt d'amorce `ping` au démarrage (capture paresseuse de session au 1er Run). Pour Cursor, conserver `create-chat` et passer l'exécution en format JSON. Dans les deux cas, parser rigoureusement la sortie avec `parseOutput` pour le SAC.  
**Reçue le :** 10/11/2026  
**Rédigée par :** Autrement (`U`) / Antigravity (Consensus TDD)  
**Branche Git dédiée :** `feat/unify-cli-json-output`  

---

> **Règle fondamentale TDD :**
> Interdiction formelle de modifier le code de production avant la ratification des spécifications, la mise à jour des cas de test et la vérification des tests unitaires rouges.  
> La chaîne descend impérativement : CDC $\rightarrow$ Specs $\rightarrow$ Signatures & Architecture $\rightarrow$ Cas de test $\rightarrow$ Tests unitaires automatisés $\rightarrow$ Code $\rightarrow$ Refactoring.

---

## 1. Ce que le client demande, reformulé

ClientsBox intègre désormais 3 adaptateurs CLI opérationnels : `cursor-cli` (`SPEC-ADPT-02`), `antigravity` (`SPEC-ADPT-04`) et `codex-cli` (`SPEC-ADPT-05`).  
Le client demande d'unifier la gestion du flux de sortie et le cycle de session conversationnelle :

1. **Pour Antigravity CLI (`antigravity` / `agy`) :**
   - **Élimination du prompt d'amorce préalable (`ping`) :** suppression du spawn de probe au début du scénario, éliminant tout gaspillage de tokens LLM et toute latence inutile.
   - **Capture paresseuse de session (Lazy Session) au 1er Run :** le 1er Run s'exécute directement avec le prompt utilisateur en mode initial (sans `--conversation`).
   - **Extraction de l'ID conversationnel (`extractSessionId`) :** dès la première ligne émise sur stdout en format `stream-json`, `extractSessionId(line)` extrait le `conversation_id` et l'enregistre dans `ScenarioSessionRegistry`.
   - **Reprise de session multi-runs fluide :** les Runs suivants réutilisent automatiquement cet identifiant via `--conversation <conversation_id>`.
   - **Passage en format JSON :** `buildCommand` injecte `--output-format stream-json`.
   - **Normalisation de la sortie pour le SAC (`parseOutput`) :** extraction de la réponse finale de l'agent (depuis `result.response` ou les fragments `step_update.text_delta`) pour transmettre au SAC et aux blocs avals (`If`) une chaîne de texte propre débarrassée des métadonnées JSON.

2. **Pour Cursor CLI (`cursor-cli` / `cursor-agent`) :**
   - **Conservation de `create-chat` :** la commande native `cursor create-chat` est conservée pour `createSession` car elle n'exécute aucun prompt et ne consomme aucun token.
   - **Passage de l'exécution en sortie JSON :** `buildCommand` injecte `--output-format json` lors de l'exécution avec `-p`.
   - **Normalisation de la sortie pour le SAC (`parseOutput`) :** décodage du JSON retourné par Cursor et extraction stricte du texte propre produit par l'agent.

3. **Garantie d'intégrité pour le SAC :**
   - Quel que soit l'adaptateur (`codex-cli`, `antigravity` ou `cursor-cli`), le payload de bloc émis vers le SAC et les blocs avals (`If`) est **strictement et exclusivement** le texte utile de réponse.

---

## 2. Bilan technique des binaires hôtes

| Adaptateur | Mode d'exécution actuel | Nouveau mode d'exécution | Gestion de session | Normalisation SAC (`parseOutput`) |
|---|---|---|---|---|
| **`antigravity` (`agy`)** | `--print "<prompt>"` (texte brut) | `--output-format stream-json --print "<prompt>"` | **Lazy Session** via `extractSessionId` au 1er Run (suppression de l'amorce `ping`) | Extraction de `result.response` ou assemblage des `text_delta` |
| **`cursor-cli` (`agent`)** | `-p --resume <id> "<prompt>"` (texte brut) | `-p --output-format json --resume <id> "<prompt>"` | Conservation de `createSession` via `cursor create-chat` (0 token) | Extraction du champ textuel de l'objet/flux JSON Cursor |
| **`codex-cli` (`codex`)** | `exec [--json] ...` | Déjà aligné (CR-006) | Déjà aligné (Lazy Session) | Déjà aligné |

---

## 3. Impact Spécifications (`tdd/specs/ADPT.md`)

- **`SPEC-ADPT-01`** : Révision de la clause `parseOutput` et `extractSessionId` pour officialiser que les adaptateurs Antigravity et Cursor normalisent également leur sortie JSON vers le texte pur.
- **`SPEC-ADPT-02`** : Mise à jour de la commande `buildCommand` de `cursor-cli` pour inclure `--output-format json`, et spécification de `parseOutput`.
- **`SPEC-ADPT-04`** : Mise à jour de la commande `buildCommand` d'Antigravity pour inclure `--output-format stream-json`, suppression du probe préalable `ping` dans `ScenarioSessionRegistry.resolve`, intégration de `extractSessionId` et spécification de `parseOutput`.

---

## 4. Impact Fiches de Tests (`tdd/tests/adpt/`)

- **`CASE-ADPT-01-2.md`** : Mise à jour de la commande attendue pour `cursor-cli` avec `--output-format json`.
- **`CASE-ADPT-01-3.md`** : Spécification du comportement de `parseOutput` sur une sortie JSON Cursor.
- **`CASE-ADPT-04-1.md`** & **`CASE-ADPT-04-2.md`** : Mise à jour des arguments attendus pour Antigravity avec `--output-format stream-json`.
- **`CASE-ADPT-04-3.md`** : Spécification de `parseOutput` pour extraire la réponse textuelle propre depuis un flux `stream-json` Antigravity.
- **`CASE-ADPT-04-6.md`** : Spécification de la session Antigravity : suppression du test d'amorce `ping` préalable au scénario, validation de la capture dynamique de `conversation_id` au 1er Run et reprise au 2e Run.

---

## 5. Règles d'Architecture et Qualité

- **Taille de fichier (`SPEC-ARCH-05`)** : maintien strict $\le 150$ lignes physiques non-TSDoc (ou $\le 200$ avec `@fileExemption`).
- **Complexité cyclomatique (`SPEC-ARCH-07`)** : CC $\le 10$ par fonction/méthode.
- **Profondeur AST (`SPEC-ARCH-07`)** : AST depth $\le 3$.
- **Arité (`SPEC-ARCH-07`)** : au maximum 3 paramètres par fonction.
- **Typage de retour (`SPEC-ARCH-08`)** : aucune annotation explicite de type de retour de fonction sans `@returnTypeExemption`.
- **Règles Git** : interdiction absolue de commiter sans autorisation explicite du client.

