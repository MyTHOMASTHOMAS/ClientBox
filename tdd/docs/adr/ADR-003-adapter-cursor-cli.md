# ADR-003 — Adapter cursor-cli et `CURSOR_CLI_BIN`

**Statut :** accepté  
**Date :** 21/09/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| R-04, R-28, R-38, R-40 | v1 = cursor-cli uniquement ; binaire via env |
| REQ-013, REQ-029, REQ-031, REQ-112 | Adapter cursor-cli ; `CURSOR_CLI_BIN` obligatoire build+dev |
| R-27, R-45, REQ-032 | Wrapper ; prompt assemblé avant `buildCommand` |
| R-34, REQ-025 | Stop = kill ; session CLI conservée (kill ≠ clear) |
| R-30, R-39, REQ-020, REQ-021 | ClearContext / clear manuel → délégation CLI |
| Annexe A | Prérequis CLI Cursor + `CURSOR_CLI_BIN` |

Cet ADR **spécialise** ADR-002 pour le seul CLI v1 nommé par le CDC.

---

## Contexte

En v1, le seul adapter opérationnel est **cursor-cli**. Le CDC impose la variable d'environnement **`CURSOR_CLI_BIN`** (chemin du binaire) en build et en dev, et un adapter « simple » : construire la requête + parser le flux. La session / mémoire conversationnelle Cursor reste **gérée par le CLI Cursor** ; ClientsBox n'implémente pas de journal de session parallèle.

## Options envisagées

### Option A — Spawn du binaire `CURSOR_CLI_BIN` + parse stream ligne à ligne (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Conformité R-40 / REQ-029 / REQ-031 / REQ-112 ; simple |
| Ce qu'elle coûte | Dépendance à l'UX CLI Cursor (flags, format de sortie) |
| Ce qu'elle rend difficile plus tard | Changement breaking de l'interface CLI Cursor |

### Option B — SDK / API HTTP Cursor cloud

| | |
|---|---|
| Ce qu'elle apporte | API stable éventuelle |
| Ce qu'elle coûte | Contredit le modèle « wrapper CLI local » du CDC |
| Ce qu'elle rend difficile plus tard | Hors périmètre « pas de service distant » pour l'outil |

### Option C — Shell libre saisi dans le canvas

| | |
|---|---|
| Ce qu'elle apporte | Flexibilité |
| Ce qu'elle coûte | Contredit REQ-028 (blocs indépendants de la syntaxe) et l'adapter |
| Ce qu'elle rend difficile plus tard | Perte d'unification |

## Décision

1. **Identifiant adapter :** `cliId = 'cursor-cli'`.
2. **Binaire :** lu exclusivement depuis **`process.env.CURSOR_CLI_BIN`**. Absence ⇒ **échec explicite** au build et au démarrage / usage adapter (REQ-031, REQ-112).
3. **`buildCommand(ctx)` :**  
   - `command` = valeur de `CURSOR_CLI_BIN` ;  
   - `args` / flags = ceux nécessaires pour exécuter le prompt déjà fourni dans `ctx.assembledPrompt` (détail flags → **specs** cursor-cli, pas le CDC) ;  
   - `cwd` = `ctx.workspacePath` sauf contrainte CLI contraire documentée en specs.
4. **`parseStreamLine` :** normalise la sortie vers `AgentStreamEvent` (stdout/stderr/exit/error) pour le terminal UI live (R-26, REQ-024) — **sans** persister les chunks sous `data/`.
5. **Session :** aucune table/fichier session ClientsBox ; continuité = comportement natif Cursor après kill vs clear (R-34 vs R-30).
6. **`clearContext` :** **obligatoire** sur cet adapter (voir ADR-002, règle 5 « Clear (v1) ») — invoque le mécanisme CLI de reset documenté en specs (ou commande équivalente) ; **≠** Stop/kill.
7. **Pas d'autre CLI** dans le menu tant qu'aucun autre adapter embarqué n'existe (REQ-013).

## Raisons

- Le CDC nomme explicitement cursor-cli + `CURSOR_CLI_BIN` ; l'option A est la seule lecture conforme.
- B et C violent le périmètre wrapper CLI local / adapters.
- Séparer flags exacts en **specs** évite de surcharger l'ADR tout en gardant le contrat stable (ADR-002).

## Conséquences acceptées

- Toute machine de build/dev doit définir `CURSOR_CLI_BIN`.
- Un changement de CLI Cursor peut forcer une révision de **specs** (args/parse) sans forcément changer ADR-002.
- Courses multi-Run même agent = risque CLI (R-33) — non mitigé ici.

## Ce qui nous ferait revenir dessus

- Remplacement de cursor-cli comme CLI v1 (amendement CDC + nouvel ADR).
- Apparition d'une API officielle imposée produit au détriment du binaire CLI.

## Liens

- Contrat générique : **ADR-002**.
- Assemblage prompt : R-45 / moteur (**ADR-004** fournit le moment d'appel).
