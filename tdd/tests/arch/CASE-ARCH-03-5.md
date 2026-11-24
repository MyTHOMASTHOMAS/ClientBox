# CASE-ARCH-03-5 — Monopole absolu des accès à process.env et process.cwd() dans le moteur d'environnement (src/lib/process/env/)

**Spécification :** `SPEC-ARCH-03`
**Critère d'acceptation :** `AC-ARCH-03-5`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-022`

## Ce que ce cas protège

Les lectures et écritures de l'environnement (`process.env`) et du répertoire courant (`process.cwd()`) doivent être strictement confinées au sous-système `src/lib/process/env/` (`env.engine.ts` et `env.layout.ts`, `LIB-025` / `LIB-005`). Aucun autre fichier sous `src/` ne doit y accéder directement.

## Cas

```gherkin
Étant donné l'ensemble des fichiers TypeScript sous "src/"
Quand on recherche les occurrences de "process.env" et "process.cwd()"
Alors ces accès n'apparaissent que dans "src/lib/process/env/env.engine.ts" et "src/lib/process/env/env.layout.ts"
Et `src/index.ts` reçoit ces valeurs par injection de dépendance (via ConfigService) sans accès direct
```

## Données

| Élément | Valeur |
|---|---:|
| Modules autorisés | `src/lib/process/env/env.engine.ts` (`LIB-025`), `src/lib/process/env/env.layout.ts` (`LIB-005`) |
| Modules interdits | Tous les autres modules sous `src/` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Accès `process.env` hors `lib/process/env/` | `0` | Scan AST des MemberExpression |
| Accès `process.cwd()` hors `lib/process/env/` | `0` | Scan AST des CallExpression |

## Ce que ce cas ne vérifie pas

- La résolution nominale du workspace -> `CASE-SRV-01-4` ;
- La résolution de CURSOR_CLI_BIN -> `CASE-ADPT-02-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_03_5_env_resolver_process_monopoly`
**Fichier :** `tests/units/arch/case-arch-03-5.test.ts`

## Revue du test automatisé

- [ ] Le test analyse l'AST de l'ensemble des fichiers sous `src/`.
- [ ] Le test vérifie que `process.env` et `process.cwd()` ne sont utilisés que dans `src/lib/process/env/` (`env.engine.ts`, `env.layout.ts`).
- [ ] Le test vérifie que `lib/process/env/` encapsule l'accès aux variables d'environnement.
- [ ] Le test échoue si un accès direct à process.env ou process.cwd est trouvé hors de ces modules autorisés.
- [ ] Le nom du test contient `CASE_ARCH_03_5`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
