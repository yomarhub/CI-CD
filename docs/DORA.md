# Indicateurs DORA

Les métriques DORA (DevOps Research and Assessment) mesurent la performance d'une équipe DevOps selon 4 indicateurs clés. Ce fichier les documente pour le projet ShopLite dans le cadre du TP.

---

## Les 4 métriques

### 1. Deployment Frequency — Fréquence de déploiement

> À quelle fréquence l'équipe déploie-t-elle en production ?

**Valeur observée :** Plusieurs fois par session de TP (déclenchement automatique à chaque push sur `main` validé par la CI).

**Fonctionnement dans ShopLite :**
Le workflow `cd.yml` se déclenche automatiquement dès que la CI est verte. Chaque push sur `main` qui passe lint + tests + audit déclenche un déploiement en staging puis en production sans intervention manuelle.

| Niveau DORA | Fréquence |
|-------------|-----------|
| Elite       | Plusieurs fois par jour |
| High        | Entre une fois par jour et une fois par semaine |
| Medium      | Entre une fois par semaine et une fois par mois |
| Low         | Moins d'une fois par mois |

**Positionnement ShopLite :** `Elite` — déploiement continu à chaque merge validé.

---

### 2. Lead Time for Changes — Délai de mise en production

> Combien de temps s'écoule entre un commit et son déploiement en production ?

**Valeur observée :** ~10 à 15 minutes

**Décomposition du pipeline :**

| Étape | Durée estimée |
|-------|---------------|
| CI : lint + audit + tests + trivy | ~4 min |
| CD : build image Docker | ~3 min |
| CD : déploiement staging + smoke tests | ~2 min |
| CD : déploiement production + smoke tests + tag `stable` | ~2 min |
| **Total** | **~10-15 min** |

**Positionnement ShopLite :** `Elite` (< 1 heure).

---

### 3. Change Failure Rate — Taux d'échec des déploiements

> Quel pourcentage des déploiements provoque une défaillance en production ?

**Valeur observée dans le TP :** 1 incident sur ~6 déploiements ≈ **~17 %**

**Incident enregistré :**

| # | Date | Description | Détecté par |
|---|------|-------------|-------------|
| 1 | 2026-06-15 | Colonne SQL `name_BROKEN` — `GET /api/products` retourne 500 | Test Jest automatisé |

**Positionnement ShopLite :** `Medium` (entre 15 % et 30 %) — ce taux est élevé car l'incident a été **volontairement provoqué** dans le cadre du TP. En conditions réelles, les tests automatisés et la CI auraient bloqué ce déploiement avant la prod.

> **Note :** La CI a bien détecté l'incident (test rouge). Le workflow CD intègre un rollback automatique vers le tag `stable` en cas d'échec prod, ce qui limite l'impact réel.

---

### 4. MTTR — Mean Time to Recovery (Temps moyen de récupération)

> Combien de temps faut-il pour rétablir le service après une défaillance ?

**Valeur observée :** ~5 minutes

**Déroulé de la récupération (incident #6) :**

| Étape | Action | Durée |
|-------|--------|-------|
| Détection | Test Jest échoue, CI rouge | immédiat |
| Diagnostic | `git diff` + `docker compose logs api` | ~1 min |
| Correction | `git revert HEAD --no-edit` + push | ~1 min |
| Redéploiement | `docker compose up -d --build` | ~3 min |
| Vérification | Tests verts + données intactes | ~1 min |
| **Total** | | **~5-6 min** |

**Positionnement ShopLite :** `Elite` (< 1 heure).

Points clés ayant permis ce MTTR bas :

- Volume PostgreSQL non supprimé → données intactes
- Tag `stable` disponible pour rollback immédiat
- Rollback automatique intégré dans `cd.yml`
- Logs JSON structurés avec `request_id` facilitant le diagnostic

---

## Synthèse

| Métrique | Valeur TP | Niveau DORA |
|----------|-----------|-------------|
| Deployment Frequency | Plusieurs fois/jour | Elite |
| Lead Time for Changes | ~10-15 min | Elite |
| Change Failure Rate | ~17 % (incident volontaire) | Medium |
| MTTR | ~5-6 min | Elite |

Le taux d'échec `Medium` est artificiellement élevé en raison de l'incident contrôlé du TP. La présence de tests automatisés, d'un rollback intégré et de logs structurés place ce projet dans une posture `Elite` sur les 3 autres métriques.
