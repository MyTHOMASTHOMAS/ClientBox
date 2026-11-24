# CASE-SRV-02-6 — Extraction streaming sécurisée du corps JSON avec garde-fou mémoire

**Spécification :** `SPEC-SRV-02`
**Critère d'acceptation :** `AC-SRV-02-1`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

Le serveur HTTP local doit analyser et désérialiser en toute sécurité les corps de requêtes HTTP entrantes au format JSON (`LIB-009 parseJsonBody`). Si cette brique était défaillante, des requêtes JSON malformées feraient crasher le serveur ou des flux volumineux provoqueraient un épuisement mémoire (attaque par déni de service local).

## Cas

```gherkin
Étant donné une requête HTTP entrante contenant un corps JSON valide '{"name":"Agent A","profilId":"dev"}'
Quand "parseJsonBody" est exécutée sur le flux "IncomingMessage"
Alors la promesse résout avec l'objet JavaScript désérialisé correspondant

Étant donné une requête HTTP entrante contenant un JSON malformé '{"name": "invalide...'
Quand "parseJsonBody" est exécutée
Alors la promesse rejette avec une exception explicite rédigée en français (ex: "Échec du parsing JSON du corps de requête")
Et le processus serveur ne plante pas

Étant donné une requête HTTP entrante dont le corps dépasse le garde-fou de taille configuré (1 Mo)
Quand le flux de données est reçu
Alors la lecture est immédiatement interrompue
Et la promesse rejette avec une erreur signalant le dépassement de capacité (HTTP 413 / Payload Too Large)

Étant donné une requête HTTP entrante avec un corps vide
Quand "parseJsonBody" est exécutée
Alors la promesse rejette avec une erreur explicite signalant l'absence de données JSON
```

## Données

| Élément | Valeur |
|---|---:|
| Seuil maximal de taille de corps | `1 048 576 octets` (1 Mo) |
| Payload nominal | `{"name":"Mon Agent","profilId":"standard","cliId":"cursor-cli"}` |
| Payload malformé | `{ invalid json structure non fermée` |
| Headers associés | `Content-Type: application/json; charset=utf-8` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Objet parsé nominal | `{ name: "Mon Agent", profilId: "standard", cliId: "cursor-cli" }` | Désérialisation stricte JSON |
| Erreur sur JSON malformé | `Rejet avec message en français` | Capture try/catch et diagnostic clair |
| Erreur sur payload > 1 Mo | `Rejet immédiat` | Garde-fou streaming respecté |

## Ce que ce cas ne vérifie pas

- L'enregistrement des routes dans le routeur HTTP → `CASE-SRV-02-7` ;
- Le service des fichiers statiques UI → `CASE-SRV-02-1` ;
- L'arrêt gracieux du serveur HTTP → `CASE-SRV-02-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_6_secure_json_body_parsing_with_memory_guard`
**Fichier :** `tests/srv/CASE-SRV-02-6.test.ts` (ou `tests/lib/body-parser.test.ts`)

## Revue du test automatisé

- [ ] Le test simule un flux `IncomingMessage` streaming valide et vérifie la désérialisation.
- [ ] Le test vérifie le rejet propre sur JSON malformé sans crash serveur.
- [ ] Le test vérifie la protection anti-saturation mémoire (dépassement de seuil 1 Mo).
- [ ] Le nom du test contient `CASE_SRV_02_6`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** Autrement (`U`)  
**Remarques :** Spécification formelle de `LIB-009` (`signature-lib.md`).
