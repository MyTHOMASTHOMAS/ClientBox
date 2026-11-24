# CASE-ARCH-08-2 — Légitimité d'inventaire : échec bloquant sur tout fichier intrus sous src/ non répertorié sans balise @pendingAudit

**Spécification :** `SPEC-ARCH-08`
**Critère d'acceptation :** `AC-ARCH-08-2`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`, `ADR-022`

## Ce que ce cas protège

Aucun fichier non répertorié dans les signatures officielles (197 modules canoniques en `.(ts|tsx)`) ne peut être présent sous `src/` sauf s'il porte explicitement la balise TSDoc d'ajout préliminaire `@pendingAudit` (ou le suffixe de transition de secours `*.added.ts` maintenu pendant la phase de migration). Tout fichier intrus non autorisé provoque l'échec bloquant immédiat des tests d'architecture (`FAIL`). En particulier, un éventuel résidu `src/domain/exit/exit-matcher.evaluator.ts` après abrogation de `DOM-009` (CR-012) doit être traité comme intrus.

## Cas

```gherkin
Étant donné l'arborescence des fichiers physiques sous "src/" (fichiers .ts et .tsx)
Quand on compare chaque fichier aux 197 modules canoniques signés
Alors aucun fichier non répertorié n'est présent
Et tout fichier présent non signé porte obligatoirement la balise "@pendingAudit" sous peine d'échec bloquant
```

## Données

| Élément | Valeur |
|---|---:|
| Règle | Tout fichier sous `src/` doit figurer dans les 197 signatures canoniques OU porter `@pendingAudit` (ou `*.added.ts` de secours) OU être un artefact `*.generated.ts` |
| Extensions analysées | `.(ts|tsx)` (hors `*.generated.ts`) |
| Sanction | Échec bloquant (`FAIL`) en cas de fichier non autorisé |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fichiers intrus non autorisés | `0` | Détection de fichiers sous `src/` hors catalogue SoT (197 modules) et sans `@pendingAudit` |

## Ce que ce cas ne vérifie pas

- La complétude des signatures -> `CASE-ARCH-08-1` ;
- Le traitement des warnings -> `CASE-ARCH-08-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_08_2_unauthorized_files_rejection`
**Fichier :** `tests/units/arch/case-arch-08-2.test.ts`

## Revue du test automatisé

- [ ] Le test scanne tous les fichiers physiques `.(ts|tsx)` sous `src/` (hors `*.generated.ts`).
- [ ] Le test vérifie que chaque fichier est soit dans les 197 signatures canoniques, soit porteur de `@pendingAudit` (ou `*.added.ts`).
- [ ] Le test compare la liste des fichiers du disque à la liste officielle des signatures.
- [ ] Le test échoue si un fichier non répertorié et sans balise `@pendingAudit` est présent sous `src/`.
- [ ] Le nom du test contient `CASE_ARCH_08_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — catalogue SoT à 197 modules.
