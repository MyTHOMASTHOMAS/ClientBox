# CASE-ARCH-08-4 — Gouvernance des assets statiques et catalogues hors décompte machine-lisible

**Spécification :** `SPEC-ARCH-08`, `SPEC-ARCH-05`  
**Critère d'acceptation :** `AC-ARCH-08-1`, `AC-ARCH-08-2`  
**Type :** acceptation / architecture  
**Niveau de risque :** modéré  
**ADR liés :** `ADR-012`, `ADR-013`, `ADR-015`  

---

## Ce que ce cas protège

Le décompte des 163 modules exécutables de ClientsBox est établi sur la base des fichiers TypeScript et TSX sources déclarés entre balises `<!-- SIGNATURE-INVENTORY-START -->` et `<!-- SIGNATURE-INVENTORY-END -->`. Certains fichiers d'infrastructure statique ou artefacts générés sont présents dans l'arborescence sans être des modules sources audités manuellement : la feuille de style CSS statique du design system (`src/ui/styles/app.css` ou fichiers CSS Tailwind v4) et l'artefact de compilation in-memory (`src/lib/http/embedded-assets.generated.ts` per ADR-012). Le dictionnaire de langue `src/ui/i18n/fr.i18n.ts` est quant à lui un module TypeScript officiel signé sous l'identifiant `UI-004`. Ce cas garantit que les artefacts générés et assets CSS sont documentés, reconnus comme exclus du décompte officiel des 163 modules, et ne déclenchent pas d'alerte de fichier intrus injustifiée (`CASE-ARCH-08-2`).

---

## Cas

```gherkin
Étant donné les fichiers statiques CSS et les artefacts générés per ADR-012 ("src/lib/http/embedded-assets.generated.ts")
Quand l'analyseur d'inventaire parcourt l'arborescence "src/"
Alors ces fichiers sont identifiés dans la liste d'exclusion formelle documentée
Et ils ne sont pas comptabilisés comme des modules TypeScript applicatifs officiels
Et ils ne sont pas signalés comme des fichiers intrus non répertoriés
Et le décompte canonique des modules applicatifs exécutables demeure strictement égal à 163
```

---

## Données

| Fichier | Nature | Statut d'inventaire |
|:---|:---|:---|
| `src/ui/styles/app.css` | Feuille de style CSS statique | Exclu documenté (`signature-ui.md` §3) |
| `src/lib/http/embedded-assets.generated.ts` | Fichier bundle généré à la compilation | Artefact généré (`ADR-012`) |
| `src/ui/i18n/fr.i18n.ts` | Référentiel linguistique TypeScript | Module officiel signé (`UI-004`) |
| Décompte officiel attendu | 163 modules TS/TSX exécutables | SoT `signature.md` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Modules TypeScript applicatifs officiels | `163` | Décompte exact des 163 modules balisés |
| Faux positifs sur assets exclus | `0` | Exclusion documentée prise en compte |

---

## Ce que ce cas ne vérifie pas

- L'exhaustivité des 163 modules officiels → `CASE-ARCH-08-1` ;
- La détection de réels fichiers intrus non exemptés → `CASE-ARCH-08-2`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ARCH_08_4_static_assets_governance_and_inventory_exclusion`  
**Fichier :** `tests/units/arch/case-arch-08-4.test.ts`  

## Revue du test automatisé

- [ ] Le test vérifie la présence et la non-comptabilisation d'app.css dans les 163 modules.
- [ ] Le test vérifie que embedded-assets.generated.ts est exclu du décompte officiel sans être rejeté comme intrus.
- [ ] Le test vérifie qu'aucune alerte de fichier intrus n'est levée pour ces fichiers exclus.
- [ ] Le nom du test contient `CASE_ARCH_08_4`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
  
