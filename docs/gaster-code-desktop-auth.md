# Gaster Code Desktop Auth API

GasterCode 桌面端使用网页登录 + 本地 loopback 回调完成授权。桌面端不收集用户密码，不复用网页 cookie，也不会通过 URL 接收长期 token。

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
  "client_version": "0.1.0"
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
- `redirect_uri` only supports loopback URLs:
  - `http://127.0.0.1:<port>/api/gmaster-auth/callback`
  - `http://localhost:<port>/api/gmaster-auth/callback`

## 2. Desktop Login Page

`GET /gaster-code/desktop-login?request_id=<request_id>`

Behavior:

- If the user is not logged in, the page asks the user to log in through the existing G-Master API web flow.
- If the user is logged in, the page shows an authorization confirmation page.
- Approval redirects to:

```text
http://127.0.0.1:<port>/api/gmaster-auth/callback?code=<one_time_code>&state=<state>
```

- Denial redirects to:

```text
http://127.0.0.1:<port>/api/gmaster-auth/callback?error=access_denied&state=<state>
```

The authorization code is single-use and expires after 5 minutes.

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

## 4. Refresh Token

`POST /api/gaster-code/auth/refresh`

Request:

```json
{
  "refresh_token": "gc_rt_xxx"
}
```

Response shape is the same as `/api/gaster-code/auth/token`. Refresh rotates both access token and refresh token.

## 5. Current User

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
          "upgrade_group": "weekly"
        }
      ]
    },
    "quota": {
      "remaining": 200000,
      "used": 80000,
      "unlimited": false
    },
    "can_use_builtin_provider": true,
    "billing_url": "https://gmapi.fun/console/topup",
    "account_url": "https://gmapi.fun/console/personal"
  }
}
```

## 6. Provider Token

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

## 7. Revoke Desktop Session

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

GasterCode client must know:

```text
G-Master API Base URL: https://gmapi.fun
Loopback callback path: /api/gmaster-auth/callback
PKCE method: S256
Provider api_format: anthropic
```

## Local Test Checklist

1. Start a local callback server at `http://127.0.0.1:<port>/api/gmaster-auth/callback`.
2. Generate `code_verifier`, `code_challenge = BASE64URL(SHA256(code_verifier))`, and `state`.
3. Call `POST /api/gaster-code/auth/start`.
4. Open `data.authorize_url` in the browser.
5. Log in or register through the existing web flow if needed.
6. Approve authorization.
7. Confirm the local callback receives `code` and the original `state`.
8. Call `POST /api/gaster-code/auth/token` with `code`, `code_verifier`, and the same `redirect_uri`.
9. Call `GET /api/gaster-code/me` with `Authorization: Bearer <access_token>`.
10. Call `POST /api/gaster-code/provider-token` with the same bearer token.
11. Use returned `provider.api_key` against `/v1/messages`.
12. Call `POST /api/gaster-code/auth/revoke` and verify `/me` rejects the revoked token.

## Known Limitations

- The first MVP confirmation page is backend-rendered HTML, not a full React page.
- If the existing frontend login page does not preserve the `redirect` query, users may need to return to GasterCode and start login again after signing in.
- 2FA, registration, password reset, OAuth login, and subscription purchase remain in the existing web flow.
- `can_use_builtin_provider` is a coarse availability flag based on account status, wallet quota, and active subscription quota. Actual model calls still go through normal gateway billing and channel selection.
- Provider token model defaults are server-configurable through environment variables; GasterCode should not hard-code model names if the API response supplies them.
