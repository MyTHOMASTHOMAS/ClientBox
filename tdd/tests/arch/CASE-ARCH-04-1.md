# CASE-ARCH-04-1 — Enregistrement des routes de contrôleurs (CTL-001..007) exclusivement contre l'interface pure HttpRouter (TYPES-011)

**Spécification :** `SPEC-ARCH-04`
**Critère d'acceptation :** `AC-ARCH-04-1`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Les contrôleurs (`CTL-001..007`) doivent déclarer et enregistrer leurs routes HTTP en dépendant uniquement de l'interface abstraite `HttpRouter` (`TYPES-011`) et ne doivent jamais instancier ni référencer la classe concrète `MiniRouter` (`LIB-007`).

## Cas

```gherkin
Étant donné les modules situés sous "src/controllers/"
Quand on analyse leurs signatures de fonctions et leurs types d'entrée
Alors chaque contrôleur reçoit une instance satisfaisant l'interface "HttpRouter"
Et aucune référence directe à la classe concrète "MiniRouter" n'est présente dans les contrôleurs
```

## Données

| Élément | Valeur |
|---|---:|
| Contrôleurs analysés | `agent.controller.ts` (`CTL-001`), `scenario.controller.ts` (`CTL-002`), `resource.controller.ts` (`CTL-003`) |
| Interface cible | `HttpRouter` (`TYPES-011`) |
| Classe d'infrastructure | `MiniRouter` (`LIB-007`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Références directes à `MiniRouter` | `0` | Scan AST des imports et types des contrôleurs |
| Typage des paramètres de route | `HttpRouter` | Analyse statique TypeScript |

## Ce que ce cas ne vérifie pas

- L'isolation générale des contrôleurs -> `CASE-ARCH-01-3` ;
- La Composition Root -> `CASE-ARCH-04-2`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_04_1_controllers_http_router_interface_decoupling`
**Fichier :** `tests/tests-unitaires/arch/case-arch-04-1.test.ts`

## Revue du test automatisé

- [ ] Le test inspecte les imports et types des contrôleurs sous `src/controllers/`.
- [ ] Le test valide que l'interface `HttpRouter` est l'unique abstraction manipulée.
- [ ] Le test vérifie qu'aucun contrôleur n'importe directement de serveur HTTP concret.
- [ ] Le test échoue si une dépendance directe vers http ou un framework concret est présente dans controllers/.
- [ ] Le nom du test contient `CASE_ARCH_04_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
