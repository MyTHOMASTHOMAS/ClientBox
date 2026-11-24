# CASE-ADPT-01-4 — Registre dynamique des adapters CLI et énumération opérationnelle

**Spécification :** `SPEC-ADPT-01`, `SPEC-ADPT-02`  
**Critère d'acceptation :** `AC-ADPT-01-1`, `AC-ADPT-02-1`  
**Type :** acceptation  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-002`, `ADR-003`  

---

## Ce que ce cas protège

Le service de registre des adapters (`SVC-003 adapter-registry.service.ts`) centralise la liste des adapters CLI reconnus par ClientsBox. Ce cas garantit :
1. L'enregistrement des instances implémentant le contrat `CLIAdapter` (`TYPES-001`).
2. L'identification de l'adaptateur opérationnel en v1 (`cursor-cli`).
3. Le filtrage des adapters selon leur disponibilité opérationnelle (`isAvailable()`).
4. Le refus strict de tout identifiant d'adapter inconnu ou non enregistré.

---

## Cas

```gherkin
Étant donné une instance de "AdapterRegistryService" initialisée avec les adapters embarqués
Quand on demande la liste complète des adapters enregistrés "getAllAdapters()"
Alors elle retourne la liste contenant au moins l'adapter "cursor-cli"

Étant donné une requête pour obtenir l'adapter par son identifiant "getAdapter('cursor-cli')"
Quand l'adapter est déclaré
Alors le service retourne l'instance correspondante implémentant CLIAdapter

Étant donné une requête ciblant un identifiant inconnu "getAdapter('non-existant')"
Quand la méthode est invoquée
Alors le service retourne undefined conformément à la signature officielle de SVC-003 (CliAdapterContract | undefined)
```

---

## Données

| Élément | Valeur |
|---|---:|
| Adapter officiel v1 | `id: "cursor-cli"`, `name: "Cursor CLI"` |
| Interface validée | `CLIAdapter` (`TYPES-001`) |
| Méthodes du registre | `getAllAdapters(): CliAdapterContract[]`, `getAdapter(id: string): CliAdapterContract \| undefined`, `isAvailable(id: string): Promise<boolean>` |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Présence de `cursor-cli` | `OUI` | Conformité CDC §7 & ADR-003 |
| Typage de retour valide | Instance de `CliAdapterContract` | Vérification de l'interface contractuelle |
| Typage retour inconnu | `undefined` | Signature stricte SVC-003 |

---

## Ce que ce cas ne vérifie pas

- L'exécution de la commande de spawn CLI → `CASE-ADPT-02-2` ;
- Le filtrage du menu déroulant dans l'IHM → `CASE-UI-01-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_ADPT_01_4_adapter_registry_service_enumeration`  
**Fichier :** `tests/units/adpt/case-adpt-01-4.test.ts`  

## Revue du test automatisé

- [ ] Le test initialise le registre avec `CursorCliAdapter`.
- [ ] Le test vérifie la récupération de l'adapter par son identifiant.
- [ ] Le test vérifie le comportement sur identifiant inconnu (`undefined`).
- [ ] Le nom du test contient `CASE_ADPT_01_4`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
