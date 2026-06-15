# Journal des incidents

## Tableau de suivi

| # | Symptôme | Heure | Cause identifiée | Commande utilisée | Résultat |
| - | -------- | ----- | ---------------- | ----------------- | -------- |
| 1 | `database "shoplite_dev" does not exist` | 2026-06-14 16:45 | Volume Postgres existant initialisé avec l'ancienne DB `shoplite`, les vars d'env ignorées au redémarrage | `docker compose down -v && docker compose -f docker-compose.yml -f docker-compose.dev.yml up` | DB recréée avec `shoplite_dev` |
| 2 | `password authentication failed for user "shoplite"` | 2026-06-14 16:45 | Même cause — mot de passe figé dans le volume lors de la première init | `docker compose down -v` | Volume supprimé, nouveau mot de passe appliqué |
| 3 | `additional properties 'env_file' not allowed` | 2026-06-14 | `env_file` placé à la racine du fichier override au lieu d'être dans chaque service | Déplacement de `env_file` à l'intérieur de chaque bloc `services.<nom>` | Fichiers valides |
| 4 | `target stage "development" could not be found` | 2026-06-14 | `docker-compose.dev.yml` ciblait `target: development` mais le Dockerfile n'avait qu'un seul stage | Conversion du Dockerfile en multi-stage (`development` + `production`) | Build dev fonctionnel |
| 5 | CD ne se déclenche pas sur `feature/docker-foundation` | 2026-06-14 | `workflow_run` nécessite que le fichier workflow soit sur la branche par défaut (`main`) | Merge sur `main` requis | Résolu après merge |
| 6 | `GET /api/products` retourne 500 — test Jest échoue | 2026-06-15 | Incident contrôlé : colonne SQL `name_BROKEN` introduite volontairement dans la requête `SELECT` du route `/products` | `git revert HEAD --no-edit && docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build` | Route restaurée, données PostgreSQL intactes (volume non supprimé), test repassé vert |

## Procédure de diagnostic rapide

```bash
# Voir les logs d'un service en temps réel
docker compose logs -f api

# Filtrer les erreurs uniquement
docker compose logs api | grep '"level":"error"'

# Inspecter le healthcheck d'un container
docker inspect shoplite_api | jq '.[0].State.Health'

# Vérifier la readiness de l'API
curl -s http://localhost:8080/api/ready | jq .

# Vérifier le health complet
curl -s http://localhost:8080/api/health | jq .
```

## Centralisation des logs en production

En environnement de production, les logs JSON émis sur `stdout` par chaque container seraient collectés et centralisés via une stack de type **ELK** ou **Loki** :

| Composant | Rôle |
| --------- | ---- |
| **Filebeat / Promtail** | Agent léger installé sur le serveur, lit les logs Docker (`json-file`) et les envoie |
| **Elasticsearch / Loki** | Stockage et indexation des logs |
| **Kibana / Grafana** | Interface de recherche, dashboards, alertes |

Le champ `request_id` propagé dans chaque log permet de corréler toutes les lignes d'une même requête à travers les services (`api`, `proxy`, `db`) dans une interface comme Kibana.
