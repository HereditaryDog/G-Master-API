# Changelog

All notable changes to `G-Master API` are documented in this file.

## v0.12.9-gmaster.1 - 2026-04-14

### Changed

- Synced the fork forward from upstream `new-api v0.12.6` to `v0.12.9` while preserving `G-Master API` branding, the custom homepage and docs portal, and the existing business-group behavior.
- Pulled in the upstream dashboard and settings refinements, including better chart dimension handling, ranking logic, amount-first quota adjustment flow, subscription-card next-reset display, and the GroupTable input behavior fixes.
- Regenerated the published Apifox import artifacts so the public developer documentation stays aligned with the new release version and current production base URLs.

### Fixed

- Fixed the public-site dark-mode regression where the branded homepage still rendered in a light theme because the active `gm-zen-*` style set had no dark-mode coverage.
- Fixed the shared public header in dark mode so homepage, docs, auth, pricing, and about pages no longer keep a light top bar after the theme switches to dark.
- Pulled in the upstream fixes for Azure `/v1/responses/compact` routing, Claude `TopP` request handling, token-auth error hardening, and `isStream` error-log status reporting.

## v0.12.6-gmaster.3 - 2026-04-14

### Changed

- Unified online wallet top-up completion so `epay/alipay/wxpay`, Waffo, Stripe, Creem, and admin manual completion now share the same post-payment path for quota settlement and user-group promotion.
- Split root-user default group policy from normal registration so first-run super-admin initialization now stays in `VIP用户组`, while regular sign-ups still enter `标准用户组`.
- Updated the default group-ratio and top-up-ratio fallback maps to include both legacy `default/vip/svip` keys and the current `标准用户组 / VIP用户组` business groups.

### Fixed

- Fixed the production bug where successful online `epay` recharges added quota but did not promote the user into `VIP用户组`.
- Fixed the stale session-group problem that could leave already-upgraded users, including super-admin accounts, seeing permissions and group-dependent data as if they were still in the old group.
- Fixed group-aware pricing/model/group endpoints to read the current persisted user group instead of relying on cached login-time state.

## v0.12.6-gmaster.2 - 2026-04-13

### Changed

- Standardized new-user onboarding so password registration, admin-created accounts, OAuth first-login accounts, and first-run root initialization all enter the `标准用户组` user group by default.
- Standardized successful top-up handling so wallet recharge completion now upgrades the user to `VIP用户组` immediately, regardless of recharge amount.

### Fixed

- Fixed the previous behavior where newly created users silently fell back to the legacy database default group instead of the configured business group layout.
- Fixed the gap between recharge success and user-group promotion by applying the group upgrade inside the same top-up completion transaction and refreshing the cached user group afterwards.

## v0.12.6-gmaster.1 - 2026-04-09

### Changed

- Synced the fork forward from upstream `new-api v0.12.1` to `v0.12.6` while preserving the `G-Master API` homepage, docs portal, branding, and public-facing copy.
- Brought in the upstream settings and pricing-management refresh, including the newer grouped ratio management flow and related admin-side UI updates.
- Brought in the upstream dashboard enhancements, including stronger analytics views, chart sorting/axis fixes, and copy actions in the API info panel.
- Regenerated the published Apifox import artifacts so the public developer docs align with the new release version.

### Added

- Added upstream support for `MiniMax` image generation relay.
- Added upstream support for forced `AUTH LOGIN` in SMTP configuration for stricter email provider compatibility.
- Added upstream support for channel affinity rules that include explicit model-name matching.

### Fixed

- Fixed the dashboard stat cards so their inner content aligns consistently instead of drifting between cards.
- Fixed the upstream sync artifacts that referenced `new-api` module paths or example domains where the branded fork should keep `G-Master API` and `gmapi.fun`.

## v0.12.1-gmaster.4 - 2026-04-09

### Changed

- Refreshed the public homepage model capability copy so it describes stable capability categories instead of short-lived upstream model names.
- Updated the homepage SDK example and the public docs snippets to use neutral `your-chat-model` placeholders and current OpenAI SDK patterns.
- Cleaned the public `/docs` page and Apifox source pages to remove internal rollout wording and make the published documentation read like a production-facing developer portal.

## v0.12.1-gmaster.3 - 2026-04-09

### Changed

- Promoted the current `G-Master API` stack to the Tencent Cloud production deployment at `https://gmapi.fun` while keeping the local Docker workflow for review-first changes.
- Refreshed repository release metadata and generated docs assets so the published version stays aligned across the UI, README, and Apifox import files.

### Fixed

- Fixed the playground desktop layout so the model configuration panel no longer collides with the global console sidebar.
- Fixed the multi-key polling warning to reflect the real runtime cache state instead of showing unconditionally when polling mode is selected.
- Exposed `redis_enabled` and `memory_cache_enabled` in `/api/status` so the frontend can make correct cache-dependent UI decisions.

## v0.12.1-gmaster.2 - 2026-04-08

### Changed

- Rebuilt the public homepage into a `Zen-AI`-style landing page while keeping the `G-Master API` brand, links, and deployment flow.
- Unified the console and model pricing pages around the same blue-purple visual system with refreshed gradients, glass cards, rounded controls, and consistent spacing.
- Refreshed the shared header, sidebar, logo treatment, page background, and action areas so the main product surfaces feel like one release instead of mixed upstream screens.
- Added local homepage illustration assets for the new landing page sections and updated the default logo cache-busting path for smoother rollout.

### Fixed

- Restored the missing dashboard stat icons after the theme refresh by reintroducing visible foreground colors for the avatar icons.
- Fixed the hero subtitle typing animation so it no longer pushes the `G-Master API` title during playback.
- Fixed the hero subtitle width reservation so the full Chinese copy displays correctly instead of being clipped at the end.

## v0.12.1-gmaster.1 - 2026-04-06

### Changed

- Synced the fork to upstream `new-api v0.12.1`.
- Refreshed the `gmapi.fun` deployment assets and added footer version display support.
