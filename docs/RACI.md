# RACI — Organisation de l'équipe ShopLite

## Composition de l'équipe

> Équipe de 2 personnes. Chaque membre cumule plusieurs rôles.

| Membre | Rôles assumés |
|--------|--------------|
| **Noah** | DevOps / Release Manager · DBA / Référent données · Incident Manager |
| **Omar** | Développeur API · QA / Testeur · Product Owner · Développeur Frontend |

---

## Définition RACI

| Lettre | Signification | Explication |
|--------|--------------|-------------|
| **R** | Responsible | La personne qui réalise concrètement l'action |
| **A** | Accountable | La personne qui porte la responsabilité finale et valide |
| **C** | Consulted | La personne consultée avant ou pendant l'action |
| **I** | Informed | La personne tenue informée du résultat |

---

## Matrice RACI — ShopLite

| Activité | PO *(Omar)* | API *(Omar)* | Frontend *(Omar)* | DevOps *(Noah)* | DBA *(Noah)* | QA *(Omar)* | Incident Manager *(Noah)* |
|----------|:-----------:|:------------:|:-----------------:|:--------------:|:-----------:|:-----------:|:------------------------:|
| Créer la version stable Git | I | R | I | A | I | C | I |
| Mettre en place Docker Compose | I | C | I | R/A | I | I | I |
| Configurer la CI (GitHub Actions) | I | R/A | I | C | I | C | I |
| Configurer le CD (GitHub Actions) | I | C | I | R/A | I | I | I |
| Ajouter le test `/api/products` | C | R/A | I | I | I | R | I |
| Sauvegarder PostgreSQL | I | I | I | R/A | R | I | C |
| Provoquer l'incident contrôlé | C | R | I | A | I | I | I |
| Diagnostiquer l'incident | I | R | C | R | C | R | A |
| Décider le rollback | A | C | I | C | I | I | R |
| Exécuter le rollback | I | C | I | R/A | C | I | I |
| Vérifier les données après rollback | I | I | I | C | R/A | I | I |
| Valider les tests après rollback | C | C | I | I | I | R/A | I |
| Rédiger le rapport d'incident | I | C | I | I | I | C | R/A |

---

## Répartition réelle pendant le TP

| Tâche réalisée | Responsable |
|----------------|------------|
| Configuration CD (`.github/workflows/cd.yml`) | Noah |
| Configuration CI (`.github/workflows/ci.yml`) | Omar |
| Tests Jest (`/api/products`, `/api/health`) | Omar |
| Docker Compose (`docker-compose.yml`, `.dev.yml`) | Noah |
| Scripts backup (`backup.sh`, `restore-test.sh`) | Noah |
| Stratégie Git (branches, tags, PRs, commits conventionnels) | Omar |
| Incident contrôlé + rollback Git | Omar (commit cassé) + Noah (rollback deploy) |
| Rédaction RACI et documentation incident | Noah |

---

## Timeline de l'incident contrôlé — 2026-06-15

> **Incident #6** — Route `GET /api/products` retourne 500 après introduction volontaire de `name_BROKEN` dans la requête SQL.

| Heure | Action | Responsable | Résultat |
|-------|--------|-------------|---------|
| ~09:00 | Backup PostgreSQL avant la manipulation | Noah (DBA) | Dump horodaté créé dans `backups/` |
| ~09:05 | Introduction de `name_BROKEN` dans `routes/products.js` | Omar (API) | Commit de casse poussé sur la branche |
| ~09:07 | Exécution du test Jest `products.test.js` | Omar (QA) | ❌ Test rouge — `GET /api/products` retourne 500 |
| ~09:10 | Analyse des logs API (`docker compose logs -f api`) | Omar (API) + Noah (DevOps) | Erreur SQL identifiée : colonne `name_BROKEN` inexistante |
| ~09:13 | Vérification PostgreSQL — données intactes | Noah (DBA) | ✅ Volume non supprimé, données présentes |
| ~09:15 | Décision de rollback par `git revert` | Noah (Incident Manager) | Rollback validé |
| ~09:17 | `git revert HEAD --no-edit` + rebuild | Omar (API) + Noah (DevOps) | `docker compose ... up -d --build` lancé |
| ~09:20 | Smoke test + test Jest | Omar (QA) | ✅ Tests repassés verts |
| ~09:22 | Contrôle final des données PostgreSQL | Noah (DBA) | ✅ Données intactes — aucune perte |
| ~09:25 | Rédaction du rapport d'incident | Noah (Incident Manager) | `docs/INCIDENT.md` mis à jour |

> **Conclusion :** rollback effectué sans `docker compose down -v`, volume PostgreSQL préservé, données intactes.

---

## Apprentissages issus du TP

- À deux, chaque membre doit cumuler plusieurs rôles : le découpage RACI reste utile pour clarifier **qui est responsable de quoi**, même en binôme.
- L'**Incident Manager** n'est pas forcément le plus technique : son rôle est de coordonner, décider et tracer.
- La règle critique : **ne jamais lancer `docker compose down -v`** pendant un incident si les données doivent être conservées.
- Le `git revert` est préférable au `git reset --hard` en contexte d'équipe car il conserve l'historique et est réversible.
