# CASE-ARCH-09-2 — Synthèse globale, décompte des tests, liste des erreurs bloquantes et avertissements dans le rapport d'audit

**Spécification :** `SPEC-ARCH-09`
**Critère d'acceptation :** `AC-ARCH-09-2`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le rapport d'audit d'architecture doit consigner de manière exhaustive : le statut global (`SUCCÈS`, `AVERTISSEMENTS`, `ÉCHEC`), le nombre de tests exécutés/réussis/échoués, le décompte des avertissements, ainsi que la liste détaillée de toutes les erreurs bloquantes et des composants en transition (`@pendingAudit`, `@deprecated`, `*.added.*`, `*.del.*`).

## Cas

```gherkin
Étant donné des résultats de tests d'architecture comportant des réussites, des avertissements et d'éventuelles erreurs
Quand le rapport d'audit est généré
Alors la synthèse exécutive affiche le statut global exact et les décomptes
Et la liste exhaustive des erreurs bloquantes et des avertissements y est consignée
```

## Données

| Élément | Valeur |
|---|---:|
| Statuts possibles | `SUCCÈS`, `AVERTISSEMENTS`, `ÉCHEC` |
| Métriques | Nombre de tests total, réussis, échoués, warnings, erreurs bloquantes |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Exactitude des compteurs | `100 %` | Comparaison résultats bruts vs rapport |
| Restitution des erreurs | `Exhaustive avec fichier et règle` | Parsing du tableau d'erreurs |

## Ce que ce cas ne vérifie pas

- La génération du fichier -> `CASE-ARCH-09-1` ;
- Le registre des exemptions -> `CASE-ARCH-09-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_09_2_report_executive_summary_and_error_tracking`
**Fichier :** `tests/tests-unitaires/arch/case-arch-09-2.test.ts`

## Revue du test automatisé

- [ ] Le test injecte des résultats d'audit simulés.
- [ ] Le test vérifie que la synthèse et les listes d'erreurs/warnings sont fidèlement restituées.
- [ ] Le test vérifie que le rapport distingue clairement les erreurs bloquantes des avertissements.
- [ ] Le test échoue si le statut global n'est pas CONFORME lorsque le nombre d'erreurs est nul.
- [ ] Le nom du test contient `CASE_ARCH_09_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
