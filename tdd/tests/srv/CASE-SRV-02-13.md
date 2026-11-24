# CASE-SRV-02-13 — Matrice complète de localisation en français des erreurs HTTP JSON

**Spécification :** `SPEC-SRV-02`, `SPEC-ARCH-04`  
**Critère d'acceptation :** `AC-SRV-02-1`, `AC-ARCH-04-3`  
**Type :** acceptation / intégration  
**Niveau de risque :** élevé  
**ADR liés :** `ADR-001`  

---

## Ce que ce cas protège

Conformément à `REQ-007` et `C-06`, 100% des messages retournés à l'utilisateur et consommés par l'IHM web doivent être libellés en langue française. Ce cas garantit que chaque contrôleur REST (`CTL-001`, `CTL-002`) et le routeur HTTP retournent des corps d'erreur JSON normalisés au format `{ "message": string }` rédigés en français sans aucune exception technique brute en anglais (`Error`, `ENOENT`, stack traces divulguées).

---

## Cas

```gherkin
Étant donné l'ensemble des routes REST documentées dans "signature-controllers.md" §4.1
Quand un client déclenche une situation d'erreur :
  | Situation                      | Route                      | Code HTTP |
  | Corps JSON invalide            | POST /api/agents           | 400       |
  | Ressource inexistante          | GET /api/agents/inconnu    | 404       |
  | Suppression profil lié         | DELETE /api/profiles/lie   | 409       |
  | Run concurrent actif           | POST /api/scenarios/x/run  | 409       |
  | Runner non initialisé          | POST /api/scenarios/x/run  | 503       |
  | Path traversal de script       | GET /api/if/../invalide    | 400       |
Alors le serveur répond avec le code HTTP correspondant
Et le corps de réponse est un objet JSON contenant la clé "message"
Et le message est rédigé intégralement en langue française sans terme anglais
```

---

## Données

| Élément | Valeur |
|---|---:|
| Schéma de réponse d'erreur | `{ "message": string }` |
| Exemples de messages attendus | `"Données invalides."`, `"Ressource non trouvée."`, `"Impossible de supprimer un profil lié."`, `"Service non initialisé."` |
| Interdictions | Aucun message brut Node.js (ex: `ENOENT`, `Unexpected token`, `undefined`) |

---

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Taux de conformité linguistique | `100 %` | Tous les statuts d'erreur testés retournent un libellé français |
| Clé JSON obligatoire | `"message"` | Contrat API unifié |

---

## Ce que ce cas ne vérifie pas

- L'affichage de l'erreur dans les formulaires UI → `CASE-UI-01-2` ;
- La capture globale console de ROOT-001 → `CASE-ARCH-04-3`.

---

## Test automatisé

**Nom attendu :**  
`test_CASE_SRV_02_13_http_errors_french_localization_matrix`  
**Fichier :** `tests/units/srv/case-srv-02-13.test.ts`  

## Revue du test automatisé

- [ ] Le test balaie les différents codes d'erreurs (400, 404, 409, 503).
- [ ] Le test vérifie que chaque réponse est au format `{ message: string }`.
- [ ] Le test vérifie l'absence de traces de pile ou d'anglicismes dans les messages.
- [ ] Le nom du test contient `CASE_SRV_02_13`.
- [ ] Le test échoue si la règle métier est volontairement supprimée du code.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*  
**Remarques :** *(à renseigner)*  
