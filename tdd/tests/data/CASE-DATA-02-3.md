# CASE-DATA-02-3 — Interception propre des erreurs de syntaxe et exceptions d'exécution dans un script If sans crash du service

**Spécification :** `SPEC-DATA-02`
**Critère d'acceptation :** `AC-DATA-02-3`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Toute erreur survenant dans un script `if` — qu'elle soit de syntaxe à l'évaluation ou une exception à l'exécution — doit être interceptée sans provoquer le crash du service ClientsBox (`R-25`). Si cette protection disparaît, un script utilisateur défaillant peut planter le serveur et rendre l'ensemble des scénarios inaccessibles.

## Cas

```gherkin
Étant donné un fichier ".agents/data/if/bad-syntax.js" contenant une erreur de syntaxe :
  "module.exports = function(sac) { return sac.input0.value === ; }"
Quand le chargeur dynamique tente d'évaluer ce script
Alors une SyntaxError est interceptée
Et le service ClientsBox reste opérationnel (aucun crash)
Et un message de diagnostic précis est émis indiquant le fichier et la ligne fautive
Et le bloc If associé passe à l'état d'erreur

Étant donné un fichier ".agents/data/if/runtime-error.js" valide syntaxiquement :
  "module.exports = function(sac) { return sac.inexistant.value === 'OK'; }"
Et un sac d'entrées ne contenant pas la clé "inexistant"
Quand le moteur exécute la fonction avec ce sac
Alors une TypeError est interceptée (accès à une propriété d'un objet undefined)
Et le service ClientsBox reste opérationnel (aucun crash)
Et un message de diagnostic précis est émis
Et le bloc If associé passe à l'état d'erreur

Étant donné un fichier ".agents/data/if/throwing.js" :
  "module.exports = function(sac) { throw new Error('condition impossible'); }"
Quand le moteur exécute la fonction
Alors l'exception est interceptée
Et le service ClientsBox reste opérationnel (aucun crash)
Et le scénario est arrêté en erreur conformément à R-25
```

## Données

| Élément | Valeur |
|---|---:|
| Script syntaxe invalide | `"module.exports = function(sac) { return sac.input0.value === ; }"` |
| Script accès clé absente | `"module.exports = function(sac) { return sac.inexistant.value === 'OK'; }"` |
| Script levant exception | `"module.exports = function(sac) { throw new Error('condition impossible'); }"` |
| Sac d'entrées (clé absente) | `{}` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Crash serveur sur SyntaxError | `NON` | Exception interceptée au chargement |
| Diagnostic émis (SyntaxError) | `OUI` | Fichier + ligne indiqués |
| Crash serveur sur TypeError runtime | `NON` | Exception interceptée à l'exécution |
| Diagnostic émis (TypeError) | `OUI` | Nature de l'erreur indiquée |
| Crash serveur sur throw explicite | `NON` | Exception interceptée à l'exécution |
| Scénario arrêté en erreur (R-25) | `OUI` | État d'erreur propagé sur le bloc If |

## Ce que ce cas ne vérifie pas

- La détection et le listage des scripts → `CASE-DATA-02-1` ;
- L'exécution nominale correcte d'un script → `CASE-DATA-02-2` ;
- La propagation de puissance en sortie du bloc If → hors périmètre DATA.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_02_3_if_script_errors_intercepted_no_crash`
**Fichier :** `tests/tests-unitaires/data/case-data-02-3.test.ts`

## Revue du test automatisé

- [ ] Le test tente de charger un script syntaxiquement invalide et vérifie l'absence de crash.
- [ ] Le test vérifie qu'un diagnostic nominatif est émis pour la SyntaxError.
- [ ] Le test exécute un script accédant à une clé absente et vérifie l'absence de crash.
- [ ] Le test vérifie qu'un diagnostic est émis pour la TypeError.
- [ ] Le test exécute un script levant une exception explicite et vérifie l'absence de crash.
- [ ] Le test échoue si les blocs try/catch sont retirés du chargeur et de l'exécuteur.
- [ ] Le nom du test contient `CASE_DATA_02_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
