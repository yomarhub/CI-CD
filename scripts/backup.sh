#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
DB="${POSTGRES_DB:-shoplite}"
USER="${POSTGRES_USER:-shoplite}"
RETENTION="${BACKUP_RETENTION:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="backup_${DB}_${TIMESTAMP}.sql.gz"

# Détecte le container postgres en cours d'exécution
DB_CONTAINER="${DB_CONTAINER:-$(docker ps --filter "ancestor=postgres:16-alpine" --format "{{.Names}}" | head -1)}"

if [ -z "$DB_CONTAINER" ]; then
  echo "[backup] Aucun container postgres en cours d'exécution." >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[backup] Container: $DB_CONTAINER | Base: $DB | Fichier: $FILENAME"

docker exec -i "$DB_CONTAINER" \
  pg_dump -U "$USER" "$DB" \
  | gzip > "$BACKUP_DIR/$FILENAME"

SIZE=$(du -sh "$BACKUP_DIR/$FILENAME" | cut -f1)
echo "[backup] Dump créé: $BACKUP_DIR/$FILENAME ($SIZE)"

# Rétention : on garde les $RETENTION derniers dumps
COUNT=$(ls -1 "$BACKUP_DIR"/backup_*.sql.gz 2>/dev/null | wc -l)
if [ "$COUNT" -gt "$RETENTION" ]; then
  TO_DELETE=$((COUNT - RETENTION))
  ls -1t "$BACKUP_DIR"/backup_*.sql.gz | tail -n "$TO_DELETE" | xargs rm -f
  echo "[backup] Rétention: $TO_DELETE ancien(s) dump(s) supprimé(s), $RETENTION conservé(s)"
fi

echo "[backup] Terminé."
