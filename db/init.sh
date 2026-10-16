#!/bin/bash
# db/init.sh — Initialise PostgreSQL schema and seed data
# Run automatically by docker-compose on first start via POSTGRES_INITDB_ARGS

set -e
echo "▶ Running schema.sql..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/schema.sql
echo "▶ Running seed.sql..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seed.sql
echo "✅ Database initialised with schema and 300 synthetic complaints."
