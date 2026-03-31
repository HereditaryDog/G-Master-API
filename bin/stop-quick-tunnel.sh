#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)"
PID_FILE="${ROOT_DIR}/.cloudflared.pid"
URL_FILE="${ROOT_DIR}/.cloudflared.url"

if [ ! -f "${PID_FILE}" ]; then
  printf 'No tunnel PID file found. Nothing to stop.\n'
  rm -f "${URL_FILE}"
  exit 0
fi

pid="$(cat "${PID_FILE}")"
if kill -0 "${pid}" 2>/dev/null; then
  kill "${pid}"
  printf 'Stopped quick tunnel process %s\n' "${pid}"
else
  printf 'Tunnel process %s is not running.\n' "${pid}"
fi

rm -f "${PID_FILE}" "${URL_FILE}"
