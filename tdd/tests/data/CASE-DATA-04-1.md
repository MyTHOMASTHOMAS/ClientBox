# CASE-DATA-04-1 — Répercussion synchrone et atomique des modifications UI sur les fichiers disques correspondants

**Spécification :** `SPEC-DATA-04`
**Critère d'acceptation :** `AC-DATA-04-1`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Toute opération CRUD déclenchée via l'UI doit se traduire par une écriture immédiate et atomique sur le disque (`REQ-009`, `REQ-010`, `REQ-011`, `REQ-012`, `REQ-034`, `R-36`). Si cette écriture est différée ou partielle, l'utilisateur peut perdre des modifications lors d'un crash ou d'un rechargement, et le fichier peut se retrouver dans un état corrompu (écriture partielle).

## Cas

```gherkin
Étant donné que l'utilisateur crée un agent "agent-test" via l'IHM avec les paramètres :
  | id       | "agent-test"      |
  | name     | "Test Agent"      |
  | profilId | "profil-standard" |
Quand l'action de création est validée côté API
Alors le fichier ".agents/data/agents/agent-test.json" est présent sur le disque immédiatement
Et son contenu correspond fidèlement aux paramètres saisis

Étant donné un agent "agent-test" existant sur le disque
Quand l'utilisateur modifie le champ "name" en "Test Agent v2" via l'IHM
Alors le fichier ".agents/data/agents/agent-test.json" est mis à jour immédiatement
Et la valeur "name" dans le fichier vaut "Test Agent v2"
Et aucun fichier temporaire corrompu ne subsiste dans le répertoire

Étant donné un agent "agent-test" existant sur le disque
Quand l'utilisateur supprime cet agent via l'IHM
Alors le fichier ".agents/data/agents/agent-test.json" est supprimé immédiatement du disque
```

## Données

| Élément | Valeur |
|---|---:|
| Ressource cible | Agent |
| Chemin disque | `.agents/data/agents/agent-test.json` |
| Champ modifié | `name: "Test Agent v2"` |
| Pattern de persistance atomique | Écriture fichier temporaire `.agents/data/agents/.agent-test.json.tmp` puis `fs.renameSync` / atomique |
| Délai toléré entre action UI et écriture disque | `0` (synchrone) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Présence du fichier après création | `OUI` | Écriture synchrone R-36 |
| Contenu correct après création | `OUI` | Bijection paramètres ↔ JSON |
| Fichier mis à jour après modification | `OUI` | Écriture synchrone |
| Mécanisme atomique (write temp + rename) | `OUI` | Espionnage des appels d'écriture (pas d'écrasement direct tronqué) |
| Absence de fichier temporaire résiduel | `OUI` | Écriture atomique (write + rename) |
| Fichier absent après suppression | `OUI` | Suppression synchrone |

## Ce que ce cas ne vérifie pas

- La relecture du disque comme source de vérité sans cache → `CASE-DATA-04-2` ;
- L'absence de logs sous `data/` → `CASE-DATA-04-3` ;
- La gestion des conflits d'écriture simultanée → cas limite hors AC minimal.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_04_1_ui_changes_immediately_persisted_to_disk`
**Fichier :** `tests/tests-unitaires/data/case-data-04-1.test.ts`

## Revue du test automatisé

- [ ] Le test appelle le handler de création et vérifie la présence du fichier sur le disque immédiatement.
- [ ] Le test vérifie que le contenu JSON du fichier correspond aux paramètres de création.
- [ ] Le test appelle le handler de modification et vérifie la mise à jour synchrone du fichier.
- [ ] Le test appelle le handler de suppression et vérifie l'absence du fichier sur le disque.
- [ ] Le test espionne les primitives de système de fichiers pour vérifier l'écriture temporaire suivie du renommage atomique.
- [ ] Le test vérifie l'absence de fichier temporaire résiduel (atomicité).
- [ ] Le test échoue si l'écriture est différée, non atomique ou manquante.
- [ ] Le nom du test contient `CASE_DATA_04_1`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*

