# CASE-ARCH-03-3 — Persistance atomique anti-corruption des données JSON via .tmp adjacent et renommage atomique (LIB-001)

**Spécification :** `SPEC-ARCH-03`
**Critère d'acceptation :** `AC-ARCH-03-3`
**Type :** acceptation
**Niveau de risque :** critique

## Ce que ce cas protège

Toute persistance JSON sous `.agents/data/` doit obligatoirement utiliser `atomicWriteJson` (`LIB-001`) via un fichier temporaire `.tmp` adjacent et un `renameSync` atomique, garantissant qu'aucune coupure de courant ou crash n'altère un fichier existant.

## Cas

```gherkin
Étant donné une requête d'écriture de fichier JSON
Quand "atomicWriteJson" est exécutée
Alors un fichier temporaire portant le suffixe ".tmp" est d'abord écrit
Puis un renommage atomique remplace le fichier cible
Et aucun fichier ".tmp" résiduel ne subsiste après l'opération
```

## Données

| Élément | Valeur |
|---|---:|
| Module cible | `src/lib/fs/json-atomic-writer.fs.ts` (`LIB-001`) |
| Mécanisme | Écriture `fs.writeFileSync(tmpPath)` puis `fs.renameSync(tmpPath, finalPath)` |

## Résultat attendu, calculé à la main

| Grandeur | Valeur attendue | Calcul |
|---|---:|---|
| Écriture sécurisée | `Fichier final valide` | Vérification du contenu JSON sur disque |
| Fichiers `.tmp` orphelins | `0` | Scan du répertoire cible post-écriture |

## Ce que ce cas ne vérifie pas

- Le CRUD fichiers/UI global -> `CASE-DATA-04-1` ;
- La suppression de fichiers -> `CASE-ARCH-03-1`.

---

## Test automatisé

**Nom attendu :**
`test_CASE_ARCH_03_3_atomic_json_writer_integrity`
**Fichier :** `tests/tests-unitaires/arch/case-arch-03-3.test.ts`

## Revue du test automatisé

- [ ] Le test espionne les appels à `writeFileSync` et `renameSync`.
- [ ] Le test valide le passage obligatoire par un fichier `.tmp` adjacent.
- [ ] Le test vérifie l'absence de fichiers temporaires résiduels.
- [ ] Le test échoue si l'écriture atomique n'utilise pas de fichier temporaire ou omet le renommage atomique.
- [ ] Le nom du test contient `CASE_ARCH_03_3`.
- [ ] Aucune assertion étrangère à ce cas n'a été ajoutée.

**Relu par :** *(à renseigner)*
**Remarques :** *(à renseigner)*
