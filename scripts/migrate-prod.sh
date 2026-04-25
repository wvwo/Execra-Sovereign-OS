#!/bin/bash
echo "⚠️  Running production migration..."
echo "📦 Creating backup first..."
./scripts/backup-db.sh

echo "🔄 Running migrations..."
docker compose exec backend npx prisma migrate deploy

echo "✅ Migration complete"
docker compose exec backend npx prisma db seed 2>/dev/null || echo "No seed needed"
