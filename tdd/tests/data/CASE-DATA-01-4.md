# CASE-DATA-01-4 — Rejet explicite de tout fichier JSON corrompu ou invalide avec diagnostic sans plantage applicatif

**Spécification :** `SPEC-DATA-01`
**Critère d'acceptation :** `AC-DATA-01-4`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Toute ressource JSON syntaxiquement corrompue ou sémantiquement invalide doit être rejetée avec un message d'erreur précis, sans provoquer le crash du serveur HTTP (`C-08`, `REQ-101`, `REQ-104`). Si ce mécanisme disparaît, un fichier malformé peut planter le serveur ou être silencieusement ignoré, rendant le diagnostic impossible.

## Cas

```gherkin
Étant donné un fichier ".agents/data/agents/agent-bad.json" contenant du JSON syntaxiquement invalide :
  | contenu | "{ id: 'agent-bad', profilId: " |
Quand le chargeur tente de désérialiser ce fichier
Alors une erreur de parsing est levée et interceptée
Et le serveur HTTP reste opérationnel (aucun crash)
Et un message de diagnostic précis est émis indiquant le fichier source et la nature de l'erreur

Étant donné un fichier ".agents/data/profils/profil-bad.json" contenant un JSON valide syntaxiquement mais avec un champ obligatoire manquant :
  | contenu | { "id": "profil-bad" } |
Quand le validateur de schéma traite ce fichier
Alors la validation échoue avec un diagnostic explicite
Et le serveur HTTP reste opérationnel (aucun crash)
Et le fichier défaillant est identifié nommément dans le message d'erreur

Étant donné un fichier contenant un identifiant avec des caractères interdits :
  | contenu | { "id": "../etc/passwd", "profilId": "p" } |
Quand le validateur de schéma traite ce fichier
Alors la validation échoue
Et le message d'erreur identifie le caractère interdit dans "id"
```

## Données

| Élément | Valeur |
|---|---:|
| Fichier agent corrompu (syntaxe) | `"{ id: 'agent-bad', profilId: "` (JSON invalide) |
| Fichier profil incomplet (sémantique) | `{ "id": "profil-bad" }` (champs obligatoires manquants) |
| Identifiant avec path-traversal | `"../etc/passwd"` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Crash serveur sur JSON syntaxiquement invalide | `NON` | Exception interceptée à la désérialisation |
| Diagnostic émis (fichier + nature erreur) | `OUI` | Message d'erreur nominatif |
| Crash serveur sur JSON sémantiquement invalide | `NON` | Exception interceptée à la validation |
| Diagnostic émis (champ manquant) | `OUI` | Message d'erreur nominatif avec nom du champ |
| Crash serveur sur path-traversal | `NON` | Rejet à la validation, interception propre |

## Ce que ce cas ne vérifie pas

- La validation du schéma d'un agent valide → `CASE-DATA-01-1` ;
- La validation du schéma d'un profil valide → `CASE-DATA-01-2` ;
- Les erreurs dans les scripts JS `if` → `CASE-DATA-02-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_DATA_01_4_invalid_json_rejection_no_crash`
**Fichier :** `tests/tests-unitaires/data/case-data-01-4.test.ts`

## Revue du test automatisé

- [ ] Le test tente de charger un fichier JSON syntaxiquement invalide et vérifie l'absence de crash.
- [ ] Le test vérifie qu'un diagnostic nominatif est émis avec le nom du fichier.
- [ ] Le test tente de valider un objet avec champ obligatoire manquant et vérifie l'absence de crash.
- [ ] Le test vérifie le rejet d'un identifiant contenant `../` ou `\`.
- [ ] Le test échoue si le bloc try/catch de désérialisation est retiré du code.
- [ ] Le nom du test contient `CASE_DATA_01_4`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
