#!/bin/sh
set -eu

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    echo "DATABASE_URL is required when RUN_DB_MIGRATIONS=true"
    exit 1
  fi

  echo "Running Prisma migrations..."
  npx prisma migrate deploy
fi

echo "Starting Next.js server..."
exec node server.js
