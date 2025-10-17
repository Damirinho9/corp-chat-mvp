# Миграция с SQLite → Postgres

## Вариант A - локально (без Docker)
1) Запусти Postgres и создай базу `corpchat`.
2) Установи переменную окружения:
```
# bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/corpchat?schema=public"
# PowerShell
$env:DATABASE_URL="postgresql://user:pass@localhost:5432/corpchat?schema=public"
```
3) Синхронизируй схему и собери проект:
```
npx prisma generate --schema=prisma/schema.postgres.prisma
npx prisma db push --schema=prisma/schema.postgres.prisma
node scripts/seed.cjs
npm run build
npm run start:prod
```

## Вариант B - Docker Compose (prod)
```
cp .env.prod.example .env
docker compose -f docker-compose.prod.yml up --build
```
- Backend: http://localhost:3000
- Adminer: http://localhost:8080 (сервер db, креды из .env)
