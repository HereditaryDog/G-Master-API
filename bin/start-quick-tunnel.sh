#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="${ROOT_DIR}/.tools"
BIN_PATH="${TOOLS_DIR}/cloudflared"
PID_FILE="${ROOT_DIR}/.cloudflared.pid"
URL_FILE="${ROOT_DIR}/.cloudflared.url"
LOG_FILE="${ROOT_DIR}/logs/cloudflared.log"
TUNNEL_TARGET="${TUNNEL_TARGET:-http://127.0.0.1:3000}"

download_cloudflared() {
  os="$(uname -s)"
  arch="$(uname -m)"

  case "${os}-${arch}" in
    Darwin-arm64)
      archive_name="cloudflared-darwin-arm64.tgz"
      ;;
    Darwin-x86_64)
      archive_name="cloudflared-darwin-amd64.tgz"
      ;;
    Linux-x86_64)
      archive_name="cloudflared-linux-amd64.tgz"
      ;;
    Linux-aarch64|Linux-arm64)
      archive_name="cloudflared-linux-arm64.tgz"
      ;;
    *)
      printf 'Unsupported platform for auto-download: %s-%s\n' "${os}" "${arch}" >&2
      exit 1
      ;;
  esac

  mkdir -p "${TOOLS_DIR}"
  archive_path="${TOOLS_DIR}/${archive_name}"
  curl -L --fail --silent --show-error \
    -o "${archive_path}" \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/${archive_name}"
  tar -xzf "${archive_path}" -C "${TOOLS_DIR}"
  chmod +x "${BIN_PATH}"
}

if [ ! -x "${BIN_PATH}" ]; then
  download_cloudflared
fi

mkdir -p "${ROOT_DIR}/logs"

if [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
  printf 'A quick tunnel is already running. URL: '
  if [ -f "${URL_FILE}" ]; then
    cat "${URL_FILE}"
  else
    printf 'pending\n'
  fi
  exit 0
fi

rm -f "${PID_FILE}" "${URL_FILE}" "${LOG_FILE}"

nohup "${BIN_PATH}" tunnel --no-autoupdate --url "${TUNNEL_TARGET}" > "${LOG_FILE}" 2>&1 &
printf '%s\n' "$!" > "${PID_FILE}"

attempt=0
while [ "${attempt}" -lt 60 ]; do
  if grep -Eo 'https://[-a-z0-9]+\.trycloudflare\.com' "${LOG_FILE}" | tail -n 1 > "${URL_FILE}.tmp" 2>/dev/null && [ -s "${URL_FILE}.tmp" ]; then
    mv "${URL_FILE}.tmp" "${URL_FILE}"
    printf 'Quick tunnel URL: '
    cat "${URL_FILE}"
    exit 0
  fi

  if ! kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
    printf 'cloudflared exited unexpectedly. Recent log:\n' >&2
    tail -n 50 "${LOG_FILE}" >&2 || true
    exit 1
  fi

  sleep 1
  attempt=$((attempt + 1))
done

printf 'Timed out while waiting for the public tunnel URL.\n' >&2
tail -n 50 "${LOG_FILE}" >&2 || true
exit 1
