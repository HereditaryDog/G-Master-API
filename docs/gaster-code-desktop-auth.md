# Gaster Code Desktop Auth API

Gaster Code 桌面端使用网页登录 + 本地 loopback 回调完成授权。桌面端不收集用户密码，不复用网页 cookie，也不会通过 URL 接收长期 token。

G-Master API 前台提供公开详情页 `/gaster-code`，顶栏位于“首页”之后。该页面用于向所有用户介绍 Gaster Code 的本地项目理解、代码编辑与调试、终端工作流、G-Master API 模型接入、绘图、多模态入口和 IM 远程入口等能力，并引导用户从公开 release-only 仓库下载桌面端。

Public download URL:

```text
https://github.com/HereditaryDog/gaster-code-releases/releases/latest
```

Updater metadata URL:

```text
https://github.com/HereditaryDog/gaster-code-releases/releases/latest/download/latest.json
```

The release-only repository distributes installers, signatures, and updater metadata. It must be used for public downloads instead of linking to the private Gaster Code source repository.

Base URL:

```text
https://gmapi.fun
```

## 1. Start Auth

`POST /api/gaster-code/auth/start`

Request:

```json
{
  "code_challenge": "BASE64URL_SHA256_CODE_VERIFIER",
  "code_challenge_method": "S256",
  "state": "opaque-client-state",
  "redirect_uri": "http://127.0.0.1:18790/api/gmaster-auth/callback",
  "client_name": "Gaster Code",
  "client_version": "0.2.1-gastercode.x",
  "intent": "login"
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "request_id": "gcr_xxx",
    "authorize_url": "https://gmapi.fun/gaster-code/desktop-login?request_id=gcr_xxx",
    "expires_at": 1770000000
  }
}
```

Rules:

- `code_challenge_method` only supports `S256`.
- `intent` is optional and defaults to `login`.
- `intent=login` returns the normal desktop authorization page:
  `https://gmapi.fun/gaster-code/desktop-login?request_id=<request_id>`.
- `intent=register` returns a registration-first web entry:
  `https://gmapi.fun/register?redirect=<desktop_authorization_url>`.
- `intent` values other than `login` or `register` return HTTP `400`.
- `redirect_uri` only supports loopback URLs:
  - `http://127.0.0.1:<port>/api/gmaster-auth/callback`
  - `http://localhost:<port>/api/gmaster-auth/callback`

## 2. Desktop Login Page

`GET /gaster-code/desktop-login?request_id=<request_id>`

Behavior:

- If the user is not logged in, the page asks the user to log in through the existing G-Master API web flow.
- The login flow preserves the desktop authorization `redirect` parameter, including password login, passkey login, 2FA completion, and OAuth callback login.
- For `intent=register`, the registration page also preserves the same `redirect` parameter. After account creation, the user is sent to the login page with that redirect still attached; OAuth-style register/login entries can return directly to the desktop authorization page.
- If a user is already logged in when opening the registration-first URL, the page directly continues to the same desktop authorization page for the current account. The login/register pages also keep links for switching between existing-account login and new-account creation while preserving the desktop redirect.
- If the user is logged in, the page shows an authorization confirmation page.
- Approval redirects to:

```text
http://127.0.0.1:<port>/api/gmaster-auth/callback?code=<one_time_code>&state=<state>
```

- Denial redirects to:

```text
http://127.0.0.1:<port>/api/gmaster-auth/callback?error=access_denied&state=<state>
```

The authorization code is single-use and expires after 5 minutes. The callback always returns the original `state` value unchanged.

## 3. Exchange Token

`POST /api/gaster-code/auth/token`

Request:

```json
{
  "code": "gc_code_xxx",
  "code_verifier": "original-pkce-code-verifier",
  "redirect_uri": "http://127.0.0.1:18790/api/gmaster-auth/callback"
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "access_token": "gc_at_xxx",
    "refresh_token": "gc_rt_xxx",
    "expires_at": 1770000000,
    "user": {
      "id": 1,
      "username": "demo",
      "display_name": "demo",
      "email": "demo@example.com",
      "group": "vip"
    }
  }
}
```

The token response shape is unchanged for both `login` and `register` start intents. The `intent` value only changes the first browser entry URL; PKCE code exchange and token semantics remain the same.

## 4. Refresh Token

`POST /api/gaster-code/auth/refresh`

Request:

```json
{
  "refresh_token": "gc_rt_xxx"
}
```

Response shape is the same as `/api/gaster-code/auth/token`. Refresh rotates both access token and refresh token.

## 5. Authentication Error Response

The desktop auth endpoints return a stable machine-readable error structure when the Gaster Code login state is missing or expired.

Applies to:

- `GET /api/gaster-code/me`
- `POST /api/gaster-code/provider-token`
- `POST /api/gaster-code/auth/refresh`
- `POST /api/gaster-code/auth/revoke`

Missing bearer token:

```http
HTTP/1.1 401 Unauthorized
```

```json
{
  "success": false,
  "message": "missing Authorization bearer token",
  "code": "GMASTER_AUTH_EXPIRED",
  "legacy_code": "authentication_failed",
  "reason": "login_required",
  "action": "relogin",
  "userMessage": "G-Master API login is required. Please sign in again in Gaster Code."
}
```

Expired, revoked, invalid, or rotated desktop token:

```http
HTTP/1.1 401 Unauthorized
```

```json
{
  "success": false,
  "message": "refresh_token is invalid",
  "code": "GMASTER_AUTH_EXPIRED",
  "legacy_code": "authentication_failed",
  "reason": "session_expired",
  "action": "relogin",
  "userMessage": "G-Master API login has expired. Please sign in again in Gaster Code."
}
```

Clients should treat `action=relogin` as a request to clear local desktop auth state and start the G-Master login flow again. These errors indicate the request did not enter model inference, so token usage is expected to be zero.

## 6. Current User

`GET /api/gaster-code/me`

Headers:

```text
Authorization: Bearer gc_at_xxx
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "user": {
      "id": 1,
      "username": "demo",
      "display_name": "demo",
      "email": "demo@example.com",
      "group": "vip"
    },
    "subscription": {
      "active": true,
      "items": [
        {
          "id": 10,
          "plan_id": 2,
          "status": "active",
          "start_time": 1770000000,
          "end_time": 1772592000,
          "amount_total": 1000000,
          "amount_used": 120000,
          "amount_remaining": 880000,
          "unlimited": false,
          "upgrade_group": "weekly",
          "cancel_at_period_end": false,
          "resumable": false
        }
      ]
    },
    "quota": {
      "remaining": 200000,
      "used": 80000,
      "unlimited": false
    },
    "wallet": {
      "balance": 200000,
      "currency": "USD",
      "low_balance": false
    },
    "entitlements": {
      "can_use_builtin_provider": true,
      "enabled_models": ["deepseek-v4-pro", "gpt-image-2"],
      "enabled_features": ["account", "billing", "subscription", "provider_token", "chat", "terminal", "desktop_workflow", "image_generation"],
      "expires_at": 1772592000
    },
    "can_use_builtin_provider": true,
    "billing_url": "https://gmapi.fun/console/topup",
    "account_url": "https://gmapi.fun/console/personal"
  }
}
```

## 7. Account Center Billing APIs

All account center APIs use the same desktop bearer token:

```text
Authorization: Bearer gc_at_xxx
```

All success responses use:

```json
{ "success": true, "message": "", "data": {} }
```

All failure responses use:

```json
{ "success": false, "code": "GMASTER_BILLING_PLAN_UNAVAILABLE", "message": "subscription plan is unavailable" }
```

Stable error codes:

- `GMASTER_AUTH_EXPIRED`
- `GMASTER_BILLING_CHECKOUT_FAILED`
- `GMASTER_BILLING_PAYMENT_PENDING`
- `GMASTER_BILLING_PLAN_UNAVAILABLE`
- `GMASTER_BILLING_PROVIDER_UNAVAILABLE`
- `GMASTER_SUBSCRIPTION_NOT_FOUND`
- `GMASTER_SUBSCRIPTION_NOT_RESUMABLE`

### Billing Plans

`GET /api/gaster-code/billing/plans`

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "plans": [
      {
        "id": "topup_100",
        "kind": "topup",
        "name": "充值 100",
        "description": "G-Master API 额度充值，可用于 Gaster Code Desktop 内置 provider。",
        "price": 100,
        "currency": "USD",
        "interval": "one_time",
        "quota_amount": 500000,
        "unlimited": false,
        "recommended": true
      },
      {
        "id": "subscription_2",
        "kind": "subscription",
        "name": "VIP 月度套餐",
        "description": "桌面端订阅额度",
        "price": 19.9,
        "currency": "USD",
        "interval": "month",
        "quota_amount": 0,
        "unlimited": true,
        "recommended": true
      }
    ]
  }
}
```

`kind` is included so the desktop UI can pass the same `kind` and `plan_id` into checkout. Top-up plan IDs are `topup_<amount>`; subscription plan IDs are `subscription_<plan_id>`.

### Create Checkout

`POST /api/gaster-code/billing/checkout`

Request:

```json
{
  "kind": "subscription",
  "plan_id": "subscription_2",
  "return_to": "account"
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "gcbc_xxx",
    "url": "https://gmapi.fun/console/topup?source=gaster-code&checkout_id=gcbc_xxx&kind=subscription&plan_id=subscription_2&return_to=account",
    "status": "pending",
    "kind": "subscription",
    "expires_at": 1770001800
  }
}
```

The desktop opens `data.url` in the browser and does not handle provider payment secrets. The backend also creates a pending Gaster Code Desktop order record so admin order/payment pages can see the request.

### Poll Checkout

`GET /api/gaster-code/billing/checkout/:id`

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "id": "gcbc_xxx",
    "url": "https://gmapi.fun/console/topup?source=gaster-code&checkout_id=gcbc_xxx&kind=subscription&plan_id=subscription_2&return_to=account",
    "status": "paid",
    "kind": "subscription",
    "expires_at": 1770001800
  }
}
```

Checkout status values are `pending`, `paid`, `failed`, `expired`, and `cancelled`.
When the user finishes payment through the existing web console flow, polling can also infer `paid` from the user's successful top-up record or newly active subscription for the same plan.

### Transactions

`GET /api/gaster-code/billing/transactions`

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "transactions": [
      {
        "id": "gc_subscription_xxx",
        "kind": "subscription",
        "status": "paid",
        "amount": 19.9,
        "currency": "USD",
        "created_at": 1770000000,
        "description": "Gaster Code Desktop 订阅订单 #2"
      },
      {
        "id": "log_123",
        "kind": "usage",
        "status": "paid",
        "amount": 800,
        "currency": "quota",
        "created_at": 1770000100,
        "description": "Gaster Code Desktop usage"
      }
    ]
  }
}
```

Transaction kinds are `topup`, `subscription`, `usage`, `refund`, and `adjustment`. Status values are `pending`, `paid`, `failed`, `refunded`, and `cancelled`.

### Cancel Subscription

`POST /api/gaster-code/subscription/cancel`

Response:

```json
{
  "success": true,
  "message": "",
  "data": { "ok": true }
}
```

Cancellation is cancel-at-period-end. The subscription remains active until `end_time`; `/me.subscription.items[].resumable` becomes `true` while it can still be resumed.

### Resume Subscription

`POST /api/gaster-code/subscription/resume`

Response:

```json
{
  "success": true,
  "message": "",
  "data": { "ok": true }
}
```

## 8. Provider Token

`POST /api/gaster-code/provider-token`

Headers:

```text
Authorization: Bearer gc_at_xxx
```

Behavior:

- Returns an existing dedicated relay token for this desktop session, or creates one.
- The relay token is named `Gaster Code Desktop`.
- The relay token is a normal G-Master API token and can be revoked from the user token list or through `/api/gaster-code/auth/revoke`.

Response:

```json
{
  "success": true,
  "message": "",
  "data": {
    "provider": {
      "name": "G-Master API",
      "base_url": "https://gmapi.fun",
      "api_format": "anthropic",
      "api_key": "xxxxxxxx",
      "models": {
        "main": "gpt-5.4",
        "haiku": "gpt-5.4-mini",
        "sonnet": "gpt-5.4",
        "opus": "gpt-5.4"
      }
    }
  }
}
```

Use the returned `api_key` against Anthropic-compatible endpoints such as `/v1/messages`.

## 9. Revoke Desktop Session

`POST /api/gaster-code/auth/revoke`

Headers:

```text
Authorization: Bearer gc_at_xxx
```

Request:

```json
{
  "revoke_provider_token": true
}
```

Response:

```json
{
  "success": true,
  "message": "",
  "data": null
}
```

## Environment Values

Optional server-side environment variables:

```text
GASTER_CODE_ACCESS_TOKEN_TTL_SECONDS=86400
GASTER_CODE_REFRESH_TOKEN_TTL_SECONDS=2592000
GASTER_CODE_MODEL_MAIN=gpt-5.4
GASTER_CODE_MODEL_HAIKU=gpt-5.4-mini
GASTER_CODE_MODEL_SONNET=gpt-5.4
GASTER_CODE_MODEL_OPUS=gpt-5.4
```

Gaster Code client must know:

```text
G-Master API Base URL: https://gmapi.fun
Loopback callback path: /api/gmaster-auth/callback
PKCE method: S256
Provider api_format: anthropic
```

## Local Test Checklist

1. Start a local callback server at `http://127.0.0.1:<port>/api/gmaster-auth/callback`.
2. Generate `code_verifier`, `code_challenge = BASE64URL(SHA256(code_verifier))`, and `state`.
3. Call `POST /api/gaster-code/auth/start`. Use `intent=login` for existing-account login or omit `intent`; use `intent=register` for a registration-first entry.
4. Open `data.authorize_url` in the browser.
5. Log in or register through the existing web flow if needed.
6. Approve authorization.
7. Confirm the local callback receives `code` and the original `state`.
8. Call `POST /api/gaster-code/auth/token` with `code`, `code_verifier`, and the same `redirect_uri`.
9. Call `GET /api/gaster-code/me` with `Authorization: Bearer <access_token>`.
10. Call `GET /api/gaster-code/billing/plans`.
11. Call `POST /api/gaster-code/billing/checkout`, open `data.url`, and poll `GET /api/gaster-code/billing/checkout/:id`.
12. Call `GET /api/gaster-code/billing/transactions`.
13. Call `POST /api/gaster-code/provider-token` with the same bearer token.
14. Use returned `provider.api_key` against `/v1/messages`.
15. Call `POST /api/gaster-code/auth/revoke` and verify `/me` rejects the revoked token.

## Known Limitations

- The first MVP confirmation page is backend-rendered HTML, not a full React page.
- 2FA, registration, password reset, OAuth login, and final payment confirmation remain in the existing web flow.
- `can_use_builtin_provider` is a coarse availability flag based on account status, wallet quota, and active subscription quota. Actual model calls still go through normal gateway billing and channel selection.
- Provider token model defaults are server-configurable through environment variables; Gaster Code should not hard-code model names if the API response supplies them.
