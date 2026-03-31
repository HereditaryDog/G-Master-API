#!/usr/bin/env sh
set -eu

output_path="${1:-backup-g-master-api.sql}"

docker compose exec -T g-master-api-postgres \
  pg_dump -U "${POSTGRES_USER:-gmaster}" "${POSTGRES_DB:-g_master_api}" > "${output_path}"

printf 'PostgreSQL backup written to %s\n' "${output_path}"
