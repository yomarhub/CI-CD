# Architecture — ShopLite

## Vue d'ensemble

ShopLite est une application e-commerce légère composée de quatre services Docker orchestrés via Docker Compose. Elle tourne en multi-environnements (dev, staging, prod) et est déployée via une pipeline CI/CD GitHub Actions.

---

## Services

### 1. `proxy` — Reverse proxy (nginx 1.27-alpine)

Point d'entrée unique de l'application. Reçoit toutes les requêtes HTTP et les redistribue vers les services internes selon la route :

- `/api/*` → redirigé vers le service `api` (port 3000)
- `/` → redirigé vers le service `frontend` (port 80)

Ajoute les headers `X-Forwarded-For` et `X-Request-Id` pour la traçabilité.

| Environnement | Port exposé |
|---------------|-------------|
| dev           | 8080        |
| staging       | 8081        |
| prod          | 80          |

---

### 2. `api` — Backend Node.js/Express

API REST construite avec Express 4. Exposée uniquement via le proxy, jamais directement en production.

**Endpoints :**

| Route | Méthode | Description |
|-------|---------|-------------|
| `/health` | GET | État général de l'API |
| `/ready` | GET | Readiness (DB connectée ?) |
| `/products` | GET | Liste tous les produits |
| `/products/:id` | GET | Détail d'un produit |

**Middlewares :**

- `requestId` — injecte un identifiant unique par requête
- `logger` — log JSON structuré (méthode, path, status, durée, request_id)

**Variables d'environnement clés :**

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL |
| `NODE_ENV` | `development` / `staging` / `production` |
| `LOG_LEVEL` | `debug` (dev) / `info` (staging) / `warn` (prod) |
| `PORT` | Port d'écoute (défaut : 3000) |

---

### 3. `db` — Base de données (PostgreSQL 16-alpine)

Stockage persistant de l'application. Les données survivent aux redémarrages et rebuilds grâce au volume nommé `shoplite_pgdata`.

**Schéma :**

```sql
CREATE TABLE products (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0)
);
```

**Données seed :** 3 produits insérés au démarrage via `database/init.sql` (Clavier, Souris, Ecran).

| Environnement | Base de données   | Port exposé |
|---------------|-------------------|-------------|
| dev           | `shoplite_dev`    | 5433        |
| staging       | `shoplite_staging`| interne     |
| prod          | `shoplite_prod`   | interne     |

---

### 4. `frontend` — Interface statique (nginx 1.27-alpine)

Sert les fichiers HTML/CSS/JS statiques depuis `frontend/src/`. Accessible uniquement via le proxy, jamais directement exposé.

---

## Réseau et volumes

Tous les services communiquent sur un réseau bridge interne nommé `shoplite_net`. Seul le proxy est accessible depuis l'extérieur.

| Ressource | Type | Rôle |
|-----------|------|------|
| `shoplite_net` | network (bridge) | Communication inter-services |
| `shoplite_pgdata` | volume nommé | Persistance des données PostgreSQL |

---

## Pipeline CI/CD

### CI (`ci.yml`) — déclenché sur push/PR vers `main` et `develop`

| Étape | Outil | Seuil |
|-------|-------|-------|
| Lint | ESLint | 0 erreur |
| Format | Prettier | 0 diff |
| Audit | npm audit | niveau moderate |
| Tests + coverage | Jest | 80 % branches/functions/lines/statements |
| Scan sécurité image | Trivy | — |

### CD (`cd.yml`) — déclenché si CI verte

1. **Build** — image Docker taguée `sha-<7 chars>`
2. **Staging** — déploiement port 8081, smoke tests, teardown
3. **Production** — déploiement port 80, smoke tests, tag `stable` si succès
4. **Rollback automatique** — retour au tag `stable` si la prod échoue

---

## Limites de ressources

| Service  | Mémoire | CPU  |
|----------|---------|------|
| db       | 512 Mo  | 0.5  |
| api      | 256 Mo  | 0.5  |
| frontend | 128 Mo  | 0.25 |
| proxy    | 64 Mo   | 0.25 |

---

## Flux d'une requête

```text
Client HTTP
    └── proxy:80 (ou 8080/8081 selon env)
            ├── /api/*  → api:3000 → PostgreSQL:5432
            └── /*      → frontend:80
```
