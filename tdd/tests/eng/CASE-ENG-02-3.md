# CASE-ENG-02-3 — Inactivité absolue de tout bloc ayant 0 entrée câblée (règle $N=0$ hors Start)

**Spécification :** `SPEC-ENG-02`
**Critère d'acceptation :** `AC-ENG-02-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Tout bloc de type Run, If ou ClearContext n'ayant aucune connexion d'entrée ($N = 0$) est un bloc orphelin qui ne doit jamais être exécuté, ni propager de message ou de puissance sur ses sorties (`R-42d`). Seul le bloc Start possède 0 entrée et a le privilège de s'activer au lancement (`R-42c`, `REQ-015`). Si cette règle était violée, des blocs non connectés s'exécuteraient de manière imprévisible.

## Cas

```gherkin
Étant donné un scénario comportant :
  | blocId        | type           | entreesCablees |
  | "start-0"     | "start"        | 0              |
  | "run-orphan"  | "run"          | 0              |
  | "if-orphan"   | "if"           | 0              |
  | "clear-orphan"| "clearContext" | 0              |
Quand l'utilisateur lance l'exécution du scénario
Alors le bloc "start-0" démarre et émet son message initial
Mais les blocs "run-orphan", "if-orphan" et "clear-orphan" restent dans l'état "inactif"
Et aucun message ni puissance n'est émis sur les sorties de ces trois blocs orphelins
Et aucune commande CLI n'est invoquée pour "run-orphan" ou "clear-orphan"
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc Start (racine autorisée) | `id: "start-0"`, $N=0$ |
| Bloc Run orphelin | `id: "run-orphan"`, $N=0$, agent: `"agent-1"` |
| Bloc If orphelin | `id: "if-orphan"`, $N=0$, script: `"check.js"` |
| Bloc ClearContext orphelin | `id: "clear-orphan"`, $N=0$, agent: `"agent-1"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Statut d'exécution de `start-0` | `EXECUTED` | Exception Start : 0 entrée mais déclenchement automatique (R-42c) |
| Statut d'exécution de `run-orphan` | `IDLE` / `INACTIF` | $N=0$ hors Start $\rightarrow$ inactivité permanente (R-42d) |
| Messages émis par `run-orphan` | `0` | Zéro émission sur sorties |
| Statut d'exécution de `if-orphan` | `IDLE` / `INACTIF` | $N=0$ hors Start $\rightarrow$ inactivité permanente (R-42d) |
| Statut d'exécution de `clear-orphan` | `IDLE` / `INACTIF` | $N=0$ hors Start $\rightarrow$ inactivité permanente (R-42d) |

## Ce que ce cas ne vérifie pas

- L'activation nominale d'un bloc à $N \ge 1$ entrées → `CASE-ENG-02-1` ;
- L'émission du message initial du bloc Start → `CASE-ENG-03-1` ;
- La détection de graphe déconnecté dans l'IHM → `SPEC-UI-02`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_02_3_zero_input_blocks_remain_inactive_except_start`
**Fichier :** `tests/tests-unitaires/eng/case-eng-02-3.test.ts`

## Revue du test automatisé

- [ ] Le test initialise un graphe avec un Start et 3 blocs orphelins (Run, If, ClearContext) à $N=0$.
- [ ] Le test déclenche le moteur et vérifie que seul Start s'active.
- [ ] Le test vérifie qu'aucun appel de processus externe n'a été émis pour les blocs orphelins.
- [ ] Le test vérifie qu'aucun message n'est propagé sur les liaisons descendantes des orphelins.
- [ ] Le test vérifie après flush asynchrone (`flushPromises`, ADR-006) qu'aucun déclenchement résiduel n'intervient sur les blocs orphelins.
- [ ] Le test échoue si un bloc Run à $N=0$ est exécuté au lancement.
- [ ] Le nom du test contient `CASE_ENG_02_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
