# ADR-002 — Contrat d'adapter CLI (`CLIAdapter`)

**Statut :** accepté  
**Date :** 21/09/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| Objectif 3, §6, R-18, R-27, R-28, R-29, R-38 | Adapters embarqués ; invocation uniquement via adapter ; `buildCommand` + `parseStreamLine` |
| REQ-008, REQ-013, REQ-027, REQ-028, REQ-029, REQ-103 | Menu CLI = adapters opérationnels ; conformité contrat ; blocs indépendants du CLI |
| R-45, REQ-032 | Assemblage prompt **avant** l'adapter |
| Annexe C, Annexe D.1 / D.2 | Pipeline canvas → moteur → adapter ; messages `BlockMessage` |
| R-23, R-24, R-30, R-31, R-32, R-33, R-34 | Contexte / clear / stop — **sans** inventer un store session ClientsBox |

Cet ADR **complète** le CDC en définissant le **contrat TypeScript minimal** que D.1 renvoyait aux ADR, sans empiéter sur les schémas `value` (R-41 → specs).

---

## Contexte

Le CDC exige que toute invocation CLI passe par un **adapter embarqué**, que les blocs restent indépendants de la syntaxe CLI, et que le contrat v1 repose sur `buildCommand` + `parseStreamLine`. L'Annexe D.1 ne porte plus les interfaces : elles doivent être tranchées ici pour rendre REQ-027 opérable. La **persistance de conversation / mémoire** n'est **pas** un sous-système ClientsBox : elle est **gérée par le CLI** (le wrapper n'y substitue pas un store maison). ClientsBox orchestre clear/kill selon le CDC ; le CLI reste source de vérité du contexte natif.
Le champ optionnel **`cliOpaque`** sur `ExecutionContext` est un **complément d'ADR** (non nommé dans le CDC) :
relais opaque CLI↔ClientsBox (ex. id de conversation), **pas** un schéma métier ni un store sous `data/`
(R-37, R-41 — détail d'usage → **specs**).

## Options envisagées

### Option A — Contrat mince : `buildCommand` + `parseStreamLine` + événements stream (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Alignement R-29 ; adapteurs simples ; prompt assemblé en amont (R-45) |
| Ce qu'elle coûte | Peu de sémantique métier dans l'adapter (voulu) |
| Ce qu'elle rend difficile plus tard | Adapters « riches » (hors v1, écarté par CDC) |

### Option B — Adapter riche (session, outils, UI CLI dans ClientsBox)

| | |
|---|---|
| Ce qu'elle apporte | Contrôle fin |
| Ce qu'elle coûte | Contredit « cursor-cli simple » et « ClientsBox = wrapper » |
| Ce qu'elle rend difficile plus tard | Couplage fort à chaque CLI |

### Option C — Plugins chargeables depuis le projet hôte

| | |
|---|---|
| Ce qu'elle apporte | Extensibilité sans rebuild |
| Ce qu'elle coûte | Hors périmètre v1 (adapters embarqués uniquement) |
| Ce qu'elle rend difficile plus tard | Surface de sécurité / versioning |

## Décision

Le contrat adapter v1 est un **module embarqué** par CLI, exposant au minimum :

```typescript
/** Contexte d'exécution fourni par ClientsBox (pas le store de session CLI). */
export interface ExecutionContext {
  workspacePath: string;       // = cwd (REQ-006)
  agentId: string;
  assembledPrompt: string;     // déjà assemblé (R-45) — l'adapter ne le reconstruit pas
  /** Pass-through opaque CLI (ex. id conversation) — hors schéma métier CDC ; ≠ store session ClientsBox. */
  cliOpaque?: Record<string, unknown>;
}

export type AgentStreamEvent =
  | { type: 'stdout' | 'stderr'; chunk: string }
  | { type: 'exit'; code: number | null }
  | { type: 'error'; message: string };

export interface CLIAdapter {
  readonly cliId: string; // ex. 'cursor-cli'
  /** Construit la commande / args / env pour spawn — binaire résolu hors de cet ADR pour cursor (ADR-003). */
  buildCommand(ctx: ExecutionContext): {
    command: string;
    args: string[];
    env?: NodeJS.ProcessEnv;
    cwd?: string;
  };
  /** Parse une ligne (ou chunk) de sortie CLI → événement normalisé. */
  parseStreamLine(line: string): AgentStreamEvent | null;
  /**
   * Demande d'effacement de contexte via le CLI (ClearContext / clear manuel) — délégation au CLI.
   * **v1 :** obligatoire pour tout adapter listé comme opérationnel (cursor-cli — ADR-003) ;
   * optionnel (`?`) uniquement pour stubs / CLI futurs non encore branchés au menu.
   */
  clearContext?(ctx: ExecutionContext): Promise<void> | void;
}
```

Règles liées :

1. **Menu CLI** = uniquement les `cliId` dont l'adapter est embarqué et opérationnel (R-04, R-28, REQ-008).
2. **Nouvel CLI** = nouvel adapter dans le livrable, **sans** changer le modèle de blocs (R-18, REQ-103).
3. **Session / mémoire** : **propriété du CLI** ; ClientsBox ne persiste pas l'historique conversationnel sous `data/` (R-37). `cliOpaque` éventuel est un relais, pas un schéma métier CDC.
4. **Stop** = kill process enfant (R-34) ; **≠** clear. Clear = `clearContext` / UI agent (R-30).
5. **Clear (v1) :** l'adapter `cursor-cli` **doit** fournir `clearContext` non no-op documenté
   (R-30, R-39, REQ-020, REQ-021). L'absence sur un CLI futur hors menu reste tolérée.

## Raisons

- R-29 / REQ-027 / D.1 exigent un contrat opposable ; l'option A est le minimum nommé par le CDC.
- R-45 place l'assemblage prompt **avant** `buildCommand` — le champ `assembledPrompt` matérialise cette frontière.
- Option B contredit le périmètre « adapter simple » ; option C est hors périmètre v1.
- La délégation session→CLI évite un double store et respecte « ClientsBox wrappe / n'invente pas le CLI ».

## Conséquences acceptées

- Les specs détaillent les schémas `value` et l'usage exact de `cliOpaque` par CLI, sans changer ce contrat.
- Un adapter qui ne peut pas clear nativement documente no-op / erreur explicite en specs du CLI concerné.
- Blocs et canvas ne connaissent que `CLIAdapter`, jamais la syntaxe brute.

## Ce qui nous ferait revenir dessus

- Besoin d'adapters chargeables à chaud (changerait le CDC hors périmètre).
- Obligation produit d'un store de session ClientsBox distinct du CLI (nouvelle exigence CDC).

## Liens

- Implémentation v1 : **ADR-003** (cursor-cli + `CURSOR_CLI_BIN`).
- Messages inter-blocs : Annexe D.2 (CDC) ; schémas `value` → specs (R-41).
