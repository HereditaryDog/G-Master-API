#!/usr/bin/env sh
set -eu

if [ "${1:-}" = "" ]; then
  printf 'Usage: %s <backup-file.sql>\n' "$0" >&2
  exit 1
fi

backup_path="$1"

if [ ! -f "${backup_path}" ]; then
  printf 'Backup file not found: %s\n' "${backup_path}" >&2
  exit 1
fi

docker compose exec -T g-master-api-postgres \
  psql -U "${POSTGRES_USER:-gmaster}" "${POSTGRES_DB:-g_master_api}" < "${backup_path}"

printf 'PostgreSQL restore completed from %s\n' "${backup_path}"
