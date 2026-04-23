#!/usr/bin/env bash
set -euo pipefail

HOST="${PGHOST:-localhost}"
PORT="${PGPORT:-5432}"

if pg_isready -h "$HOST" -p "$PORT" >/dev/null 2>&1; then
  exit 0
fi

echo "PostgreSQL is not accepting connections on ${HOST}:${PORT}. Attempting to start it..."

if command -v brew >/dev/null 2>&1; then
  SERVICE_NAME="$(brew services list | awk '/postgresql/ {print $1; exit}')"
  if [[ -n "${SERVICE_NAME}" ]]; then
    brew services start "${SERVICE_NAME}" >/dev/null 2>&1 || true
  fi
fi

ATTEMPTS=0
MAX_ATTEMPTS=20
until pg_isready -h "$HOST" -p "$PORT" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [[ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]]; then
    echo "Failed to connect to PostgreSQL on ${HOST}:${PORT}."
    echo "Please ensure PostgreSQL is running, then retry."
    exit 1
  fi
  sleep 1
done

echo "PostgreSQL is ready on ${HOST}:${PORT}."
