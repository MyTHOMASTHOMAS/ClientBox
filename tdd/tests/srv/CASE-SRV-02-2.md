# CASE-SRV-02-2 — Impression de l'URL d'accès dans la console du terminal OS au démarrage sans ouverture automatique du navigateur

**Spécification :** `SPEC-SRV-02`
**Critère d'acceptation :** `AC-SRV-02-2`
**Type :** acceptation
**Niveau de risque :** modéré

## Ce que ce cas protège

Dès que le serveur HTTP est actif et prêt à recevoir les connexions, l'URL cliquable (`http://localhost:<port>`) doit être imprimée de manière claire et non équivoque dans la console du terminal OS de lancement (`REQ-004`). De plus, le processus ne doit en aucun cas déclencher une ouverture automatique intrusive du navigateur web de l'utilisateur (`REQ-004`). Si l'URL n'était pas affichée, l'utilisateur ne saurait pas à quelle adresse accéder ; si un navigateur était lancé de force, cela contreviendrait à l'exigence de non-intrusion et poserait des problèmes en environnement CI/serveur headless.

## Cas

```gherkin
Étant donné le lancement du serveur ClientsBox sur le port par défaut 2974
Quand l'écoute réseau est confirmée active
Alors le terminal OS (stdout) affiche le message contenant l'URL "http://localhost:2974"
Et aucun processus de navigateur web (ex. open, xdg-open, start) n'est exécuté par ClientsBox

Étant donné le lancement avec surcharge de port "-p 8080"
Quand l'écoute réseau est active
Alors la sortie standard affiche le message contenant l'URL "http://localhost:8080"
Et aucun navigateur n'est ouvert automatiquement
```

## Données

| Élément | Valeur |
|---|---:|
| Message attendu sur port par défaut | Contient `http://localhost:2974` |
| Message attendu sur port 8080 | Contient `http://localhost:8080` |
| Flux de sortie ciblé | `stdout` |
| Appels système d'ouverture de fenêtre | `0` (aucun fork de `xdg-open`, `open`, `explorer.exe`, `start`) |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Présence de l'URL dans `stdout` | `OUI` | Détection de chaîne `http://localhost:<port>` dans le flux (REQ-004) |
| Déclenchement automatique du browser | `NON` | Respect strict de REQ-004 (mode CLI serveur non intrusif) |
| Compatibilité environnements headless | `100%` | Aucun échec d'affichage ou crash en l'absence de GUI |

## Ce que ce cas ne vérifie pas

- La livraison du contenu HTML sur cette URL → `CASE-SRV-02-1` ;
- La gestion des erreurs de démarrage réseau → `CASE-SRV-01-3` ;
- L'arrêt du serveur via signaux → `CASE-SRV-02-3`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_SRV_02_2_console_url_display_without_browser_auto_open`
**Fichier :** `tests/tests-unitaires/srv/case-srv-02-2.test.ts`

## Revue du test automatisé

- [ ] Le test capture la sortie standard (`stdout`) lors du démarrage du serveur.
- [ ] Le test vérifie que la chaîne `http://localhost:2974` (ou le port configuré) est bien émise sur `stdout`.
- [ ] Le test espionne les commandes d'exécution de processus (`child_process.exec`, `spawn`) et s'assure qu'aucun utilitaire d'ouverture de navigateur n'est invoqué.
- [ ] Le test échoue si l'URL est absente des logs de démarrage.
- [ ] Le nom du test contient `CASE_SRV_02_2`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
