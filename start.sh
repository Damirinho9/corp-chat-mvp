#!/bin/sh
set -e

echo "=== ENV VARS ==="
env | grep -E "DATABASE|POSTGRES|PORT|NODE_ENV"
echo "================"

# 1️⃣ дём DATABASE_URL
echo "\033[1;34m[init]\033[0m Waiting for DATABASE_URL..."
for i in \seq 1 30\; do
  if [ -n "\" ]; then
    echo "\033[1;32m[ok]\033[0m DATABASE_URL found: \"
    break
  fi
  echo "  Attempt \/30: still waiting..."
  sleep 2
done

if [ -z "\" ]; then
  echo "\033[1;31m[error]\033[0m DATABASE_URL not found after 60s, exiting."
  exit 1
fi

# 2️⃣ енерация клиента Prisma
echo "\033[1;34m[init]\033[0m Generating Prisma client..."
npx prisma generate --schema=prisma/schema.postgres.prisma

# 3️⃣ играции с fallback
echo "\033[1;34m[init]\033[0m Applying database migrations..."
if npx prisma migrate deploy --schema=prisma/schema.postgres.prisma; then
  echo "\033[1;32m[ok]\033[0m Migrations applied successfully."
else
  echo "\033[1;33m[warn]\033[0m migrate deploy failed — trying db push..."
  npx prisma db push --schema=prisma/schema.postgres.prisma --skip-generate
fi

# 4️⃣ Сид базы (С: прямой вызов seed.cjs)
echo "\033[1;34m[init]\033[0m Running database seed..."
if node scripts/seed.cjs; then
  echo "\033[1;32m[ok]\033[0m Seed completed."
else
  echo "\033[1;33m[warn]\033[0m Seed failed or already applied."
fi

# 5️⃣ опируем UI-шаблоны
if [ -d "src/ui/views" ]; then
  echo "\033[1;34m[init]\033[0m Copying UI templates..."
  mkdir -p dist/src/ui/views
  cp -r src/ui/views/* dist/src/ui/views/ || true
fi

# 6️⃣ Старт приложения
echo "\033[1;32m[ok]\033[0m Database ready, starting application..."
exec node dist/main.js
