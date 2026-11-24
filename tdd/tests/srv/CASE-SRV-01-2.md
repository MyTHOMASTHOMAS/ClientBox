# CASE-SRV-01-2 — Surcharge dynamique du port d'écoute via les options en ligne de commande -p et --port

**Spécification :** `SPEC-SRV-01`
**Critère d'acceptation :** `AC-SRV-01-2`
**Type :** acceptation
**Niveau de risque :** élevé

## Ce que ce cas protège

L'utilisateur doit pouvoir spécifier un port d'écoute personnalisé via l'option courte `-p <port>` ou l'option longue `--port <port>` au lancement du binaire (`REQ-005`, `REQ-006`). Si le parsing des arguments CLI échouait ou ignorait ces options, ClientsBox ne pourrait pas être exécuté sur un port alternatif, empêchant son utilisation en cas de contrainte réseau ou de cohabitation d'instances.

## Cas

```gherkin
Étant donné le port TCP 8080 libre sur l'interface locale
Quand l'utilisateur lance la commande "node .agents/clientsbox.js -p 8080"
Alors le serveur démarre en écoute sur "http://localhost:8080"
Et le port d'écoute effectif est 8080

Étant donné le port TCP 3000 libre sur l'interface locale
Quand l'utilisateur lance la commande "node .agents/clientsbox.js --port 3000"
Alors le serveur démarre en écoute sur "http://localhost:3000"
Et le port d'écoute effectif est 3000

Étant donné le port TCP 4200 libre sur l'interface locale
Quand l'utilisateur lance la commande "node .agents/clientsbox.js --port=4200"
Alors le serveur démarre en écoute sur "http://localhost:4200"
Et le port d'écoute effectif est 4200
```

## Données

| Élément | Valeur |
|---|---:|
| Option courte testée | `-p 8080` |
| Option longue séparée testée | `--port 3000` |
| Option longue avec assignation testée | `--port=4200` |
| Hôte local | `localhost` (`127.0.0.1`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Port d'écoute pour `-p 8080` | `8080` | Parsing de l'argument `-p` suivi d'un entier valide |
| Port d'écoute pour `--port 3000` | `3000` | Parsing de l'argument `--port` suivi d'un entier valide |
| Port d'écoute pour `--port=4200` | `4200` | Parsing du format d'assignation `--port=<val>` |
| Prise en compte de la surcharge | `OUI` | Le port surchargé remplace prioritairement le port 2974 par défaut |

## Ce que ce cas ne vérifie pas

- Le comportement en l'absence d'argument de port (valeur par défaut 2974) → `CASE-SRV-01-1` ;
- Le rejet des ports invalides ou occupés → `CASE-SRV-01-3` ;
- La résolution du chemin `workspacePath` → `CASE-SRV-01-4`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_01_2_dynamic_port_override_via_cli_options`
**Fichier :** `tests/tests-unitaires/srv/case-srv-01-2.test.ts`

## Revue du test automatisé

- [ ] Le test vérifie le démarrage sur le port spécifié avec l'option `-p <port>`.
- [ ] Le test vérifie le démarrage sur le port spécifié avec l'option `--port <port>`.
- [ ] Le test vérifie le démarrage avec le format `--port=<port>`.
- [ ] Le test vérifie que le port d'écoute actif correspond exactement à la valeur fournie.
- [ ] Le test échoue si les options `-p` ou `--port` sont ignorées au profit du port par défaut.
- [ ] Le nom du test contient `CASE_SRV_01_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
