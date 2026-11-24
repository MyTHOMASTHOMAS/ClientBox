# CASE-ARCH-05-2 — Volumétrie des corps de fonctions et méthodes (prédicat <= 35 lignes standard, <= 200 lignes TSX, avec @functionExemption au-delà)

**Spécification :** `SPEC-ARCH-05`
**Critère d'acceptation :** `AC-ARCH-05-2`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Pour le code standard sous `src/` (fichiers `.ts`), chaque corps de fonction ou méthode doit être concis (≤ 35 lignes physiques) ; entre 36 et 40 lignes, une balise `@functionExemption <motif>` doit figurer dans le bloc TSDoc immédiatement précédent ; tout corps > 40 lignes est formellement interdit.
Pour les fonctions et composants déclarés dans des fichiers Preact TSX (`*.tsx`), la structure de rendu déclaratif autorise jusqu'à ≤ 200 lignes physiques nominales sans exemption ; au-delà de 200 lignes, une balise `@functionExemption <motif>` doit figurer dans le bloc TSDoc immédiatement précédent.

## Cas

```gherkin
Étant donné l'ensemble des fonctions et méthodes déclarées sous "src/"
Quand on mesure le nombre de lignes physiques de leur corps
Alors les fonctions déclarées dans des fichiers TSX (*.tsx) de taille <= 200 lignes passent sans exemption (ou > 200 avec "@functionExemption")
Et les fonctions standards (.ts) de taille <= 35 lignes passent sans exemption
Et les fonctions standards (.ts) de 36 à 40 lignes portent obligatoirement "@functionExemption" dans le TSDoc précédent
Et aucune fonction standard (.ts) ne dépasse 40 lignes physiques
```

## Données

| Élément | Valeur |
|---|---:|
| Formule corps | BlockStatement (span entre accolades hors `{`/`}`) ou Expression fléchée ; hors TSDoc ; non-TSDoc inclus ; séquences blancs = 0 |
| Seuils fonctions standards (`.ts`) | <= 35 (nominal), 36–40 (avec `@functionExemption`), > 40 (FAIL) |
| Seuils fonctions Preact TSX (`*.tsx`) | <= 200 (nominal), 201–250 (avec `@functionExemption`), > 250 (FAIL) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Fonctions non conformes | `0` | Scan AST de toutes les fonctions de `src/` |

## Ce que ce cas ne vérifie pas

- La taille des fichiers -> `CASE-ARCH-05-1` ;
- La complexité cyclomatique -> `CASE-ARCH-07-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_05_2_function_size_and_function_exemption_compliance`
**Fichier :** `tests/units/arch/case-arch-05-2.test.ts`

## Revue du test automatisé

- [ ] Le test analyse l'AST de toutes les fonctions et méthodes de `src/`.
- [ ] Le test applique les seuils 35 / 40 pour les fonctions standards et 200 pour les composants TSX.
- [ ] Le test valide la balise `@functionExemption` au-delà des seuils nominaux.
- [ ] Le nom du test contient `CASE_ARCH_05_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
