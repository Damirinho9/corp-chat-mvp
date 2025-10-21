#!/bin/sh
set -e

echo "=== ENV VARS ==="
env | grep -E "DATABASE|POSTGRES|PORT|NODE_ENV"
echo "================"

# Ждём DATABASE_URL
echo "[init] Waiting for DATABASE_URL..."
for i in $(seq 1 30); do
  if [ -n "$DATABASE_URL" ]; then
    echo "[ok] DATABASE_URL found: $DATABASE_URL"
    break
  fi
  echo "  Attempt $i/30: still waiting..."
  sleep 2
done

if [ -z "$DATABASE_URL" ]; then
  echo "[error] DATABASE_URL not found after 60s, exiting."
  exit 1
fi

# Генерация клиента Prisma
echo "[init] Generating Prisma client..."
npx prisma generate --schema=prisma/schema.postgres.prisma

# Миграции с fallback
echo "[init] Applying database migrations..."
if npx prisma migrate deploy --schema=prisma/schema.postgres.prisma; then
  echo "[ok] Migrations applied successfully."
else
  echo "[warn] migrate deploy failed - trying db push..."
  npx prisma db push --schema=prisma/schema.postgres.prisma --skip-generate
fi

# Сид базы
echo "[init] Running database seed..."
if node scripts/seed.cjs; then
  echo "[ok] Seed completed."
else
  echo "[warn] Seed failed or already applied."
fi

# Копируем UI-шаблоны
if [ -d "src/ui/views" ]; then
  echo "[init] Copying UI templates..."
  mkdir -p dist/src/ui/views
  cp -r src/ui/views/* dist/src/ui/views/ || true
fi

# Старт приложения
echo "[ok] Database ready, starting application..."
exec node dist/main.js
