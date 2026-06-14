#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
USER="${POSTGRES_USER:-shoplite}"
TEMP_DB="restore_test_$(date +%s)"

# Détecte le container postgres en cours d'exécution
DB_CONTAINER="${DB_CONTAINER:-$(docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Names}}" | head -1)}"

if [ -z "$DB_CONTAINER" ]; then
  echo "[restore-test] Aucun container postgres en cours d'exécution." >&2
  exit 1
fi

# Utilise le dump passé en argument ou le plus récent
DUMP="${1:-$(ls -1t "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | head -1)}"

if [ -z "$DUMP" ]; then
  echo "[restore-test] Aucun dump trouvé dans $BACKUP_DIR" >&2
  exit 1
fi

echo "[restore-test] Container : $DB_CONTAINER"
echo "[restore-test] Dump      : $DUMP"
echo "[restore-test] Base temp : $TEMP_DB"

# Créer la base temporaire
docker exec -i "$DB_CONTAINER" psql -U "$USER" -c "CREATE DATABASE $TEMP_DB;"

# Restaurer le dump
gunzip -c "$DUMP" | docker exec -i "$DB_CONTAINER" psql -U "$USER" -d "$TEMP_DB" -q

# Vérification : lister les tables restaurées
echo "[restore-test] Tables restaurées :"
docker exec -i "$DB_CONTAINER" psql -U "$USER" -d "$TEMP_DB" -c "\dt"

# Nettoyage
docker exec -i "$DB_CONTAINER" psql -U "$USER" -c "DROP DATABASE $TEMP_DB;"

echo "[restore-test] Restauration validée. Base temporaire supprimée."
