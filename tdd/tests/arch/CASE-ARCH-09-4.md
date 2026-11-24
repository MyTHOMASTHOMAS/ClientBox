# CASE-ARCH-09-4 — Génération concomitante du fichier structuré JSON out/arch/arch-report.json incluant la matrice d'étanchéité des 8 couches

**Spécification :** `SPEC-ARCH-09`
**Critère d'acceptation :** `AC-ARCH-09-4`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

En parallèle du rapport Markdown, un fichier JSON structuré `out/arch/arch-report.json` doit être généré, exposant pour exploitation en CI : l'horodatage, le statut global, les décomptes, les avertissements de transition (`@pendingAudit`, `@deprecated`, `*.added`/`*.del`), le registre des exemptions et la matrice d'étanchéité des 8 couches.

## Cas

```gherkin
Étant donné la fin de l'exécution de la suite d'architecture
Quand les reporters terminent leur exécution
Alors le fichier "out/arch/arch-report.json" est créé et valide au format JSON
Et il contient les champs "status", "metrics", "warnings", "exemptions" et "layerMatrix" 
```

## Données

| Élément | Valeur |
|---|---:|
| Fichier JSON | `out/arch/arch-report.json` |
| Structure JSON | `{ timestamp, status, metrics: { total, passed, failed, warnings }, warnings: [], exemptions: [], layerMatrix: {} }` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Validité JSON | `100 % (Parse sans erreur)` | `JSON.parse(fs.readFileSync(...))` |
| Présence matrice 8 couches | `OUI` | Vérification de la propriété `layerMatrix` |

## Ce que ce cas ne vérifie pas

- Le rapport Markdown -> `CASE-ARCH-09-1` ;
- La matrice dans le Markdown -> `CASE-ARCH-09-5`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_09_4_json_structured_architecture_report_generation`
**Fichier :** `tests/tests-unitaires/arch/case-arch-09-4.test.ts`

## Revue du test automatisé

- [ ] Le test valide la génération et la structure du fichier `out/arch/arch-report.json`.
- [ ] Le test vérifie la présence de tous les champs structurés requis pour la CI.
- [ ] Le test valide le format JSON de out/arch/arch-report.json et sa conformité au schéma attendu.
- [ ] Le test échoue si le fichier out/arch/arch-report.json contient un JSON invalide ou omet les métriques clés.
- [ ] Le nom du test contient `CASE_ARCH_09_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
