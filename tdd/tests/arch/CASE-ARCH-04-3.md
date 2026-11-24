# CASE-ARCH-04-3 — Conformité linguistique intégrale en français de l'ensemble des messages d'erreur exposés (HTTP JSON, exceptions services, erreurs console ROOT-001)

**Spécification :** `SPEC-ARCH-04`
**Critère d'acceptation :** `AC-ARCH-04-3`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Conformément à `REQ-007` et `C-06`, tous les messages d'erreur exposés à l'utilisateur (réponses HTTP JSON `{ message }` émises par les contrôleurs et le routeur `LIB-007`/MiniRouter y compris 404/500, exceptions des services et messages opérateur console de `ROOT-001`) doivent être rédigés en français.

## Cas

```gherkin
Étant donné une erreur déclenchée lors d'une requête HTTP ou d'une opération système
Quand l'API retourne un payload d'erreur ou que la console émet un diagnostic opérateur
Alors le message retourné est intégralement formulé en langue française
Et aucun message technique brut non traduit n'est exposé à l'utilisateur
```

## Données

| Élément | Valeur |
|---|---:|
| Portée | Réponses HTTP JSON (`controllers/`, `LIB-007`), exceptions (`services/`), stdout/stderr (`ROOT-001`) |
| Exigences liées | `REQ-007`, `C-06` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Langue des erreurs exposées | `100 % Français` | Assertions sur les messages de rejet |
| Format payload HTTP | `{ message: string }` | Schéma standard JSON |

## Ce que ce cas ne vérifie pas

- L'interface graphique en français -> `CASE-UI-01-1` ;
- Les erreurs de parsing CLI -> `CASE-SRV-01-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_04_3_french_language_error_messages_compliance`
**Fichier :** `tests/tests-unitaires/arch/case-arch-04-3.test.ts`

## Revue du test automatisé

- [ ] Le test déclenche des scénarios d'erreur (400, 404, 409, 500).
- [ ] Le test vérifie que chaque message d'erreur est rédigé en français.
- [ ] Le test vérifie la conformité linguistique sur les messages d'erreur et codes statut.
- [ ] Le test échoue si un message d'erreur destiné à l'utilisateur ou à la console est rédigé en anglais.
- [ ] Le nom du test contient `CASE_ARCH_04_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
