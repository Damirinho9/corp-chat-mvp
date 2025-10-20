#!/bin/sh
set -e

echo "=== ENV VARS ==="
env | grep -E "DATABASE|POSTGRES|PORT|NODE_ENV"
echo "================"

# 1️⃣ Ждём DATABASE_URL
echo "\033[1;34m[init]\033[0m Waiting for DATABASE_URL..."
for i in $(seq 1 30); do
  if [ -n "$DATABASE_URL" ]; then
    echo "\033[1;32m[ok]\033[0m DATABASE_URL found: $DATABASE_URL"
    break
  fi
  echo "  Attempt $i/30: still waiting..."
  sleep 2
done

if [ -z "$DATABASE_URL" ]; then
  echo "\033[1;31m[error]\033[0m DATABASE_URL not found after 60s, exiting."
  exit 1
fi

# 2️⃣ Генерация клиента Prisma
echo "\033[1;34m[init]\033[0m Generating Prisma client..."
npx prisma generate --schema=prisma/schema.postgres.prisma

# 3️⃣ Миграции с fallback
echo "\033[1;34m[init]\033[0m Applying database migrations..."
if ! npx prisma migrate deploy --schema=prisma/schema.postgres.prisma; then
  echo "\033[1;33m[warn]\033[0m migrate deploy failed — trying db push..."
  npx prisma db push --schema=prisma/schema.postgres.prisma
fi

# 4️⃣ Копируем UI-шаблоны, если они есть
if [ -d "src/ui/views" ]; then
  echo "\033[1;34m[init]\033[0m Copying UI templates..."
  mkdir -p dist/src/ui/views
  cp -r src/ui/views/* dist/src/ui/views/ || true
else
  echo "\033[1;33m[warn]\033[0m No src/ui/views found, skipping copy."
fi

# 5️⃣ Старт приложения
echo "\033[1;32m[ok]\033[0m Database ready, starting application..."
node dist/main.js