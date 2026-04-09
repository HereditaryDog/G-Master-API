#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="$(tr -d '\n' < "$ROOT_DIR/VERSION")"
BASE_URL="${1:-https://gmapi.fun}"
REPO_URL="${2:-https://github.com/HereditaryDog/G-Master-API}"
OUT_DIR="$ROOT_DIR/docs/apifox/dist"

PUBLIC_API_PATHS='[
  "/api/status",
  "/api/status/test",
  "/api/notice",
  "/api/about",
  "/api/home_page_content",
  "/api/pricing",
  "/api/models",
  "/api/user/register",
  "/api/user/login",
  "/api/user/login/2fa",
  "/api/user/logout",
  "/api/user/groups",
  "/api/user/self/groups",
  "/api/user/self",
  "/api/user/models",
  "/api/user/token",
  "/api/user/setting",
  "/api/user/topup",
  "/api/user/topup/info",
  "/api/user/topup/self",
  "/api/user/pay",
  "/api/user/amount",
  "/api/user/stripe/pay",
  "/api/user/stripe/amount",
  "/api/user/creem/pay",
  "/api/user/2fa/status",
  "/api/user/2fa/setup",
  "/api/user/2fa/enable",
  "/api/user/2fa/disable",
  "/api/user/2fa/backup_codes",
  "/api/user/2fa/stats",
  "/api/token/",
  "/api/token/search",
  "/api/token/{id}",
  "/api/token/batch",
  "/api/log/self/stat",
  "/api/log/self",
  "/api/log/self/search",
  "/api/data/self",
  "/api/mj/self",
  "/api/task/self"
]'

mkdir -p "$OUT_DIR"

jq \
  --arg version "$VERSION" \
  --arg base "$BASE_URL" \
  --arg repo "$REPO_URL" \
  '
  .info.title = "G-Master API - 模型中转接口"
  | .info.version = $version
  | .info.description = (
      "G-Master API 对外模型调用接口。"
      + "\n\n生产地址：`" + $base + "`"
      + "\nOpenAI 兼容基址：`" + $base + "/v1`"
      + "\n仓库地址：`" + $repo + "`"
    )
  | .servers = [
      {
        "url": $base,
        "description": "G-Master API 生产环境"
      }
    ]
  ' \
  "$ROOT_DIR/docs/openapi/relay.json" \
  > "$OUT_DIR/gmaster-relay.openapi.json"

jq \
  --arg version "$VERSION" \
  --arg base "$BASE_URL" \
  --arg repo "$REPO_URL" \
  '
  .info.title = "G-Master API - 后台与用户接口"
  | .info.version = $version
  | .info.description = (
      "G-Master API 后台管理与用户中心接口。"
      + "\n\n生产地址：`" + $base + "`"
      + "\n后台接口基址：`" + $base + "/api`"
      + "\n仓库地址：`" + $repo + "`"
    )
  | .servers = [
      {
        "url": $base,
        "description": "G-Master API 生产环境"
      }
    ]
  ' \
  "$ROOT_DIR/docs/openapi/api.json" \
  > "$OUT_DIR/gmaster-admin.openapi.json"

jq -n \
  --arg version "$VERSION" \
  --arg base "$BASE_URL" \
  --arg repo "$REPO_URL" \
  --argjson publicApiPaths "$PUBLIC_API_PATHS" \
  --slurpfile relay "$ROOT_DIR/docs/openapi/relay.json" \
  --slurpfile api "$ROOT_DIR/docs/openapi/api.json" \
  '
  def pick_paths($path_map; $allowed):
    $path_map
    | to_entries
    | map(select(.key as $path | $allowed | index($path)))
    | from_entries;

  {
    "openapi": "3.0.1",
    "info": {
      "title": "G-Master API - 公开接口文档",
      "version": $version,
      "description": (
        "适合导入 Apifox 并对外发布的公开接口集合。"
        + "\n\n包含：模型中转接口、用户侧令牌管理接口、系统状态与个人数据接口。"
        + "\n生产地址：`" + $base + "`"
        + "\nOpenAI 兼容基址：`" + $base + "/v1`"
        + "\n后台接口基址：`" + $base + "/api`"
        + "\n仓库地址：`" + $repo + "`"
      )
    },
    "servers": [
      {
        "url": $base,
        "description": "G-Master API 生产环境"
      }
    ],
    "tags": (
      (($relay[0].tags // []) + ($api[0].tags // []))
      | unique_by(.name)
    ),
    "paths": (
      ($relay[0].paths // {})
      + pick_paths(($api[0].paths // {}); $publicApiPaths)
    ),
    "components": {
      "responses": (
        ($relay[0].components.responses // {})
        + ($api[0].components.responses // {})
      ),
      "schemas": (
        ($relay[0].components.schemas // {})
        + ($api[0].components.schemas // {})
      ),
      "securitySchemes": (
        ($relay[0].components.securitySchemes // {})
        + ($api[0].components.securitySchemes // {})
      )
    }
  }
  ' \
  > "$OUT_DIR/gmaster-public.openapi.json"

python3 "$ROOT_DIR/bin/enrich-apifox-openapi.py" "$OUT_DIR/gmaster-public.openapi.json"
python3 "$ROOT_DIR/bin/enrich-apifox-openapi.py" "$OUT_DIR/gmaster-relay.openapi.json"
python3 "$ROOT_DIR/bin/enrich-apifox-openapi.py" "$OUT_DIR/gmaster-admin.openapi.json"

echo "Apifox import files generated in: $OUT_DIR"
