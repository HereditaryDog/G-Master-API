# New API v1.0.0-rc.10 Upgrade Inventory

Inventory date: 2026-06-09

## Sources

- Upstream latest release: https://github.com/QuantumNous/new-api/releases/tag/v1.0.0-rc.10
- Upstream compare: https://github.com/QuantumNous/new-api/compare/v1.0.0-rc.8...v1.0.0-rc.10
- Current G-Master baseline: `v1.0.0-rc.8-GM.2` at `6c80734e0`
- Upstream rc.8 commit: `b9bc6f0e2`
- Upstream rc.9 commit: `5bc4c7481`
- Upstream rc.10 commit: `74985fa87`
- Observed unreleased upstream main delta: 60 commits after `v1.0.0-rc.10` at fetch time.

## Upstream rc.10 Delta

`v1.0.0-rc.10` is the latest published upstream release. It covers the upstream delta from `v1.0.0-rc.8` through `v1.0.0-rc.10`.

Main release themes:

- UI polish for the default frontend, including theme presets, larger scale options, table density, dark-mode charts, and mobile usage-log scanning.
- Channel create/edit drawer refactor with modular sections and improved model mapping controls.
- Usage-log filtering fixes: exact filters stay exact unless wildcard matching is explicit.
- Relay reliability fixes:
  - image relay quality parameter handling;
  - Gemini-to-Claude tool-use conversion;
  - concurrent tool-call key collisions;
  - oversized upstream error log truncation;
  - memory reduction for large base64 relay requests.
- Channel behavior fixes:
  - auto-disabled multi-key channels are evicted from cache;
  - duplicate channel action toasts are prevented;
  - channel tests use the actual user id.
- Payment and subscription changes:
  - subscription balance purchases;
  - Waffo settings save flow consolidation;
  - classic Waffo Pancake settings cleanup;
  - webhook processing reliability.
- System settings fixes:
  - unsaved-change detection;
  - numeric input `NaN` prevention;
  - more compact settings layouts.

## File-Level Shape

The `v1.0.0-rc.8...v1.0.0-rc.10` diff touches about 302 files, heavily weighted toward upstream's `web/default` tree:

- `web/default`: 262 changed files.
- Backend relay and model/controller/service files: selected focused changes.
- Waffo, subscription, log, channel, and user models/controllers overlap with G-Master custom code.

Important local note: current G-Master production Dockerfile builds `web/`, not upstream `web/default/`. Therefore upstream `web/default` changes must be treated as a reference source and selectively mapped into the current G-Master frontend. Do not wholesale copy the upstream frontend tree.

## Local Conflict And Preservation Areas

Preserve these G-Master behaviors while porting:

- G-Master public branding, logo metadata, homepage, footer alignment, and Gaster Code download/detail page.
- Gaster Code OAuth/login/register intent flow.
- Gaster Code account-center APIs:
  - `/api/gaster-code/me`
  - `/api/gaster-code/provider-token`
  - `/api/gaster-code/billing/*`
  - `/api/gaster-code/subscription/*`
- Async image-generation job API and timeout retry behavior.
- Machine-readable auth and image-generation errors.
- Payment compliance gates and current production-compatible Waffo signed HTTP flow.
- Model-health usage-log fallback and active-group filtering fixes.
- Cross-database compatibility for SQLite, MySQL, and PostgreSQL.

High-overlap files that need manual review:

- `router/api-router.go`
- `controller/subscription.go`
- `controller/topup_waffo_pancake.go`
- `controller/subscription_payment_waffo_pancake.go`
- `controller/channel-test.go`
- `controller/user.go`
- `model/subscription.go`
- `model/log.go`
- `model/channel.go`
- `model/user.go`
- `relay/common/override.go`
- `relay/common/relay_info.go`
- `relay/channel/gemini/relay-gemini.go`
- `relay/channel/claude/relay-claude.go`
- `relay/image_handler.go`
- `service/waffo_pancake.go`
- `service/error.go`
- `web/src/**`
- `web/package.json`
- `web/bun.lock`

## Recommended Scope

Target release: `v1.0.0-rc.10-GM.1`

Include in this pass:

- Backend relay correctness and memory fixes.
- Usage-log exact-filter behavior and upstream error truncation.
- Channel cache/test/toast fixes that apply to the current admin UI.
- Subscription balance-purchase behavior if it can coexist with G-Master wallet and Gaster Code billing APIs.
- Waffo settings save reliability without replacing the current production payment flow.
- System settings numeric/dirty-state fixes where they map to current `web/`.
- Carefully selected frontend UX improvements for channel editor and usage logs.

Defer unless explicitly requested:

- Unreleased `upstream/main` commits after `v1.0.0-rc.10`.
- Wholesale upstream `web/default` adoption.
- Large frontend architecture rewrites that do not directly improve the current production UI.
- Removing or renaming existing G-Master public pages, routes, or branded copy.

## Post-rc.10 Watchlist

Unreleased upstream main currently includes potentially useful changes, but they should be evaluated separately:

- OpenAI images API streaming image relay and image edit support.
- Six-decimal pricing editor steps.
- Stream scanner buffer reuse.
- Narrowed OpenAI o-series adaptation scope.
- Request body limit middleware updates.
- Multiple dialog/layout changes in upstream `web/default`.

## Verification Matrix

Backend:

```bash
go test ./...
```

Frontend:

```bash
cd web
bun run build
bun run i18n:lint
```

Static checks:

```bash
git diff --check
git status --short --branch
```

Browser checks:

- Homepage and Gaster Code page still show G-Master branding and current Gaster Code download/link flow.
- Admin channel editor/test flows still work.
- Usage logs exact filter behavior matches the selected filter value.
- Subscription and wallet flows still show G-Master data and Gaster Code related records.
- System settings save/dirty state works for numeric fields.
- Model health panel still populates from usage logs after real calls.

