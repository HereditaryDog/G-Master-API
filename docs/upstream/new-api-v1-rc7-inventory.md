# QuantumNous/new-api v1.0.0-rc.7 Upgrade Inventory

## Baseline

- Current G-Master source baseline: `v1.0.0-rc.5-GM.2`.
- Current G-Master HEAD at inventory time: `9946dc62b`.
- Implemented G-Master sync version: `v1.0.0-rc.7-GM.1`.
- Latest verified upstream release: `QuantumNous/new-api v1.0.0-rc.7`.
- Upstream `main` is ahead of `v1.0.0-rc.7` by 10 commits; those commits are evaluated as unreleased and are not automatically merged.
- Recommended sync branch: `GMaster/upstream-rc7-catchup`.
- Sync strategy: selective port, no direct full upstream merge into production.

## Release Delta

| Range | Commits | Main areas |
| --- | ---: | --- |
| `v1.0.0-rc.5..v1.0.0-rc.6` | 7 | Payment compliance, webhook availability, subscription/top-up payment surface, usage-log request tracing, audio request handling, risk acknowledgement UI. |
| `v1.0.0-rc.6..v1.0.0-rc.7` | 25 | Channel/model metadata, header navigation middleware, channel affinity refinements, relay request cleanup, stream compatibility, pricing/model display and i18n adjustments. |
| `v1.0.0-rc.7..main` | 10 | Unreleased Waffo Pancake payment/subscription work, model `owned_by` metadata tests, relay override tests, performance metric adjustments, top-up/payment follow-up fixes. |

## Local Overlap Snapshot

Already present locally:

- `service/channel_affinity.go`
- `service/waffo_pancake.go`
- `relay/common/override_test.go`
- `relay/common/relay_info.go`
- `model/model_meta.go`
- `web/src/pages/Setting/Payment/SettingsPaymentGatewayWaffoPancake.jsx`

Originally missing locally and implemented in this sync:

- `middleware/header_nav.go`
- `middleware/header_nav_test.go`
- `controller/payment_compliance.go`
- `controller/subscription_payment_waffo_pancake.go`
- `controller/model_owned_by_test.go`
- `model/model_owner_test.go`

Also reconciled in this sync:

- Waffo Pancake充值/订阅路由和 webhook 共用基础配置。
- 性能指标按有效分组过滤，并保留使用日志兜底。
- 参数覆写审计覆盖敏感来源路径。
- 渠道亲和补充 `request_header` Key 来源和前端编辑入口。
- 渠道列表分组过滤、使用日志 contains 筛选、注册开关状态、用户删除错误返回和 Debug 日志按需格式化已补齐。

## Required Lanes

| Lane | Decision |
| --- | --- |
| Header navigation/status payload | Port normalization if it preserves G-Master nav keys, including Gaster Code. |
| Payment compliance/webhook availability | Port admin-visible safety checks without exposing secrets or unused provider branding. |
| Model ownership/channel metadata | Port `owned_by` behavior and tests while preserving current model list/API contracts. |
| Usage logs/request tracing | Port only missing request tracing/filter/detail refinements; keep existing `upstream_request_id`. |
| Relay request/stream compatibility | Port low-risk fixes with relay tests, preserving explicit zero-value DTO semantics. |
| Channel affinity | Reconcile against existing G-Master implementation; add request-header key source without duplicating cache logic. |
| Waffo Pancake/subscription payments | Reconcile carefully because G-Master already has Waffo Pancake code. Test before behavior changes. |
| Performance metrics | Preserve G-Master default-on and usage-log fallback fixes from `9946dc62b`. |

## Implementation Status

| Lane | Status |
| --- | --- |
| Header navigation/status payload | Done |
| Payment compliance/webhook availability | Done |
| Model ownership/channel metadata | Done |
| Usage logs/request tracing | Done; request ID already present, contains filters reconciled |
| Relay request/stream compatibility | Done for sensitive override audit and request ID capture paths |
| Channel affinity | Done; added `request_header` key source and visual editor support |
| Waffo Pancake/subscription payments | Done |
| Performance metrics | Done |
| Channel list filters | Done; no-keyword group filter now applies to list, tag mode and type counts |
| Auth registration status | Done; `/api/status` exposes register flags and login page gates sign-up link |
| User management fixes | Done; delete errors return errors, add-user password validation added |
| Debug log performance | Done; heavy debug strings are formatted only when Debug is enabled |

## Deferred By Default

- Wholesale adoption of upstream `web/default`.
- Upstream public header/footer branding.
- Unreleased upstream `main` changes unless they fix already-adopted G-Master behavior.
- Any payment-provider behavior not covered by G-Master settings, tests, and production configuration.

## G-Master Must Preserve

- Public brand: `G-Master API`.
- Current `gmapi.fun` landing page, console, model marketplace, docs, and Gaster Code page.
- Gaster Code OAuth endpoints and token exchange response shapes.
- Gaster Code async image endpoints:
  - `POST /v1/images/generations/async`
  - `GET /v1/images/jobs/{task_id}`
- Current wallet/subscription billing semantics.
- SQLite, MySQL, PostgreSQL compatibility.
- AGPL notices and required upstream attribution.

## Verification Gates

- `go test ./... -count=1`
- `mise x bun@1.3.12 -- bun run build` in `web/`
- `git diff --check`
- Local browser smoke for `/`, `/gaster-code`, `/console`, `/console/log`, `/console/topup`, `/console/subscription`, `/console/channel`, and `/console/models`.
