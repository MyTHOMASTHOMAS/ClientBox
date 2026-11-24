# CASE-ARCH-08-1 — Complétude d'inventaire : réconciliation Lcode ↔ Ldoc et extraction machine-lisible des 197 modules canoniques signés

**Spécification :** `SPEC-ARCH-08`
**Critère d'acceptation :** `AC-ARCH-08-1`
**Type :** acceptation
**Niveau de risque :** critique
**ADR liés :** `ADR-001`, `ADR-013`, `ADR-015`, `ADR-022`

## Ce que ce cas protège

L'inventaire des 197 modules canoniques déclarés dans les signatures officielles (`tdd/docs/signature/*.md`) délimité par `<!-- SIGNATURE-INVENTORY-START -->` et `<!-- SIGNATURE-INVENTORY-END -->` constitue la source de vérité absolue. Tout module signé doit exister physiquement dans `src/` sous son nom canonique (ou sous statut de transition toléré). Le module `DOM-009` (`domain/exit/exit-matcher.evaluator.ts`) est abrogé (CR-012) et ne figure plus dans le SoT.

## Cas

```gherkin
Étant donné la liste des 197 modules canoniques déclarés dans les tables d'inventaire délimitées des signatures (capturant indifféremment les extensions .ts et .tsx)
Quand on vérifie leur présence sur le disque sous "src/"
Alors chaque module existe sous son chemin relatif canonique (ou sous le statut de transition toléré)
Et aucun module officiel n'est manquant
Et "domain/exit/exit-matcher.evaluator.ts" n'apparaît plus dans l'inventaire signé
```

## Données

| Élément | Valeur |
|---|---:|
| Source de vérité | 197 modules déclarés dans `tdd/docs/signature/signature-*.md` entre balises machine-lisibles |
| Extensions autorisées | `.(ts|tsx)` (`.ts` pour backend/logique, `.tsx` pour composants Preact `UI-001`, `UI-012..031`) |
| Chemins tolérés | Nom canonique (ex: `src/domain/join/join-barrier.evaluator.ts`, `src/ui/app.tsx`) ou statut de transition toléré |
| Module abrogé | `DOM-009` — `domain/exit/exit-matcher.evaluator.ts` (CR-012) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Modules officiels manquants | `0` | Confrontation signatures SoT (197 modules) vs disque `src/` |
| Cardinal SoT | `197` | Ancien 198 − `DOM-009` |

## Ce que ce cas ne vérifie pas

- Les fichiers intrus -> `CASE-ARCH-08-2` ;
- Les avertissements de transition -> `CASE-ARCH-08-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_08_1_signed_modules_inventory_completeness`
**Fichier :** `tests/units/arch/case-arch-08-1.test.ts`

## Revue du test automatisé

- [ ] Le test extrait la liste des 197 modules canoniques des signatures officielles via les balises délimitées `<!-- SIGNATURE-INVENTORY-START/END -->` en capturant les extensions `.ts` et `.tsx`.
- [ ] `EXPECTED_SIGNED_MODULE_COUNT` vaut `197`.
- [ ] Le test vérifie l'existence physique de chaque fichier sous `src/`.
- [ ] Le test échoue si un fichier figurant dans les signatures est manquant dans `src/`.
- [ ] Le nom du test contient `CASE_ARCH_08_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** CR-012 — 198 → 197 modules signés (retrait légitime de `DOM-009`).
