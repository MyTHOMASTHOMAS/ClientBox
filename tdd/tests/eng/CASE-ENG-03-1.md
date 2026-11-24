# CASE-ENG-03-1 — Comportement et émission synchrone initiale du bloc Start

**Spécification :** `SPEC-ENG-03`
**Critère d'acceptation :** `AC-ENG-03-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le bloc Start constitue le point d'entrée unique de tout scénario (`REQ-015`). Il ne possède aucune entrée ni paramètre de configuration et émet, dès le démarrage du scénario, un message `{ blockType: 'start', value: null, power: 1 }` sur toutes ses connexions de sortie (`R-19`, `R-20`). Si le bloc Start émettait avec une énergie nulle ou échouait à propager le signal, l'ensemble du graphe resterait bloqué.

## Cas

```gherkin
Étant donné un bloc Start "start-main" ayant deux sorties connectées respectivement vers "run-A" et "run-B"
Quand l'exécution du scénario est lancée
Alors le bloc "start-main" est exécuté en premier
Et il émet simultanément sur ses deux sorties le message :
  | champ     | valeur  |
  | blockType | "start" |
  | value     | null    |
  | power     | 1       |
Et les blocs "run-A" et "run-B" reçoivent chacun ce message à power 1

Étant donné un bloc Start "start-isolated" sans aucune sortie connectée (0 sortie)
Quand le scénario est lancé
Alors le bloc s'exécute sans erreur et le scénario se termine normalement
```

## Données

| Élément | Valeur |
|---|---:|
| Bloc Start multi-sorties | `id: "start-main"`, sorties: 2 |
| Bloc Start sans sortie | `id: "start-isolated"`, sorties: 0 |
| Cibles aval | `"run-A"` (port 0), `"run-B"` (port 0) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Ordre d'exécution | 1er bloc activé | Bloc racine du graphe (R-19) |
| Format du message émis | `{ blockType: "start", value: null, power: 1 }` | Schéma Start conforme R-20 / REQ-015 |
| Puissance reçue par `run-A` | `1` | Propagation intégrale de la puissance |
| Puissance reçue par `run-B` | `1` | Propagation simultanée multi-sorties |
| Exécution Start 0 sortie | `PASS` sans erreur | Terminaison nominale |

## Ce que ce cas ne vérifie pas

- L'exécution du bloc Run en aval → `CASE-ENG-03-2` ;
- Le traitement du sac d'entrées d'un bloc récepteur → `CASE-ENG-01-2` ;
- L'assemblage du prompt système → `CASE-ENG-04-1` ;
- Le fan-out multi-sorties **dans** `ScenarioRunnerService` (deux Runs spawnés) → `CASE-ENG-04-8`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ENG_03_1_start_block_initial_emission`
**Fichier :** `tests/tests-unitaires/eng/case-eng-03-1.test.ts`

## Revue du test automatisé

- [ ] Le test lance un scénario et intercepte l'événement d'activation de Start.
- [ ] Le test flushe explicitement les promesses (`flushPromises`, ADR-006) avant de vérifier que le payload émis a `blockType === "start"`, `value === null` et `power === 1`.
- [ ] Le test vérifie que toutes les sorties reçoivent le message.
- [ ] Le test vérifie le comportement sans crash avec 0 sortie connectée.
- [ ] Le test échoue si la puissance émise par Start est différente de 1.
- [ ] Le nom du test contient `CASE_ENG_03_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
