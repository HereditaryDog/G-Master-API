# QuantumNous/new-api v1.0.0-rc.5 Upgrade Inventory

## Baseline

- Current G-Master upstream baseline: `QuantumNous/new-api v0.13.2`.
- Target inspected upstream release: `QuantumNous/new-api v1.0.0-rc.5`.
- Current G-Master sync branch: `GMaster/upstream-v1-rc-sync`.
- Sync strategy: selective port first; no direct full upstream merge into production.

## Release Train

| Upstream release | Published | Main theme |
| --- | --- | --- |
| `v0.13.2` | 2026-04-27 | Current G-Master upstream baseline. |
| `v1.0.0-alpha.1` | 2026-04-28 | One tiered-pricing rendering fix. |
| `v1.0.0-rc.1` | 2026-04-29 | New v1 default frontend, rebuilt admin experience, visual channel editor. |
| `v1.0.0-rc.2` | 2026-04-30 | Classic/default frontend switch, Vertex gateway base URL fix, email binding and API-key group fixes. |
| `v1.0.0-rc.3` | 2026-05-06 | Model rankings, performance visibility, default UI pricing/settings refresh. |
| `v1.0.0-rc.4` | 2026-05-06 | OpenAI image-edit reference preservation and model performance badges. |
| `v1.0.0-rc.5` | 2026-05-12 | Dashboard performance health, DeepChat deeplink, default UI/wallet/playground/ratio regressions. |

## Raw Delta

```text
v0.13.2..v1.0.0-rc.5
63 commits
1424 files changed, 205141 insertions(+), 1308 deletions(-)
```

Directory concentration:

```text
1336 web
  19 controller
  14 .agents
   9 relay
   6 model
   5 service
   4 .github
   3 setting
   3 router
   3 pkg
   2 dto
   2 common
```

Main risk: the update is dominated by upstream frontend architecture changes (`web/classic` and `web/default`). The first G-Master production pass should keep the current `web/src` production frontend and port only compatible fixes.

## Required Production-Safe Ports

| Area | Upstream references | G-Master decision |
| --- | --- | --- |
| Explicit reasoning forwarding | `dto/openai_request.go`, commit `8ca103342` | Port if the request type preserves empty reasoning values without violating JSON wrapper rules. |
| OpenAI image edit references | `dto/openai_image.go`, commit `38a3314b9` | Port because Gaster Code image workflows depend on Images compatibility. |
| Vertex gateway base URL | `relay/channel/vertex/*`, `relay/channel/task/vertex/adaptor.go`, commits `987b7ecd2` and `5114ad067` | Port if existing Vertex behavior and tests remain compatible. |
| API-key group behavior | `controller/channel.go`, `model/channel.go`, commit `2f8637048` | Port only after checking Gaster Code VIP key assignment remains intact. |
| Ratio and quota display | `service/quota.go`, `service/text_quota.go`, commit `7fe896d2f` | Port backend behavior first; port frontend display only where it maps to current `web/src`. |
| Top-up gateway flags | `controller/topup.go`, wallet frontend, commit `3057f04a1` | Inspect for compatibility; port only if current wallet UI depends on the old status payload. |

## Optional Feature Lanes

| Feature | Upstream files | Gate |
| --- | --- | --- |
| Performance metrics | `pkg/perf_metrics/*`, `model/perf_metric.go`, `controller/perf_metrics.go` | Enable only after SQLite/MySQL/PostgreSQL migration checks and settings gating. |
| Rankings | `model/usedata_rankings.go`, `service/rankings.go`, `controller/rankings.go` | Enable only after performance metrics data quality is verified. |
| Video task support | `controller/task_video.go`, `model/task.go`, `constant/task.go` | Defer until G-Master async image jobs and task states are reconciled. |
| New default frontend | `web/default/**` | Separate product/design decision; not included in the first production sync. |
| Upstream agent skills | `.agents/**` | Do not port into production unless there is a concrete repo workflow need. |

## Frontend Boundary

First pass:

- Keep G-Master production frontend at current `web/src`.
- Do not rename current frontend to `web/classic`.
- Do not introduce upstream `web/default` into production routing.
- Only port small current-frontend fixes that map cleanly to existing pages.

Potential later pass:

- Evaluate upstream `web/default` as a new product track.
- Rebuild G-Master branding, Gaster Code page, footer, OAuth pages, docs pages, and i18n on top of the new frontend before any production switch.

## G-Master Must Preserve

- Public brand: `G-Master API`.
- Current `gmapi.fun` landing page, console, model marketplace, docs, and Gaster Code page.
- Gaster Code OAuth endpoints and token exchange response shapes.
- Gaster Code async image-job endpoints:
  - `POST /v1/images/generations/async`
  - `GET /v1/images/jobs/{task_id}`
- Existing Chinese-first product copy and current logo metadata.
- SQLite, MySQL, and PostgreSQL compatibility.
- AGPL notices and upstream attribution.

## Applied Decisions

- Ported explicit reasoning forwarding, OpenAI image-edit reference fields, and Vertex gateway URL compatibility with targeted tests.
- Ported channel table server-side sorting into the backend and the current `web/src` classic channel table, without adopting upstream `web/default`.
- Kept upstream `web/default` API-key default-group and token ratio display fixes out of this pass because production still uses `web/src`; G-Master's current Gaster Code provider token group behavior is covered by service tests, and the current token table already loads group ratio data.
- Deferred performance metrics, rankings, and video-task lanes to later passes because they need schema, data-quality, and product-surface review before production use.

## Verification Gates

- `mise x bun@1.3.12 -- bun run build` in `web/`.
- `GOPROXY=https://goproxy.cn,direct go test ./... -count=1`.
- Targeted backend tests for relay DTO, image edit, Vertex, quota, channel group behavior, and Gaster Code auth/API key grouping.
- Local browser smoke for `/`, `/gaster-code`, `/console`, model pricing, and usage logs before production.

## Current Baseline Verification

Completed before starting ports:

```text
GOPROXY=https://goproxy.cn,direct go mod download
mise x bun@1.3.12 -- bun install
mise x bun@1.3.12 -- bun run build
GOPROXY=https://goproxy.cn,direct go test ./... -count=1
```

Notes:

- Plain `bun` is currently blocked by the local `mise` shim because no global Bun version is configured.
- `mise x bun@1.3.12 -- bun ...` works without changing global tool configuration.
- The first `go test ./...` failed only because fresh worktrees do not contain `web/dist`; after frontend build, the full Go test suite passed.
