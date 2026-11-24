# CASE-ADPT-05-4 — Énumération et parsing des modèles via `listModels` Codex

**Spécification :** `SPEC-ADPT-05`  
**Critère d'acceptation :** `AC-ADPT-05-5`  
**Type :** acceptation  
**Niveau de risque :** moyen  
**ADR liés :** `ADR-002`, `ADR-006`, `ADR-016`  

---

## Ce que ce cas protège

La méthode `listModels()` de `CodexCLIAdapter` doit permettre au serveur ClientsBox d'interroger le binaire Codex pour découvrir dynamiquement les modèles d'IA disponibles, afin d'alimenter les sélecteurs de formulaires UI (`GET /api/models`).  
Ce cas garantit :
1. L'appel de `<CODEX_CLI_BIN> debug models` avec `cwd` positionné sur le workspace.
2. Le parsing du JSON émis par la commande, en extrayant les slugs du tableau `models` (`model.slug`).
3. La déduplication des slugs et le nettoyage des espaces (`trim()`).
4. La résilience totale : si le binaire est inaccessible, inexistant ou renvoie un code de sortie non nul, la méthode retourne un tableau vide `[]` sans lever d'exception.
5. La mémorisation Node.js : après un premier appel réussi, la liste des modèles est conservée en mémoire vive via un cache LRU avec TTL d'une heure (ADR-016), et les appels ultérieurs répondent immédiatement sans réexécuter le binaire.

---

## Cas

```gherkin
Étant donné un environnement où le binaire Codex retourne la sortie JSON suivante pour "debug models" :
  """
  {
    "models": [
      { "slug": "gpt-reserve", "display_name": "GPT-Reserve" },
      { "slug": "gpt-6-luna", "display_name": "GPT-6 Luna" },
      { "slug": "gpt-5.6-terra", "display_name": "GPT-5.6 Terra" }
    ]
  }
  """
Quand "adapter.listModels()" est exécuté pour la première fois
Alors la promesse résout la liste ["gpt-reserve", "gpt-6-luna", "gpt-5.6-terra"]
Et un second appel à "adapter.listModels()" retourne immédiatement la même liste depuis le cache mémoire Node.js sans spawn de processus

Étant donné une sortie JSON comportant des doublons ou slugs vides :
  """
  {
    "models": [
      { "slug": "gpt-reserve" },
      { "slug": "  " },
      { "slug": "gpt-reserve" }
    ]
  }
  """
Quand "adapter.listModels()" est exécuté
Alors la liste retournée contient un unique élément ["gpt-reserve"]

Étant donné un échec de la commande CLI (code de sortie 1 ou exception)
Quand "adapter.listModels()" est exécuté
Alors la promesse résout un tableau vide []
Et aucune exception n'est propagée
```

---

## Données

| Élément | Valeur |
|---|---:|
| Commande invoquée | `<bin> debug models` |
| Propriété extraite | `item.slug` pour chaque élément de `models` |
| TTL de cache | `3 600 000 ms` (1 heure) |

---

## Résultat attendu, calculé à la main

| Situation | Sortie attendue | Calcul |
|---|---|---|
| Sortie standard `debug models` (1er appel) | `["gpt-reserve", "gpt-6-luna", "gpt-5.6-terra"]` | Extraction de la clé `slug` dans le JSON |
| Doublons dans la sortie | Éléments uniques | Déduplication préservée |
| Appel subséquent (2ème appel) | Identique au 1er appel | Retour direct depuis le cache Node.js (0 spawn) |
| Erreur commande ou binaire absent | `[]` | Tableau vide sans exception |

---

## Ce que ce cas ne vérifie pas

- L'affichage dans la modale UI de profil → `CASE-UI-01-13` ;
- L'exposition de la route HTTP `/api/models` → `CASE-SRV-02-13`.

