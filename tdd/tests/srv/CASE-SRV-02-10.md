# CASE-SRV-02-10 — Validation E2E du chargement des fichiers de configuration depuis un chemin personnalisé via AGENTS_DIR

**Spécification :** `SPEC-SRV-02`  
**Critère d'acceptation :** `AC-SRV-02-9`  
**Type :** acceptation E2E boîte noire (Playwright)  
**Niveau de risque :** critique  
**ADR liés :** `ADR-001`, `ADR-005`, `ADR-008`, `ADR-011`  

---

## Ce que ce cas protège

Ce cas valide dans un vrai navigateur web (Playwright) que :
1. Lorsque la variable d'environnement `AGENTS_DIR` est absente, le serveur résout par défaut le répertoire `.agents` à la racine du workspace et distribue les données situées dans `.agents/data/`.
2. Lorsque `AGENTS_DIR` est définie avec un chemin personnalisé (chemin relatif ou absolu vers un autre répertoire contenant `data/`), le serveur bascule dynamiquement sa racine de données et l'IHM web affiche fidèlement les fichiers situés dans ce dossier personnalisé.

---

## Cas

```gherkin
Scénario : Résolution par défaut du dossier .agents en l'absence de variable AGENTS_DIR
  Étant donné le serveur HTTP démarré sans variable AGENTS_DIR définie dans l'environnement
  Quand le navigateur ouvre la liste des agents "/api/agents" ou l'IHM sur "#/agents"
  Alors les agents servis proviennent du répertoire par défaut ".agents/data/agents/"

Scénario : Surcharge dynamique de l'emplacement des données via la variable AGENTS_DIR
  Étant donné un répertoire personnalisé sur disque contenant un jeu de données distinct
  Et la variable d'environnement "AGENTS_DIR" pointant vers ce répertoire personnalisé
  Quand le serveur HTTP démarre et que le navigateur interroge l'application
  Alors les ressources restituées dans l'IHM correspondent exclusivement aux fichiers du répertoire personnalisé
```

---

## Données

| Élément | Valeur |
|---|---|
| Variable d'environnement | `AGENTS_DIR` |
| Valeur par défaut | `.agents` |
| Valeur de test surcharge | Répertoire sandbox ou chemin absolu personnalisé |
| Route de contrôle API | `GET /api/agents` |
| Route de contrôle IHM | `#/agents` |

---

## Test automatisé

**Nom attendu :** `test_CASE_SRV_02_10_e2e_agents_dir_custom_path_resolution`  
**Fichier :** `tests/e2e/srv/CASE-SRV-02-10.e2e.test.ts`  
**Outil :** Playwright (`@playwright/test`)
