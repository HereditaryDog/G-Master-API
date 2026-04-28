# New API v0.13.2 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring G-Master API from the current `v0.13.1-gmaster.3` line up to New API `v0.13.2`, then optionally apply the small `v1.0.0-alpha.1` pricing-render patch after stability is proven.

**Architecture:** Do not directly merge `v0.13.2` into the current branch because the real Git merge-base is `v0.12.11`, which creates large historical conflicts. Instead, preserve current G-Master work, create an isolated upgrade branch from current HEAD, then cherry-pick the non-merge upstream commits from `v0.13.1..v0.13.2` in chronological order and resolve only the touched-file conflicts.

**Tech Stack:** Go 1.22+, Gin, GORM, PostgreSQL/MySQL/SQLite, React 18, Vite, Semi UI, Bun.

---

## Current Findings

- Current branch: `GMaster/upstream-v0.13-sync`.
- Current version file: `v0.13.1-gmaster.3`.
- Current latest local commit: `da2c3f2bf fix: preserve desktop auth login redirect`.
- Upstream stable latest: `v0.13.2`.
- Upstream prerelease: `v1.0.0-alpha.1`.
- `v1.0.0-alpha.1` only changes `web/src/helpers/render.jsx` compared with `v0.13.2`.
- `upstream/main` has 4 commits after `v1.0.0-alpha.1`, including `a42b39760 🚀 feat: launch v1.0 — next-generation frontend built from the ground up (#4265)`.
- `upstream/main` after `v1.0.0-alpha.1` changes 1293 files, mostly moving the existing frontend to `web/classic` and adding a new `web/default` frontend.
- `git merge-base HEAD v0.13.2` resolves to upstream `v0.12.11`, so direct merge is not appropriate.
- Current working tree has uncommitted desktop login redirect frontend changes. Commit or stash these before upgrade.

## Upstream v0.13.2 Change Areas

- Tiered billing expression: adds `len` variable, prompt/helper docs, settlement tests, quota/price updates.
- Upstream pricing sync: sync from pricing endpoint, always serialize ratio/price values for fallback during sync delay.
- Channel model sync: load model mapping during upstream checks and show removed upstream models in the fetch modal.
- JSON/config: map unmarshalling fixes and JSON wrapper tests.
- Relay compatibility: raw JSON response tool arguments and Ali native messages model matching.
- User metadata: adds `created_at` and `last_login_at` display/support.
- UI: ratio sync page, model select modal, tiered pricing editor, dynamic pricing breakdown.

## Upstream Commits To Apply

Apply these non-merge commits in this order:

```bash
095e1920f fix(channel): load model mapping during upstream model checks
02aacb38a feat: add user created_at and last_login_at
f2f3410dc feat: add `len` variable for tier conditions and LLM prompt helper
355307223 fix: clarify affinity disabled channel retry message
62d4b63fc feat: configure native messages model matching
db89b57e1 fix: support raw JSON response tool arguments
4c21c4c43 feat: show removed upstream models in fetch models modal
f424f906d feat: sync upstream pricing from pricing endpoint (#4452)
4e93148d9 fix: ensure proper handling of JSON unmarshalling for maps in config update
bee339d27 fix: always serialize ratio/price values for all models to ensure fallback during sync delays
```

## Task 1: Freeze Current G-Master Work

**Files:**
- Modify only if currently dirty: `web/src/components/auth/LoginForm.jsx`
- Modify only if currently dirty: `web/src/components/auth/OAuth2Callback.jsx`
- Modify only if currently dirty: `web/src/helpers/auth.jsx`
- Add if currently dirty: `web/src/helpers/authRedirect.js`
- Add if currently dirty: `web/src/helpers/auth.test.jsx`

- [ ] **Step 1: Verify current dirty files**

Run:

```bash
git status --short
```

Expected: only the known desktop login redirect files and this plan file should be dirty.

- [ ] **Step 2: Run the desktop login redirect regression checks**

Run:

```bash
cd web && bun test src/helpers/auth.test.jsx
cd web && bun run lint
cd web && bun run build
git diff --check
```

Expected: all commands pass.

- [ ] **Step 3: Commit current work before upgrade**

Run:

```bash
git add web/src/components/auth/LoginForm.jsx \
  web/src/components/auth/OAuth2Callback.jsx \
  web/src/helpers/auth.jsx \
  web/src/helpers/authRedirect.js \
  web/src/helpers/auth.test.jsx \
  docs/superpowers/plans/2026-04-28-new-api-v0132-upgrade.md
git commit -m "fix: preserve desktop auth login redirect"
```

Expected: a clean working tree except any intentionally ignored local runtime artifacts.

## Task 2: Create The Upgrade Branch

**Files:**
- No file edits expected.

- [ ] **Step 1: Create an isolated branch**

Run:

```bash
git switch -c GMaster/upstream-v0.13.2-sync
```

Expected: branch created from the post-login-redirect-fix G-Master HEAD.

- [ ] **Step 2: Confirm upstream tags are current**

Run:

```bash
git fetch upstream --tags --prune
git tag --sort=-v:refname | head -5
```

Expected: output includes `v0.13.2`, `v0.13.1-patch.1`, and `v0.13.1`.

## Task 3: Apply Upstream Backend/Core Commits

**Files likely touched:**
- `common/json.go`
- `controller/channel_upstream_update.go`
- `controller/ratio_sync.go`
- `controller/user.go`
- `dto/openai_response.go`
- `middleware/distributor.go`
- `model/user.go`
- `pkg/billingexpr/*`
- `relay/channel/ali/adaptor.go`
- `relay/channel/openai/chat_via_responses.go`
- `relay/helper/price.go`
- `service/quota.go`
- `service/tiered_settle.go`
- `setting/billing_setting/tiered_billing.go`
- `setting/config/config.go`
- `setting/ratio_setting/model_ratio.go`

- [ ] **Step 1: Cherry-pick backend/core commits one at a time**

Run:

```bash
git cherry-pick -x 095e1920f
git cherry-pick -x 02aacb38a
git cherry-pick -x f2f3410dc
git cherry-pick -x 355307223
git cherry-pick -x 62d4b63fc
git cherry-pick -x db89b57e1
git cherry-pick -x 4e93148d9
git cherry-pick -x bee339d27
```

Expected: conflicts, if any, should be limited to the files listed above. Resolve by preserving G-Master branding, desktop auth routes, subscription group billing behavior, and upstream bugfix logic.

- [ ] **Step 2: Run focused backend tests**

Run:

```bash
go test ./common ./pkg/billingexpr ./service ./setting/config ./controller ./relay/helper
```

Expected: all packages pass.

## Task 4: Apply Upstream UI/Pricing Sync Commits

**Files likely touched:**
- `web/src/components/settings/ChannelSelectorModal.jsx`
- `web/src/components/settings/RatioSetting.jsx`
- `web/src/components/table/channels/modals/EditChannelModal.jsx`
- `web/src/components/table/channels/modals/ModelSelectModal.jsx`
- `web/src/components/table/model-pricing/modal/components/DynamicPricingBreakdown.jsx`
- `web/src/components/table/users/UsersColumnDefs.jsx`
- `web/src/constants/billing.constants.js`
- `web/src/constants/common.constant.js`
- `web/src/helpers/render.jsx`
- `web/src/helpers/utils.jsx`
- `web/src/pages/Setting/Ratio/UpstreamRatioSync.jsx`
- `web/src/pages/Setting/Ratio/components/TieredPricingEditor.jsx`
- `web/src/pages/Setting/Ratio/hooks/useModelPricingEditorState.js`

- [ ] **Step 1: Cherry-pick UI/pricing commits**

Run:

```bash
git cherry-pick -x 4c21c4c43
git cherry-pick -x f424f906d
```

Expected: resolve UI conflicts while preserving G-Master dashboard/pricing visual customizations and the zh/en locale limitation.

- [ ] **Step 2: Run frontend checks**

Run:

```bash
cd web && bun run lint
cd web && bun run build
```

Expected: both pass.

## Task 5: Decide Whether To Include v1.0.0-alpha.1 Patch

**Files likely touched:**
- `web/src/helpers/render.jsx`

- [ ] **Step 1: Inspect the alpha patch**

Run:

```bash
git diff v0.13.2..v1.0.0-alpha.1 -- web/src/helpers/render.jsx
```

Expected: patch only filters cache pricing rows when no cache token variables are present.

- [ ] **Step 2: Apply only if compatible**

Run:

```bash
git cherry-pick -x 9f8a4ec05
```

Expected: include only if it does not conflict with G-Master pricing display. If it conflicts or changes desired UI copy, skip it and document that `v1.0.0-alpha.1` is intentionally not adopted because it is a prerelease.

## Task 6: Version, Docs, And Full Verification

**Files:**
- Modify: `VERSION`
- Modify if release notes exist for this line: `docs/**`

- [ ] **Step 1: Update version**

Run:

```bash
printf 'v0.13.2-gmaster.1\n' > VERSION
```

Expected: version marks stable upstream base plus G-Master patchline.

- [ ] **Step 2: Full backend verification**

Run:

```bash
go test ./...
```

Expected: all Go tests pass. If a known long-running integration test requires credentials, record it and run the closest package-level tests.

- [ ] **Step 3: Full frontend verification**

Run:

```bash
cd web && bun test src/helpers/auth.test.jsx
cd web && bun run lint
cd web && bun run build
```

Expected: all pass.

- [ ] **Step 4: Docker/PostgreSQL smoke test**

Run:

```bash
docker compose up -d --build g-master-api
docker compose ps
curl -sS http://127.0.0.1:3000/api/status | head -c 500
docker compose logs --tail=80 g-master-api | grep -E 'using PostgreSQL|G-Master API v0.13.2-gmaster.1|ready'
```

Expected: service healthy, PostgreSQL in use, version shows `v0.13.2-gmaster.1`.

- [ ] **Step 5: Manual smoke checks**

Open `http://127.0.0.1:3000/` and verify:

```text
Home loads.
Login/register pages load.
/login?redirect=/gaster-code/desktop-login?request_id=test still shows login page when localStorage has user.
Console dashboard loads after login.
Pricing/model marketplace page loads.
Admin ratio/pricing sync pages load.
Token group selection still supports weekly-card/VIP billing behavior.
```

- [ ] **Step 6: Commit and push upgrade branch**

Run:

```bash
git add .
git commit -m "chore: sync upstream v0.13.2 into G-Master"
git push origin GMaster/upstream-v0.13.2-sync
```

Expected: branch pushed for review/staging deployment.

## Risk Notes

- Direct merge is high risk because the true merge-base is `v0.12.11`.
- The highest-risk files are billing expression, quota settlement, ratio sync, `web/src/helpers/render.jsx`, and G-Master subscription group billing.
- The current uncommitted desktop auth redirect fix must be preserved before any upstream work starts.
- Do not adopt the new `upstream/main` V1 frontend rewrite yet. It includes a large “next-generation frontend” commit on `main`, while the released stable target is `v0.13.2`.
- Treat `upstream/main` V1 as a separate migration project. It changes frontend structure from a single `web/` app to `web/classic` plus `web/default`, so adopting it would require re-porting G-Master dashboard/pricing/login customizations instead of normal conflict resolution.
