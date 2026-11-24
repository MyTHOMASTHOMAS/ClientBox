# CASE-ARCH-02-1 — Absence totale d'I/O et de modules système dans src/domain/ (zéro import Node.js, zéro process.env/cwd, zéro fetch/WebSocket)

**Spécification :** `SPEC-ARCH-02`
**Critère d'acceptation :** `AC-ARCH-02-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Les modules de `src/domain/` (`DOM-001..009`) forment le cœur logique métier pur. Ils ne doivent contenir aucun import de modules système Node.js effectuant des I/O ou dépendants de l'OS, ni aucun accès à `process.env` / `process.cwd()`, ni aucun appel à `fetch` / `WebSocket`.

## Cas

```gherkin
Étant donné l'ensemble des fichiers situés sous "src/domain/"
Quand on inspecte leur code source et leurs dépendances
Alors aucun module système ("node:fs", "node:child_process", "node:net", "node:http", "node:os", "node:path", "node:url", "node:vm") n'est importé
Et aucun accès direct à "process.env", "process.cwd()", "fetch" ou "WebSocket" n'est présent
```

## Données

| Élément | Valeur |
|---|---:|
| Couche cible | `src/domain/` (9 modules `DOM-001..009`) |
| Symboles/Modules bannis | `fs`, `child_process`, `net`, `http`, `os`, `path`, `url`, `vm`, `process.env`, `process.cwd()`, `fetch`, `WebSocket` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Imports système dans `domain/` | `0` | Analyse statique AST |
| Accès process/I/O réseau | `0` | Analyse statique AST |

## Ce que ce cas ne vérifie pas

- Le déterminisme des fonctions de calcul -> `CASE-ARCH-02-2` ;
- L'isomorphisme dans le navigateur -> `CASE-ARCH-02-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_02_1_domain_zero_io_and_system_modules`
**Fichier :** `tests/tests-unitaires/arch/case-arch-02-1.test.ts`

## Revue du test automatisé

- [ ] Le test scanne tous les modules sous `src/domain/`.
- [ ] Le test valide l'absence absolue de dépendances I/O et de modules système Node.js.
- [ ] Le test valide l'absence d'accès à `process.env`, `process.cwd()`, `fetch` et `WebSocket`.
- [ ] Le test échoue si un module de domain/ importe fs, child_process ou net.
- [ ] Le nom du test contient `CASE_ARCH_02_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
