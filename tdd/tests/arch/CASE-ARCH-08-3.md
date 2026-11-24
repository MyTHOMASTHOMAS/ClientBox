# CASE-ARCH-08-3 — Tolérance encadrée des composants en transition (@pendingAudit, @deprecated) avec émission obligatoire d'avertissements (WARNING)

**Spécification :** `SPEC-ARCH-08`
**Critère d'acceptation :** `AC-ARCH-08-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Les composants en transition portant les balises `@pendingAudit` (ajouts préliminaires ou composants en incubation) ou `@deprecated` (dette technique résiduelle à purger) — ainsi que les drapeaux temporaires de secours `*.added.ts` / `*.del.ts` — doivent être acceptés sans faire échouer les tests (`PASS`), tout en générant obligatoirement un avertissement formel (`WARNING`) consigné dans le rapport d'architecture.

## Cas

```gherkin
Étant donné la présence de composants sous "@pendingAudit" ou "@deprecated" sous "src/"
Quand le contrôle de conformité d'inventaire est exécuté
Alors le test n'échoue pas (statut validé)
Et un avertissement formel (WARNING) est émis avec la liste détaillée des composants en transition
```

## Données

| Élément | Valeur |
|---|---:|
| Motifs reconnus | Balises TSDoc `@pendingAudit`, `@deprecated` (et motifs de secours `*.added.ts`, `*.del.ts`) |
| Statut du test | `PASS avec WARNINGS` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Échec bloquant sur transitions | `NON (Toléré)` | Gestion non-bloquante des transitions |
| Émission d'avertissement | `OUI (Obligatoire)` | Restitution dans le reporting |

## Ce que ce cas ne vérifie pas

- Le rapport Markdown d'audit -> `CASE-ARCH-09-1` ;
- Le rapport JSON -> `CASE-ARCH-09-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_08_3_transition_flags_warning_tolerance`
**Fichier :** `tests/tests-unitaires/arch/case-arch-08-3.test.ts`

## Revue du test automatisé

- [ ] Le test valide le comportement en présence de composants sous `@pendingAudit` et `@deprecated` (ainsi que les motifs de secours `*.added.ts` et `*.del.ts`).
- [ ] Le test vérifie l'émission formelle d'avertissements sans rupture du pipeline.
- [ ] Le test vérifie l'émission d'un WARNING documenté lors de la détection de composants de transition.
- [ ] Le test échoue si un composant de transition bloque la validation au lieu d'émettre un WARNING.
- [ ] Le nom du test contient `CASE_ARCH_08_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
