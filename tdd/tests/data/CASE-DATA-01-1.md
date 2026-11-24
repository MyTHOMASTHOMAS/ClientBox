# CASE-DATA-01-1 — Validation du schéma JSON d'un Agent : `profilId`, `cliId` obligatoires et `model` optionnel

**Spécification :** `SPEC-DATA-01`
**Critère d'acceptation :** `AC-DATA-01-1`, `AC-DATA-01-6`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Le schéma d'un agent impose la présence obligatoire des champs `profilId` et `cliId` non vides (`R-05`, `R-03`, `REQ-009`) et supporte optionnellement un modèle d'IA cible (`model?: string`). Si `profilId` disparaît, l'agent ne peut s'exécuter ; si `cliId` disparaît, le rattachement à l'adapter CLI est rompu et le runner ne peut résoudre l'adapter (`SVC-001` / `SVC-004`). Si `model` est fourni, il doit être une chaîne non vide normalisée sans espaces superflus.

## Cas

```gherkin
Étant donné un objet JSON représentant un agent avec les champs obligatoires et un modèle optionnel :
  | champ     | valeur            |
  | id        | "agent-dev"       |
  | name      | "Développeur"     |
  | profilId  | "profil-standard" |
  | cliId     | "cursor-cli"      |
  | model     | "gpt-5.3-codex"   |
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit sans erreur
Et le champ "model" est préservé avec "gpt-5.3-codex"
Et le fichier ".agents/data/agents/agent-dev.json" est accepté tel quel

Étant donné un objet JSON d'agent sans le champ "model"
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit
Et le champ "model" est indéfini

Étant donné un objet JSON d'agent avec un champ "model" constitué uniquement d'espaces
Quand le validateur de schéma JSON traite cet objet
Alors la validation réussit
Et le champ "model" est normalisé à indéfini

Étant donné un objet JSON d'agent avec un champ "model" non chaîne (ex: 123)
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue avec une erreur de type

Étant donné un objet JSON d'agent sans le champ "profilId"
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "profilId" est un champ obligatoire manquant

Étant donné un objet JSON d'agent avec "profilId" égal à une chaîne vide ""
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "profilId" ne peut pas être vide

Étant donné un objet JSON d'agent sans le champ "cliId"
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "cliId" est un champ obligatoire manquant

Étant donné un objet JSON d'agent avec "cliId" égal à une chaîne vide ""
Quand le validateur de schéma JSON traite cet objet
Alors la validation échoue
Et le message d'erreur indique que "cliId" ne peut pas être vide
```

## Données

| Élément | Valeur |
|---|---:|
| id | `"agent-dev"` |
| name | `"Développeur"` |
| profilId (valide) | `"profil-standard"` |
| cliId (valide) | `"cursor-cli"` |
| model (valide optionnel) | `"gpt-5.3-codex"` |
| profilId (invalide — absent / vide) | *(omis)* / `""` |
| cliId (invalide — absent / vide) | *(omis)* / `""` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Validation (objet complet avec model) | `PASS` | `profilId` + `cliId` valides, `model` préservé |
| Validation (sans model) | `PASS` | `model` optionnel ignoré proprement |
| Validation (`profilId` absent/vide) | `FAIL` | Contrainte R-05 |
| Validation (`cliId` absent/vide) | `FAIL` | Contrainte R-03 / REQ-009 |
| Validation (`model` non chaîne) | `FAIL` | Contrainte type string AC-DATA-01-6 |

## Ce que ce cas ne vérifie pas

- L'existence réelle du profil sur disque → couche service (`SVC-004`) ;
- L'existence d'un adapter opérationnel pour `cliId` → `SVC-003` / `SVC-004` ;
- La validation du schéma d'un profil → `CASE-DATA-01-2` ;
- La résistance aux path-traversal dans `id` → `CASE-DATA-01-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_01_1_agent_schema_validation_profilId_cliId`
**Fichier :** `tests/tests-unitaires/data/case-data-01-1.test.ts`

## Revue du test automatisé

- [ ] Le test instancie un agent valide avec `profilId` et `cliId` non vides et vérifie `PASS`.
- [ ] Le test vérifie `FAIL` si `profilId` absent ou vide.
- [ ] Le test vérifie `FAIL` si `cliId` absent ou vide.
- [ ] Le test échoue si l'une des contraintes obligatoires est retirée du schéma.
- [ ] Le nom du test contient `CASE_DATA_01_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
