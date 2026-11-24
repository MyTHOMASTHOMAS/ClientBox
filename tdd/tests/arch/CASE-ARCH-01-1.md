# CASE-ARCH-01-1 — Validation de l'acyclicité stricte du graphe de dépendances statique (DAG) de l'ensemble de src/

**Spécification :** `SPEC-ARCH-01`
**Critère d'acceptation :** `AC-ARCH-01-1`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`

## Ce que ce cas protège

L'organisation modulaire sous `src/` doit former un Graphe Acyclique Direct (DAG) strict. Aucune dépendance cyclique directe (A -> B -> A) ou indirecte (A -> B -> C -> A) n'est tolérée afin de garantir la compilabilité, la maintenabilité et l'absence d'effets de bord d'initialisation circulaire.

## Cas

```gherkin
Étant donné l'ensemble des fichiers sources TypeScript et TSX situés sous "src/" (163 modules canoniques)
Quand on analyse la totalité des déclarations d'importation statiques inter-fichiers
Alors le graphe de dépendances complet est strictement acyclique (DAG à 8 niveaux)
Et aucun cycle de dépendance direct ou transitif n'est détecté
```

## Données

| Élément | Valeur |
|---|---:|
| Fichiers analysés | Totalité des fichiers `src/**/*.{ts,tsx}` (163 modules canoniques) |
| Type d'analyse | Analyse statique de l'arbre d'imports |
| Structure attendue | Graphe Acyclique Direct (DAG) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Nombre de cycles | `0` | Détection de cycles sur le graphe de dépendances |
| Statut DAG | `CONFORME (Acyclique)` | Algorithme de tri topologique ou détection de cycles DFS |

## Ce que ce cas ne vérifie pas

- La pureté déclarative de la couche types/ -> `CASE-ARCH-01-2` ;
- L'étanchéité des contrôleurs -> `CASE-ARCH-01-3` ;
- L'isolation de la couche UI -> `CASE-ARCH-01-4` ;
- La conformité à la matrice d'imports autorisés -> `CASE-ARCH-01-5` ;
- La conformité des micro-DAGs intra-couches -> `CASE-ARCH-01-6`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_01_1_dag_acyclic_dependency_graph`
**Fichier :** `tests/units/arch/case-arch-01-1.test.ts`

## Revue du test automatisé

- [ ] Le test parse l'ensemble des fichiers TypeScript et TSX sous `src/`.
- [ ] Le test construit le graphe complet des dépendances statiques.
- [ ] Le test vérifie l'absence absolue de dépendances circulaires directes et indirectes.
- [ ] Le test échoue si un cycle de dépendance artificiel (A -> B -> A) est introduit dans le graphe.
- [ ] Le nom du test contient `CASE_ARCH_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

