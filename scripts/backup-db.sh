#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Use environment variables for DB credentials
# Assuming they are exported or available in the shell context
docker compose exec -T postgres pg_dump \
  -U autopilot \
  -d autopilot \
  --no-password \
  | gzip > "$BACKUP_DIR/execra_$TIMESTAMP.sql.gz"

echo "✅ Backup saved: execra_$TIMESTAMP.sql.gz"

# Delete backups older than 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
