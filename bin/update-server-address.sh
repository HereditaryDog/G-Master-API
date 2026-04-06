#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)"

if [ "${1:-}" = "" ]; then
  printf 'Usage: %s <public-url>\n' "$0" >&2
  printf 'Example: %s https://gmapi.fun\n' "$0" >&2
  exit 1
fi

PUBLIC_URL="$1"

if [ ! -f "${ROOT_DIR}/.env" ]; then
  printf 'Missing %s/.env\n' "${ROOT_DIR}" >&2
  exit 1
fi

set -a
. "${ROOT_DIR}/.env"
set +a

: "${POSTGRES_USER:?POSTGRES_USER is required in .env}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD is required in .env}"
: "${POSTGRES_DB:?POSTGRES_DB is required in .env}"

docker exec \
  -e PGPASSWORD="${POSTGRES_PASSWORD}" \
  g-master-api-postgres \
  psql -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" \
  -c "UPDATE options SET value='${PUBLIC_URL}' WHERE key='ServerAddress';"

docker compose -f "${ROOT_DIR}/docker-compose.yml" restart g-master-api >/dev/null

printf 'Updated ServerAddress to %s and restarted g-master-api\n' "${PUBLIC_URL}"
