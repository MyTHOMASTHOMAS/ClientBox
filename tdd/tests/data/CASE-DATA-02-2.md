# CASE-DATA-02-2 — Exécution dynamique de la fonction `if(sac)` recevant le sac d'entrées et retournant un booléen

**Spécification :** `SPEC-DATA-02`
**Critère d'acceptation :** `AC-DATA-02-2`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

La fonction conditionnelle exportée par un script `if` doit recevoir le sac d'entrées complet (`sac: Record<string, BlockMessage>`) et retourner un booléen strict (`R-14`, `REQ-012`, `C-09`). Si ce contrat d'interface disparaît, les blocs If ne peuvent pas évaluer correctement leur condition et aiguillent les flux de manière erronée.

## Cas

```gherkin
Étant donné un fichier ".agents/data/if/check-status.js" exportant la fonction :
  "module.exports = function(sac) { return sac.input0.value === 'SUCCESS'; }"
Et un sac d'entrées :
  { "input0": { "blockType": "run", "value": "SUCCESS", "power": 1 } }
Quand le moteur charge et exécute la fonction avec ce sac
Alors la fonction retourne la valeur booléenne true

Étant donné le même script "check-status.js"
Et un sac d'entrées :
  { "input0": { "blockType": "run", "value": "FAILURE", "power": 1 } }
Quand le moteur charge et exécute la fonction avec ce sac
Alors la fonction retourne la valeur booléenne false

Étant donné un script If retournant une valeur non-booléenne (ex. null, undefined, 0, "false", {})
Quand le moteur évalue le retour de la fonction
Alors la valeur est systématiquement convertie via Boolean(res) sans lever d'exception :
  | retour brut  | résultat booléen évalué |
  | null         | false                   |
  | undefined    | false                   |
  | 0            | false                   |
  | "false"      | true                    |
  | {}           | true                    |

Étant donné un script If utilisant la syntaxe ESM :
  "export default function(sac) { return sac.input0.value === 'OK'; }"
Quand le chargeur dynamique importe ce module
Alors la fonction est correctement instanciée et retourne le résultat attendu
```

## Données

| Élément | Valeur |
|---|---:|
| Script | `check-status.js` |
| Sac (cas true) | `{ "input0": { "blockType": "run", "value": "SUCCESS", "power": 1 } }` |
| Sac (cas false) | `{ "input0": { "blockType": "run", "value": "FAILURE", "power": 1 } }` |
| Retours non-booléens testés | `null`, `undefined`, `0`, `"false"`, `{}` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Résultat avec sac `value: "SUCCESS"` | `true` | `"SUCCESS" === "SUCCESS"` → `true` |
| Résultat avec sac `value: "FAILURE"` | `false` | `"FAILURE" === "SUCCESS"` → `false` |
| Coercition `Boolean(null)`, `Boolean(undefined)`, `Boolean(0)` | `false` | Falsy values standard JavaScript (SPEC-DATA-02) |
| Coercition `Boolean("false")`, `Boolean({})` | `true` | Truthy values standard JavaScript |
| Import ESM | Fonction instanciée | Chargeur supporte `export default` |

## Ce que ce cas ne vérifie pas

- La détection et le listage des scripts → `CASE-DATA-02-1` ;
- La gestion des erreurs de syntaxe ou exceptions runtime → `CASE-DATA-02-3` ;
- La propagation de puissance en sortie du bloc If → hors périmètre DATA.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_02_2_if_function_execution_returns_boolean`
**Fichier :** `tests/tests-unitaires/data/case-data-02-2.test.ts`

## Revue du test automatisé

- [ ] Le test charge un script CJS et exécute la fonction avec un sac produisant `true`.
- [ ] Le test exécute la même fonction avec un sac produisant `false`.
- [ ] Le test vérifie la conversion systématique `Boolean(res)` sans exception pour les retours `null`, `undefined`, `0` (false) et `"false"`, `{}` (true).
- [ ] Le test vérifie le support ESM (`export default`).
- [ ] Le test échoue si le passage du sac complet comme argument est supprimé.
- [ ] Le nom du test contient `CASE_DATA_02_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
