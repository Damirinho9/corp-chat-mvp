#!/bin/sh
set -e

echo "Waiting for DATABASE_URL..."
while [ -z "$DATABASE_URL" ]; do
  echo "Still waiting..."
  sleep 2
done

echo "DATABASE_URL=$DATABASE_URL"
npx prisma generate --schema=prisma/schema.postgres.prisma
npx prisma migrate deploy --schema=prisma/schema.postgres.prisma

echo "Starting app..."
node dist/main.js