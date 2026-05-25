# New API v1.0.0-rc.8 Upgrade Inventory

Inventory date: 2026-05-25

## Sources

- Upstream release: https://github.com/QuantumNous/new-api/releases/tag/v1.0.0-rc.8
- Upstream compare: https://github.com/QuantumNous/new-api/compare/v1.0.0-rc.7...v1.0.0-rc.8
- Upstream tag SHA: `255bec2c3c9c7465b3f45e2dd9af73aed07c190a`
- Current G-Master baseline: `v1.0.0-rc.7-GM.2` at `3c407e0fd`
- Local upstream snapshot used for review: `/tmp/new-api-rc8-src`

## Upstream rc.8 Delta

Upstream rc.8 is 12 commits ahead of rc.7:

| Commit | Area | Summary |
| --- | --- | --- |
| `0d4b25795` | Relay overrides | Expose param override audits for sensitive message fields. |
| `2d1ca1538` | Dashboard | Respect dashboard content visibility settings. |
| `20d3e7373` | Performance metrics | Filter perf metric summaries by active groups. |
| `58ba867dd` | Channel tests | Improve channel test failure details UX. |
| `6f11d1987` | Model pricing | Normalize model pricing display drift. |
| `006e80165` | Model metadata | Resolve `owned_by` from active channels. |
| `ae6a03364` | Request path performance | Optimize request metadata extraction and disabled-field filtering. |
| `e13d67345` | Frontend defaults | Update default hardcoded route links. |
| `8e5e89bb5` | Auth frontend | Show Turnstile on the new frontend register page. |
| `19f1821fc` | Waffo Pancake | Add gateway integration with subscription support and admin catalog binding. |
| `f2c7647ec` | Waffo Pancake | Enforce subscription compliance and product ID update. |
| `b9bc6f0e2` | Logs | Revert a usage-log filtering behavior change. |

## G-Master Implementation Status

Implemented release: `v1.0.0-rc.8-GM.1`

### Implemented In This Release

- Added Waffo Pancake admin catalog/product binding endpoints and UI controls while preserving the existing signed HTTP checkout and webhook flow.
- Added atomic option persistence for Waffo Pancake merchant, private key, return URL, store and product binding.
- Hardened generic option writes so payment compliance confirmation fields cannot be changed through the generic option API, and positive invite quotas require confirmed payment compliance.
- Ported request metadata extraction and disabled-field filtering fast paths with body reuse tests.
- Updated OpenAI stream token parsing to process chunks incrementally through the G-Master JSON wrapper.
- Added model pricing display normalization to the current G-Master pricing editor.
- Mapped channel-test failure detail UX into the current channel model test modal by surfacing `error_code`.
- Preserved dashboard visibility settings, model-health usage-log fallback, and escaped contains usage-log filtering because the current G-Master behavior is already product-safe and covered by tests.
- Updated public release docs and version to `v1.0.0-rc.8-GM.1`.

### Verified Existing Or Preserved

- Turnstile registration support already exists in `web/src/components/auth/RegisterForm.jsx`.
- Active channel `owned_by` metadata tests already exist and remain unchanged.
- Dashboard optional panels already follow `/api/status` visibility flags.
- Existing Gaster Code navigation/page and async image-generation task work remain part of the G-Master release surface.

## Local Status Before Implementation

### Already Present Or Mostly Present

- Waffo Pancake top-up and subscription payment handlers exist:
  - `controller/topup_waffo_pancake.go`
  - `controller/subscription_payment_waffo_pancake.go`
  - `service/waffo_pancake.go`
  - `setting/payment_waffo_pancake.go`
- Waffo routes already exist for webhook, top-up, and subscription pay.
- Payment compliance gating exists in payment handlers through `controller/payment_compliance.go`.
- Turnstile registration support exists in `web/src/components/auth/RegisterForm.jsx`.
- Active-group and automatic-group behavior already exists in `service/group.go`, `middleware/distributor.go`, and `controller/model.go`.
- Model `owned_by` tests already exist:
  - `controller/model_owned_by_test.go`
  - `model/model_owner_test.go`
- Param override audit support already exists in `relay/common/override.go`.
- Async image-generation gateway timeout work is already part of `v1.0.0-rc.7-GM.2`.

### Needs Port Or Reconciliation

- Waffo Pancake admin catalog/product binding endpoints are missing from local routes.
- `model.UpdateOptionsBulk` is missing and is needed for atomic Waffo option saves.
- Local Waffo service uses the G-Master HTTP signing implementation, while upstream rc.8 uses the Waffo SDK. Port the admin binding capability without replacing existing production-compatible payment behavior unless tests prove the SDK path is required.
- Upstream option compliance hardening needs reconciliation with G-Master's existing payment-compliance confirmation flow.
- Request metadata extraction fast path from `middleware/distributor.go` needs porting.
- Disabled-field filtering fast path from `relay/common/relay_info.go` needs porting.
- `relay/channel/openai/helper.go` should be reviewed for the upstream stream-token parser improvement. If touched, replace direct marshal/unmarshal calls with `common.*` wrappers.
- Channel test failure detail UX needs mapping to the current G-Master frontend.
- Model pricing normalization needs mapping to `web/src/pages/Setting/Ratio` and related hooks.
- Dashboard visibility behavior needs verification against current G-Master dashboard modules.
- Usage-log filtering needs product-safe reconciliation rather than a blind revert.
- Default frontend hardcoded links should be audited against current G-Master branding and routes.

### Do Not Copy Wholesale

- Do not copy upstream `web/default` or `web/classic` trees into G-Master. The local frontend uses `web/src` with G-Master-specific navigation, Gaster Code pages, wallet, subscription, and admin UI.
- Do not remove G-Master branding, Gaster Code pages, async image-generation changes, or current payment compliance gates.
- Do not replace the current Waffo production payment flow without preserving the existing webhook and settings behavior.

## Verification Matrix

Backend:

```bash
go test ./model ./service ./controller ./middleware ./relay/common ./relay/channel/openai
go test ./...
```

Frontend:

```bash
cd web
bun install
bun run build
```

Release/deploy:

```bash
git diff --check
git status --short --branch
```

Browser checks after deployment:

- Admin payment gateway settings show Waffo Pancake catalog/product binding controls.
- Admin channel test displays actionable failure details.
- Model pricing page shows normalized quota/pricing values.
- Dashboard visibility settings still control the dashboard content.
- Usage logs filtering behaves consistently with G-Master expectations.
- Existing Gaster Code page and navigation remain intact.
