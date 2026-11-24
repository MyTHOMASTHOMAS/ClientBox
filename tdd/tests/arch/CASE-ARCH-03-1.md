# CASE-ARCH-03-1 — Monopole absolu des imports de modules système I/O Node.js dans src/lib/ (aucun import I/O hors lib/)

**Spécification :** `SPEC-ARCH-03`
**Critère d'acceptation :** `AC-ARCH-03-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Tous les modules système Node.js d'I/O (`node:fs`|`fs`, `node:child_process`|`child_process`, `node:os`|`os`, `node:path`|`path`, `node:net`|`net`, `node:http`|`http`, `node:url`|`url`, `node:vm`|`vm`, `node:module`|`module`, `node:process`|`process`) doivent être cantonnés exclusivement à `src/lib/`. Le bootstrap `src/index.ts` n'importe pas ces modules et gère les signaux OS via `process.on`.

## Cas

```gherkin
Étant donné l'ensemble des fichiers sous "src/" hors "src/lib/"
Quand on recherche les imports de modules I/O Node.js (avec ou sans préfixe "node:")
Alors aucune occurrence n'est trouvée dans "types/", "utils/", "domain/", "services/", "controllers/" ou "ui/"
Et `src/index.ts` n'importe aucun de ces modules I/O
```

## Données

| Élément | Valeur |
|---|---:|
| Modules I/O surveillés | `fs`, `child_process`, `os`, `path`, `net`, `http`, `url`, `vm`, `module`, `process` (avec ou sans `node:`) |
| Couches interdites | `src/types/`, `src/utils/`, `src/domain/`, `src/services/`, `src/controllers/`, `src/ui/`, `src/index.ts` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Imports I/O hors `lib/` | `0` | Scan AST des déclarations d'import |

## Ce que ce cas ne vérifie pas

- La cécité métier de lib/ -> `CASE-ARCH-03-2` ;
- Le monopole de process.env -> `CASE-ARCH-03-5`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_03_1_lib_layer_io_monopoly`
**Fichier :** `tests/tests-unitaires/arch/case-arch-03-1.test.ts`

## Revue du test automatisé

- [ ] Le test recherche tous les imports de modules d'I/O système dans `src/`.
- [ ] Le test valide qu'aucun fichier hors `src/lib/` n'importe ces modules.
- [ ] Le test vérifie que les modules hors lib/ passent exclusivement par lib/ pour les accès I/O.
- [ ] Le test échoue si un appel I/O natif direct est présent en dehors de lib/ ou src/index.ts.
- [ ] Le nom du test contient `CASE_ARCH_03_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
