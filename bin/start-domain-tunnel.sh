#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH='' cd -- "$(dirname "$0")/.." && pwd)"
TOOLS_DIR="${ROOT_DIR}/.tools"
BIN_PATH="${TOOLS_DIR}/cloudflared"
ENV_FILE="${ROOT_DIR}/.cloudflared-domain.env"
PID_FILE="${ROOT_DIR}/.cloudflared-domain.pid"
URL_FILE="${ROOT_DIR}/.cloudflared-domain.url"
LOG_FILE="${ROOT_DIR}/logs/cloudflared-domain.log"

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

if [ ! -f "${ENV_FILE}" ]; then
  printf 'Missing %s\n' "${ENV_FILE}" >&2
  printf 'Create it first, for example:\n' >&2
  printf '  cp .cloudflared-domain.env.example .cloudflared-domain.env\n' >&2
  exit 1
fi

if [ ! -x "${BIN_PATH}" ]; then
  download_cloudflared
fi

set -a
. "${ENV_FILE}"
set +a

: "${CLOUDFLARE_TUNNEL_TOKEN:?CLOUDFLARE_TUNNEL_TOKEN is required}"

CLOUDFLARE_TUNNEL_HOSTNAME="${CLOUDFLARE_TUNNEL_HOSTNAME:-gmapi.fun}"
TUNNEL_TARGET="${TUNNEL_TARGET:-http://127.0.0.1:3000}"
PUBLIC_URL="https://${CLOUDFLARE_TUNNEL_HOSTNAME}"

mkdir -p "${ROOT_DIR}/logs"

if [ -f "${PID_FILE}" ] && kill -0 "$(cat "${PID_FILE}")" 2>/dev/null; then
  printf 'A named tunnel is already running for %s\n' "${PUBLIC_URL}"
  exit 0
fi

rm -f "${PID_FILE}" "${URL_FILE}" "${LOG_FILE}"
printf '%s\n' "${PUBLIC_URL}" > "${URL_FILE}"

nohup "${BIN_PATH}" tunnel --no-autoupdate run --token "${CLOUDFLARE_TUNNEL_TOKEN}" > "${LOG_FILE}" 2>&1 &
printf '%s\n' "$!" > "${PID_FILE}"

attempt=0
while [ "${attempt}" -lt 60 ]; do
  pid="$(cat "${PID_FILE}")"
  if ! kill -0 "${pid}" 2>/dev/null; then
    printf 'cloudflared exited unexpectedly. Recent log:\n' >&2
    tail -n 50 "${LOG_FILE}" >&2 || true
    exit 1
  fi

  if curl -fsS "${PUBLIC_URL}/api/status" >/dev/null 2>&1; then
    printf 'Named tunnel is live at %s\n' "${PUBLIC_URL}"
    exit 0
  fi

  sleep 1
  attempt=$((attempt + 1))
done

printf 'Tunnel process started, but %s is not reachable yet.\n' "${PUBLIC_URL}"
printf 'Check these items:\n'
printf '  1. gmapi.fun has finished switching to Cloudflare nameservers\n'
printf '  2. The tunnel in Cloudflare dashboard has a public hostname for %s -> %s\n' "${CLOUDFLARE_TUNNEL_HOSTNAME}" "${TUNNEL_TARGET}"
printf '  3. The tunnel token in %s is correct\n' "${ENV_FILE}"
printf 'Recent cloudflared log:\n'
tail -n 30 "${LOG_FILE}" || true
exit 1
