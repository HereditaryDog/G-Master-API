#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)"
URL_FILE="${ROOT_DIR}/.cloudflared.url"

if [ "${1:-}" != "" ]; then
  base_url="$1"
elif [ -f "${URL_FILE}" ]; then
  base_url="$(cat "${URL_FILE}")"
else
  printf 'Usage: %s <public-url>\n' "$0" >&2
  printf 'Or start a tunnel first with ./bin/start-quick-tunnel.sh\n' >&2
  exit 1
fi

status_body="$(curl -fsS "${base_url}/api/status")"
printf '%s\n' "${status_body}" | grep -q '"success":true'

home_body="$(curl -fsS "${base_url}")"
printf '%s\n' "${home_body}" | grep -q 'G-Master API'

printf 'Public smoke test passed for %s\n' "${base_url}"
