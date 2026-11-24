# ADR-005 — Persistance des ressources sous `.agents/data/`

**Statut :** accepté  
**Date :** 21/09/2026  
**Décidé par :** Autrement (`U`)

Un ADR conserve la trace d'une décision et de ses raisons : *voilà ce que nous
avons décidé, et pourquoi*. Il ne se réécrit pas quand on change d'avis — on en
crée un nouveau qui remplace celui-ci.

À distinguer :
- une **spec** dit ce que le système doit faire ;
- une **RFC** propose une manière de résoudre un problème, pour discussion ;
- un **ADR** enregistre une décision prise.

---

## Ancrage CDC (requis / complété)

| CDC | Rôle |
|---|---|
| R-01, R-02, R-14, R-16, R-17, R-36 | Un fichier / ressource ; formats par type ; `if` JS ; scénarios ; CRUD UI+fichiers |
| REQ-009…REQ-012, REQ-014, REQ-034, REQ-104 | CRUD agents/profils/prompts/exit/if/scenarios ; canvas persisté ; keys dans scénario |
| Contraintes 3, 8, 9 | `.agents/data/` ; homogénéité par type ; if JS vs JSON |
| Annexe A | Arborescence cible |
| R-37 | Pas d'historisation des exécutions sous `data/` |

Cet ADR **complète** le CDC en figeant l'organisation fichiers et les principes de lecture/écriture, sans figer les schémas JSON détaillés (→ specs, R-41).

---

## Contexte

Le CDC place la configuration versionnable sous `.agents/data/` avec des dossiers dédiés, un fichier par ressource, JSON pour la plupart des types et **JavaScript** pour `if`. Les coéquipiers doivent pouvoir éditer à la main (Sam). Il faut trancher l'emplacement relatif, le modèle « un fichier = une ressource », et ce qui **n'entre pas** dans `data/` (logs d'exécution, session CLI).

## Options envisagées

### Option A — Arborescence Annexe A stricte + un fichier / ressource (retenue)

| | |
|---|---|
| Ce qu'elle apporte | Alignement Annexe A / R-01 / contrainte 9 ; git-friendly |
| Ce qu'elle coûte | Nombre de fichiers ; discipline de nommage |
| Ce qu'elle rend difficile plus tard | Base SQL centralisée |

### Option B — Base SQLite unique sous `.agents/`

| | |
|---|---|
| Ce qu'elle apporte | Transactions |
| Ce qu'elle coûte | Moins diffable / reviewable ; contredit « fichiers éditables » comme modèle premier |
| Ce qu'elle rend difficile plus tard | Workflow git de Sam |

### Option C — Stockage cloud / distant

| | |
|---|---|
| Ce qu'elle apporte | Sync multi-machine |
| Ce qu'elle coûte | Hors périmètre local mono-user |
| Ce qu'elle rend difficile plus tard | Standalone |

## Décision

1. **Racine données :** `<workspacePath>/.agents/data/` où `workspacePath` = `cwd` au démarrage (**ADR-001**, REQ-006).
2. **Arborescence obligatoire (v1) :**

```text
.agents/
├── clientsbox.js          # livrable (ADR-001)
└── data/
    ├── agents/            # JSON — un fichier / agent
    ├── profils/           # JSON
    ├── prompts/           # JSON
    ├── exit/              # JSON
    ├── if/                # JavaScript — export/fonction if(sac)→bool (R-14)
    └── scenarios/         # JSON — graphe + keys (R-16, REQ-034)
```

3. **Un type ⇒ un format de lecture** (R-02) : parseurs distincts JSON vs module JS pour `if`.
4. **CRUD** : toute ressource listée est créable/modifiable/supprimable **via UI et via fichiers** (R-36, REQ-009…012) ; l'UI relit le disque comme source de vérité (pas de cache opaque non invalidé — détail → specs).
5. **Hors `data/` :**  
   - pas de logs d'exécution (R-37) ;  
   - pas de store de **session CLI** (session = CLI, voir **ADR-002/003**) ;  
   - terminal UI = live non persisté (R-26) ;  
   - pas de documentation utilisateur Markdown (emplacement et export → **ADR-017**, sous-arbre `.agents/docs/`).
6. **Noms de fichiers :** libre tant qu'uniques dans le dossier ; conventions exactes → specs.
7. **Schémas JSON** (champs agent/profil/prompt/exit/scenario) → **specs** (R-41), en cohérence avec R-05/R-06 (1 profil / agent ; 3 modes politique).

## Raisons

- Option A est la transcription directe d'Annexe A + R-01 + contrainte 9.
- B et C contredisent l'éditable-git / le local standalone.

## Conséquences acceptées

- L'utilisateur peut casser un `if.js` à la main (pas de sandbox).
- Renum keys peut casser des scripts If numériques (R-43 — assumé user).
- Migration de schéma JSON = version de specs, pas un ADR de session.

## Ce qui nous ferait revenir dessus

- Exigence d'une base unique (SQLite) pour perfs / verrouillage multi-process.
- Besoin de synchronisation distante des scénarios (nouveau CDC).

## Liens

- Socle chemin workspace : **ADR-001**.  
- Exécution `if` / scénarios : **ADR-004**.  
- Documentation utilisateur et export `.agents/docs/` : **ADR-017** (hors périmètre `data/`).  
- Aucun ADR « session agent » : hors sujet — géré par le CLI.
