# New API rc.10 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade G-Master API from `v1.0.0-rc.8-GM.2` to an rc.10-aligned G-Master release while preserving G-Master branding, Gaster Code account-center APIs, async image-generation behavior, payment compliance, and production deployment conventions.

**Architecture:** Use selective lane migration, not a wholesale upstream merge. Port backend fixes file-by-file from upstream `v1.0.0-rc.10`, map only valuable frontend behavior into the current production `web/` app, and keep unreleased upstream `main` changes as a separate watchlist.

**Tech Stack:** Go 1.22+ with Gin/GORM, React 18/Vite/Semi UI, Bun for frontend commands, PostgreSQL/MySQL/SQLite-compatible migrations.

**Current Baseline:** `main` at `6c80734e0`, tag `v1.0.0-rc.8-GM.2`.

**Upstream Target:** `QuantumNous/new-api` tag `v1.0.0-rc.10`, published 2026-05-26, target commit `74985fa87`.

**Reference Inventory:** `docs/upstream/new-api-v1-rc10-inventory.md`.

---

## Phase 0: Prepare Upgrade Lane

**Files:**
- Read: `VERSION`
- Read: `docs/upstream/new-api-v1-rc10-inventory.md`
- Create branch/worktree only; no source edits in this phase.

- [ ] **Step 1: Create a dedicated worktree**

Run:

```bash
git worktree add ../G-Master_API-rc10-upgrade -b GMaster/new-api-rc10-upgrade main
cd ../G-Master_API-rc10-upgrade
```

Expected: a clean worktree on branch `GMaster/new-api-rc10-upgrade`.

- [ ] **Step 2: Fetch upstream refs**

Run:

```bash
git fetch upstream main --tags --prune
git rev-parse --short v1.0.0-rc.10^{}
git rev-list --count v1.0.0-rc.10..upstream/main
```

Expected:

```text
74985fa87
60
```

If the second number changes, update the watchlist note in `docs/upstream/new-api-v1-rc10-inventory.md`.

- [ ] **Step 3: Confirm local baseline**

Run:

```bash
cat VERSION
git log --oneline --decorate --max-count=5
git status --short --branch
```

Expected:

```text
v1.0.0-rc.8-GM.2
```

Only unrelated untracked files such as `output/` may remain outside the worktree.

- [ ] **Step 4: Commit inventory and plan if not already committed**

Run:

```bash
git add docs/upstream/new-api-v1-rc10-inventory.md
git add -f docs/superpowers/plans/2026-06-09-new-api-rc10-upgrade.md
git commit -m "docs: plan new-api rc10 upgrade"
```

Expected: a documentation-only commit.

---

## Phase 1: Backend Relay And Log Reliability

**Files:**
- Modify: `relay/image_handler.go`
- Modify: `relay/channel/gemini/relay-gemini.go`
- Modify: `relay/channel/claude/relay-claude.go`
- Modify: `relay/chat_completions_via_responses.go`
- Modify: `relay/claude_handler.go`
- Modify: `relay/compatible_handler.go`
- Modify: `relay/embedding_handler.go`
- Modify: `relay/gemini_handler.go`
- Modify: `relay/rerank_handler.go`
- Modify: `relay/responses_handler.go`
- Modify: `relay/common/outbound_body.go`
- Modify: `service/error.go`
- Modify: `model/log.go`
- Test: `service/error_test.go`

- [ ] **Step 1: Review upstream backend relay patch**

Run:

```bash
git diff v1.0.0-rc.8..v1.0.0-rc.10 -- relay service/error.go model/log.go
```

Expected: visible changes for image quality forwarding, Gemini/Claude tool-call handling, outbound body memory handling, and oversized error truncation.

- [ ] **Step 2: Port image quality handling without breaking async image jobs**

Bring in the upstream fix around image quality forwarding in `relay/image_handler.go`, but keep G-Master async image-generation routes and timeout retry code unchanged.

Run:

```bash
go test ./relay ./relay/channel/openai
```

Expected: pass. If package-level tests do not exist for a touched package, record that and rely on `go test ./...` in Phase 6.

- [ ] **Step 3: Port Gemini/Claude tool-call fixes**

Port only the conversion logic needed for:

- Gemini-to-Claude tool-use compatibility;
- concurrent tool-call key collision avoidance;
- existing Claude/Gemini request compatibility.

Run:

```bash
go test ./relay/channel/gemini ./relay/channel/claude ./relay
```

Expected: pass.

- [ ] **Step 4: Port oversized upstream error truncation**

Port upstream truncation behavior into `service/error.go` and `model/log.go`. Keep G-Master's machine-readable image/auth error structures.

Run:

```bash
go test ./service -run 'Error|Trunc'
go test ./model -run 'Log'
```

Expected: pass.

- [ ] **Step 5: Commit relay/log fixes**

Run:

```bash
git add relay service/error.go service/error_test.go model/log.go
git commit -m "fix: port rc10 relay and log reliability fixes"
```

Expected: commit contains only backend relay/log reliability changes.

---

## Phase 2: Channel Cache, Tests, And Admin Behavior

**Files:**
- Modify: `controller/channel-test.go`
- Modify: `controller/channel.go`
- Modify: `controller/channel_test_internal_test.go`
- Modify: `model/channel.go`
- Modify: `service/channel.go`
- Modify: current `web/src` channel editor/test UI files after locating exact local paths with `rg`.

- [ ] **Step 1: Inspect upstream channel changes**

Run:

```bash
git diff v1.0.0-rc.8..v1.0.0-rc.10 -- controller/channel-test.go controller/channel.go model/channel.go service/channel.go web/default/src/features/channels
```

Expected: changes for actual test user id, auto-disabled multi-key channel cache eviction, duplicate action toast prevention, and channel editor UI improvements.

- [ ] **Step 2: Port backend channel fixes first**

Port:

- actual user id in channel tests;
- cache eviction for auto-disabled multi-key channels;
- safe channel action status behavior.

Run:

```bash
go test ./controller -run 'Channel'
go test ./service -run 'Channel'
go test ./model -run 'Channel'
```

Expected: pass.

- [ ] **Step 3: Map channel editor UX into current frontend**

Find current channel editor files:

```bash
rg -n "Channel|channel|fetch.*model|mapping" web/src | head -80
```

Port only small improvements that fit the current G-Master UI:

- clearer model mapping validation;
- improved test result display;
- no duplicate success/error notifications;
- no upstream branding or route replacement.

Run:

```bash
cd web
bun run build
```

Expected: production build passes.

- [ ] **Step 4: Commit channel changes**

Run:

```bash
git add controller/channel-test.go controller/channel.go controller/channel_test_internal_test.go model/channel.go service/channel.go web/src
git commit -m "fix: port rc10 channel admin reliability fixes"
```

Expected: commit contains channel backend and mapped current-frontend changes only.

---

## Phase 3: Subscription, Wallet, Waffo, And Webhook Flow

**Files:**
- Modify: `controller/subscription.go`
- Modify: `controller/topup_waffo_pancake.go`
- Modify: `controller/subscription_payment_waffo_pancake.go`
- Modify: `model/subscription.go`
- Modify: `model/topup.go`
- Modify: `model/user.go`
- Modify: `service/waffo_pancake.go`
- Test: `service/waffo_pancake_test.go`
- Review: `controller/gaster_code_billing.go`
- Review: `service/gaster_code_auth.go`

- [ ] **Step 1: Review upstream payment/subscription changes**

Run:

```bash
git diff v1.0.0-rc.8..v1.0.0-rc.10 -- controller/subscription.go controller/topup_waffo_pancake.go controller/subscription_payment_waffo_pancake.go model/subscription.go model/topup.go model/user.go service/waffo_pancake.go
```

Expected: balance-purchase support, Waffo settings save consolidation, and webhook process fixes.

- [ ] **Step 2: Add subscription balance-purchase support carefully**

Port balance-purchase logic only if it cleanly works with:

- current wallet balance units;
- G-Master subscription group upgrade fields;
- Gaster Code `/api/gaster-code/me` subscription item fields;
- Gaster Code checkout status polling.

Run:

```bash
go test ./controller -run 'Subscription|GasterCode'
go test ./model -run 'Subscription|User|Topup'
```

Expected: pass.

- [ ] **Step 3: Port Waffo save/webhook reliability without replacing production signing**

Keep G-Master's existing production-compatible Waffo signed HTTP flow. Port only:

- safer settings save behavior;
- webhook processing reliability;
- error handling improvements;
- tests that do not require live Waffo credentials.

Run:

```bash
go test ./service -run 'Waffo'
go test ./controller -run 'Waffo|Topup|Subscription'
```

Expected: pass.

- [ ] **Step 4: Verify Gaster Code billing compatibility**

Run:

```bash
go test ./controller -run 'GasterCode'
go test ./service -run 'GasterCode'
```

Expected: all Gaster Code auth, provider-token, billing, and subscription tests still pass.

- [ ] **Step 5: Commit billing/payment changes**

Run:

```bash
git add controller model service
git commit -m "fix: port rc10 subscription and payment reliability fixes"
```

Expected: commit preserves Gaster Code account-center behavior.

---

## Phase 4: Usage Logs, Metrics, And System Settings UX

**Files:**
- Modify: `model/log.go`
- Modify: current `web/src` usage-log files after locating exact paths with `rg`
- Modify: current `web/src` system settings files after locating exact paths with `rg`
- Review: `pkg/perf_metrics/metrics.go`
- Review: `controller/perf_metrics.go`

- [ ] **Step 1: Port exact usage-log filter behavior**

Inspect upstream:

```bash
git diff v1.0.0-rc.8..v1.0.0-rc.10 -- model/log.go web/default/src/features/usage-logs
```

Port the rule: filters match exact values unless wildcard matching is explicit.

Run:

```bash
go test ./model -run 'Log'
```

Expected: pass.

- [ ] **Step 2: Preserve model-health usage-log fallback**

Review the local model-health fixes before changing metrics:

```bash
git show --stat 9946dc62b
git show --stat ff09104c8
```

If upstream metrics changes overlap, keep G-Master's fallback path that populates model health from usage logs.

Run:

```bash
go test ./pkg/perf_metrics ./controller -run 'Perf|Metric|Health'
```

Expected: pass, or document packages without matching tests and cover with `go test ./...`.

- [ ] **Step 3: Map system settings numeric/dirty-state fixes**

Find current settings fields:

```bash
rg -n "dirty|NaN|number|InputNumber|System Settings|系统设置" web/src
```

Port only the minimal numeric-field and unsaved-change fixes that fit current G-Master settings UI.

Run:

```bash
cd web
bun run build
```

Expected: build passes.

- [ ] **Step 4: Commit logs/settings changes**

Run:

```bash
git add model/log.go pkg/perf_metrics controller/perf_metrics.go web/src
git commit -m "fix: port rc10 logs and settings UX fixes"
```

Expected: commit keeps current G-Master dashboard and model-health behavior.

---

## Phase 5: Frontend Visual Polish Without Route Or Brand Regression

**Files:**
- Modify: `web/src/**` only where current production UI maps directly to upstream improvements.
- Do not copy: `web/default/**` wholesale.
- Do not replace: G-Master homepage, Gaster Code detail page, current footer, public header branding.

- [ ] **Step 1: Select frontend deltas**

Review upstream reference areas:

```bash
git diff v1.0.0-rc.8..v1.0.0-rc.10 -- web/default/src/features/usage-logs web/default/src/features/channels web/default/src/features/system-settings web/default/src/styles
```

Select only:

- usage-log mobile/readability improvements that map to current `web/src`;
- channel editor/test UI polish from Phase 2;
- system settings form safety from Phase 4;
- theme tweaks only if they do not turn the product into upstream default branding.

- [ ] **Step 2: Preserve branded pages**

Run:

```bash
rg -n "Gaster Code|G-Master API|Claude Code|QuantumNous|New API" web/src web/public index.html
```

Expected:

- `G-Master API` and `Gaster Code` remain where product-facing.
- No new `Claude Code` text.
- No public link to private Gaster Code source repo.
- No upstream public branding replacing G-Master public pages.

- [ ] **Step 3: Build and browser-check**

Run:

```bash
cd web
bun run build
```

Start local server:

```bash
cd web
bun run dev --host 127.0.0.1 --port 3000
```

Open and verify:

- `http://127.0.0.1:3000/`
- `http://127.0.0.1:3000/gaster-code`
- `http://127.0.0.1:3000/console/channel`
- `http://127.0.0.1:3000/console/log`

Expected: no layout overlap, no missing route, no brand regression.

- [ ] **Step 4: Commit frontend polish**

Run:

```bash
git add web/src web/package.json web/bun.lock
git commit -m "feat: port rc10 admin UI polish"
```

Expected: commit is scoped to current production frontend.

---

## Phase 6: Version, Docs, Verification, And Release Prep

**Files:**
- Modify: `VERSION`
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Create: `release-notes/v1.0.0-rc.10-GM.1.md`
- Modify: `docs/apifox/dist/*.json` if generated API docs are refreshed.

- [ ] **Step 1: Update version**

Set:

```text
v1.0.0-rc.10-GM.1
```

in `VERSION`, README current baseline copy, CHANGELOG, and release notes.

- [ ] **Step 2: Run full backend verification**

Run:

```bash
go test ./...
```

Expected: pass.

- [ ] **Step 3: Run frontend verification**

Run:

```bash
cd web
bun run build
bun run i18n:lint
```

Expected: build and i18n lint pass. If i18n lint reports existing untranslated keys unrelated to the upgrade, record the exact output and decide whether to fix in this release.

- [ ] **Step 4: Run static release checks**

Run:

```bash
git diff --check
git status --short --branch
```

Expected: no whitespace errors; only intentional files changed.

- [ ] **Step 5: Commit release prep**

Run:

```bash
git add VERSION README.md CHANGELOG.md release-notes/v1.0.0-rc.10-GM.1.md docs/apifox/dist
git commit -m "chore: release v1.0.0-rc.10-GM.1"
```

Expected: final release-prep commit.

- [ ] **Step 6: Final review before push/deploy**

Run:

```bash
git log --oneline --decorate --max-count=10
git diff --stat main...HEAD
```

Expected: commits are organized by backend relay/logs, channel behavior, billing/payment, logs/settings, frontend polish, and release prep.

---

## Phase 7: Production Deployment Checklist

Only execute after user approval to push/deploy.

- [ ] **Step 1: Push branch and tag**

Run:

```bash
git checkout main
git merge --ff-only GMaster/new-api-rc10-upgrade
git tag -a v1.0.0-rc.10-GM.1 -m "v1.0.0-rc.10-GM.1"
git push origin main
git push origin v1.0.0-rc.10-GM.1
```

Expected: GitHub release workflow starts and succeeds.

- [ ] **Step 2: Backup production database**

Run on production host:

```bash
cd /home/ubuntu/G-Master-API
mkdir -p backups
ts=$(date +%Y%m%d-%H%M%S)
set -a && . ./.env && set +a
sudo docker compose exec -T g-master-api-postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "backups/pre-v1.0.0-rc.10-GM.1-$ts.sql"
ls -lh "backups/pre-v1.0.0-rc.10-GM.1-$ts.sql"
```

Expected: non-empty SQL backup.

- [ ] **Step 3: Deploy production**

Run on production host:

```bash
cd /home/ubuntu/G-Master-API
git fetch origin main --tags
git pull --ff-only origin main
cat VERSION
sudo docker compose up -d --build
sudo docker compose ps
```

Expected:

```text
v1.0.0-rc.10-GM.1
```

and all containers healthy.

- [ ] **Step 4: Verify production routes**

Run:

```bash
curl --compressed -fsS https://gmapi.fun/api/status
curl --compressed -s -o /tmp/gc-plans.out -w "%{http_code}\n" https://gmapi.fun/api/gaster-code/billing/plans
head -c 500 /tmp/gc-plans.out
```

Expected:

- `/api/status` reports `v1.0.0-rc.10-GM.1`.
- Gaster Code billing plans route returns `401` with `GMASTER_AUTH_EXPIRED` when unauthenticated, proving the route is live and protected.
