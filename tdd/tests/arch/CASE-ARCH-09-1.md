# CASE-ARCH-09-1 — Génération automatique du fichier de rapport d'audit Markdown out/arch/rapport-arch.md à l'issue de l'exécution des tests d'architecture

**Spécification :** `SPEC-ARCH-09`
**Critère d'acceptation :** `AC-ARCH-09-1`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

À l'issue de l'exécution de la suite de tests d'architecture, un rapport d'audit complet formaté en Markdown doit être automatiquement créé ou mis à jour dans `out/arch/rapport-arch.md` à la racine du projet (le répertoire `out/` étant créé automatiquement si absent).

## Cas

```gherkin
Étant donné l'exécution complète des tests d'architecture
Quand la suite de tests se termine
Alors le dossier "out/" est créé à la racine du projet s'il n'existait pas
Et le fichier "out/arch/rapport-arch.md" est généré avec l'horodatage et la synthèse complète des contrôles
```

## Données

| Élément | Valeur |
|---|---:|
| Fichier de sortie | `out/arch/rapport-arch.md` |
| Format | GitHub Flavored Markdown |
| Déclencheur | Fin d'exécution des tests d'architecture |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Existence de `out/arch/rapport-arch.md` | `OUI` | Vérification de la création sur disque |
| Horodatage et sections | `Présents et formatés` | Parsing du document généré |

## Ce que ce cas ne vérifie pas

- La synthèse et les décomptes -> `CASE-ARCH-09-2` ;
- Le registre des exemptions -> `CASE-ARCH-09-3` ;
- Le fichier JSON -> `CASE-ARCH-09-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_09_1_markdown_audit_report_generation`
**Fichier :** `tests/tests-unitaires/arch/case-arch-09-1.test.ts`

## Revue du test automatisé

- [ ] Le test exécute le reporter d'architecture.
- [ ] Le test vérifie la création effective de `out/arch/rapport-arch.md`.
- [ ] Le test vérifie que out/arch/rapport-arch.md contient la structure de synthèse obligatoire.
- [ ] Le test échoue si le fichier out/arch/rapport-arch.md n'est pas généré ou est vide après exécution.
- [ ] Le nom du test contient `CASE_ARCH_09_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
