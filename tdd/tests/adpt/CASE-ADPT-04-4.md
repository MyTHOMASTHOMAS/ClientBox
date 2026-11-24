# CASE-ADPT-04-4 — Énumération et parsing des modèles via `listModels`

**Spécification :** `SPEC-ADPT-04`  
**Critère d'acceptation :** `AC-ADPT-04-5`  
**Type :** acceptation  
**Niveau de risque :** moyen  
**ADR liés :** `ADR-002`, `ADR-006`  

---

## Ce que ce cas protège

La méthode `listModels()` de `AntigravityCLIAdapter` doit permettre au serveur ClientsBox d'interroger le binaire Antigravity pour découvrir dynamiquement les modèles d'IA disponibles, afin d'alimenter les sélecteurs de formulaires UI (`GET /api/models`).  
Ce cas garantit :
1. L'appel de `<ANTIGRAVITY_CLI_BIN> models` avec `cwd` positionné sur le workspace.
2. Le parsing des lignes de sortie au format tabulaire `<modelId>\t<displayName>`, en extrayant uniquement l'identifiant technique (`parts[0]`).
3. L'exclusion stricte des lignes informatives préliminaires telles que `"Fetching available models..."`.
4. La déduplication des identifiants et le nettoyage des espaces.
5. La résilience totale : si le binaire est inaccessible, inexistant ou renvoie un code de sortie non nul, la méthode retourne un tableau vide `[]` sans lever d'exception ni inventer de faux modèles.
6. La mémorisation Node.js : après un premier appel réussi, la liste des modèles est conservée en mémoire vive via un cache LRU avec TTL d'une heure (ADR-016 / CR-005), et les appels ultérieurs répondent immédiatement sans réexécuter le binaire.

---

## Cas

```gherkin
Étant donné un environnement où le binaire Antigravity retourne la sortie suivante pour "models" :
  """
  Fetching available models...
  test-model-alpha\tTest Model Alpha (High)
  test-model-beta\tTest Model Beta (Low)
  test-model-gamma\tTest Model Gamma (Thinking)
  """
Quand "adapter.listModels()" est exécuté pour la première fois
Alors la promesse résout la liste ["test-model-alpha", "test-model-beta", "test-model-gamma"]
Et la ligne "Fetching available models..." est ignorée
Et un second appel à "adapter.listModels()" retourne immédiatement la même liste depuis le cache mémoire Node.js sans spawn de processus

Étant donné une sortie comportant des doublons ou des lignes vides :
  """
  test-model-alpha\tTest Model Alpha (High)

  test-model-alpha\tTest Model Alpha (High)
  """
Quand "adapter.listModels()" est exécuté
Alors la liste retournée contient un unique élément ["test-model-alpha"]

Étant donné un échec de la commande CLI (code de sortie 1 ou exception)
Quand "adapter.listModels()" est exécuté
Alors la promesse résout un tableau vide []
Et aucune exception n'est propagée
```

---

## Données

| Élément | Valeur |
|---|---:|
| Commande invoquée | `<bin> models` |
| Sortie nominale simulée | Tabulation `\t` séparant identifiant et libellé (identifiants agnostiques de test) |
| Ligne d'en-tête ignorée | `"Fetching available models..."` |
| TTL de cache | `3 600 000 ms` (1 heure) |

---

## Résultat attendu, calculé à la main

| Situation | Sortie attendue | Calcul |
|---|---|---|
| Sortie standard `models` (1er appel) | `["test-model-alpha", "test-model-beta", "test-model-gamma"]` | Extraction de la 1ère colonne tabulée sans dépendance de modèles en dur |
| Doublons dans la sortie | Éléments uniques | Déduplication préservée |
| Appel subséquent (2ème appel) | Identique au 1er appel | Retour direct depuis le cache Node.js (0 spawn) |
| Erreur commande ou binaire absent | `[]` | Tableau vide sans exception ni faux modèles |

---

## Ce que ce cas ne vérifie pas

- L'affichage dans la modale UI de profil → `CASE-UI-01-13` ;
- L'exposition de la route HTTP `/api/models` → `CASE-SRV-02-13`.

