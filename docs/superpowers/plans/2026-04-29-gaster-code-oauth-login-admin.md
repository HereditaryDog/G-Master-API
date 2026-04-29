# Gaster Code OAuth 登录管理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-only OAuth 登录管理 page that lists each Gaster Code desktop OAuth authorization session and its session-scoped usage.

**Architecture:** The backend will expose a paginated admin endpoint under `/api/gaster-code/admin/oauth-logins`. The model layer will query `gaster_code_sessions` with user and provider token metadata, then batch aggregate usage from `LOG_DB` by `provider_token_id` to stay compatible with separate log databases. The frontend will add an admin route, sidebar entry, sidebar settings switch, and a CardPro/CardTable page that follows existing table patterns.

**Tech Stack:** Go 1.22, Gin, GORM, SQLite/MySQL/PostgreSQL-compatible queries, React 18, Vite, Semi UI, Bun.

---

### Task 1: Backend Session Listing Model

**Files:**
- Modify: `model/gaster_code_auth.go`
- Test: `service/gaster_code_auth_test.go`

- [ ] **Step 1: Write the failing tests**

Add tests to `service/gaster_code_auth_test.go`:

```go
func TestListGasterCodeOAuthLoginsReturnsSessionScopedUsage(t *testing.T) {
	truncate(t)
	now := common.GetTimestamp()
	userA := &model.User{Id: 201, Username: "vip_user", DisplayName: "VIP User", Email: "vip@example.com", Quota: 10000, Status: common.UserStatusEnabled, Group: "VIP用户组"}
	userB := &model.User{Id: 202, Username: "normal_user", DisplayName: "Normal User", Email: "normal@example.com", Quota: 10000, Status: common.UserStatusEnabled, Group: "用户分组"}
	require.NoError(t, model.DB.Create(userA).Error)
	require.NoError(t, model.DB.Create(userB).Error)
	tokenA := &model.Token{UserId: userA.Id, Key: "sk-gaster-a", Name: "Gaster Code Desktop", Status: common.TokenStatusEnabled, ExpiredTime: -1, UnlimitedQuota: true, Group: userA.Group, UsedQuota: 900}
	tokenB := &model.Token{UserId: userB.Id, Key: "sk-gaster-b", Name: "Gaster Code Desktop", Status: common.TokenStatusEnabled, ExpiredTime: -1, UnlimitedQuota: true, Group: userB.Group, UsedQuota: 300}
	require.NoError(t, model.DB.Create(tokenA).Error)
	require.NoError(t, model.DB.Create(tokenB).Error)
	sessionA := &model.GasterCodeSession{UserID: userA.Id, AccessTokenHash: "oauth_usage_access_a", RefreshTokenHash: "oauth_usage_refresh_a", ClientName: "Gaster Code", ClientVersion: "1.2.0", ProviderTokenID: tokenA.Id, ExpiresAt: now + 3600, RefreshExpiresAt: now + 7200, LastUsedAt: now - 10}
	sessionB := &model.GasterCodeSession{UserID: userB.Id, AccessTokenHash: "oauth_usage_access_b", RefreshTokenHash: "oauth_usage_refresh_b", ClientName: "Gaster Code", ClientVersion: "1.1.0", ProviderTokenID: tokenB.Id, ExpiresAt: now + 3600, RefreshExpiresAt: now + 7200, LastUsedAt: now - 20}
	require.NoError(t, model.DB.Create(sessionA).Error)
	require.NoError(t, model.DB.Create(sessionB).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{UserId: userA.Id, Username: userA.Username, CreatedAt: now - 9, Type: model.LogTypeConsume, TokenId: tokenA.Id, TokenName: tokenA.Name, Quota: 600, PromptTokens: 20, CompletionTokens: 30}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{UserId: userA.Id, Username: userA.Username, CreatedAt: now - 8, Type: model.LogTypeConsume, TokenId: tokenA.Id, TokenName: tokenA.Name, Quota: 300, PromptTokens: 10, CompletionTokens: 15}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{UserId: userB.Id, Username: userB.Username, CreatedAt: now - 7, Type: model.LogTypeConsume, TokenId: tokenB.Id, TokenName: tokenB.Name, Quota: 300, PromptTokens: 5, CompletionTokens: 6}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{UserId: userA.Id, Username: userA.Username, CreatedAt: now - 6, Type: model.LogTypeError, TokenId: tokenA.Id, TokenName: tokenA.Name, Quota: 999}).Error)

	rows, total, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{StartIdx: 0, Limit: 20, Now: now})

	require.NoError(t, err)
	require.Equal(t, int64(2), total)
	require.Len(t, rows, 2)
	assert.Equal(t, sessionB.Id, rows[0].SessionID)
	assert.Equal(t, "normal_user", rows[0].Username)
	assert.Equal(t, 1, rows[0].RequestCount)
	assert.Equal(t, 300, rows[0].UsedQuota)
	assert.Equal(t, 5, rows[0].PromptTokens)
	assert.Equal(t, 6, rows[0].CompletionTokens)
	assert.Equal(t, model.GasterCodeOAuthLoginStatusActive, rows[0].SessionStatus)
	assert.Equal(t, sessionA.Id, rows[1].SessionID)
	assert.Equal(t, 2, rows[1].RequestCount)
	assert.Equal(t, 900, rows[1].UsedQuota)
	assert.Equal(t, 30, rows[1].PromptTokens)
	assert.Equal(t, 45, rows[1].CompletionTokens)
}

func TestListGasterCodeOAuthLoginsFiltersStatusAndKeyword(t *testing.T) {
	truncate(t)
	now := common.GetTimestamp()
	user := &model.User{Id: 203, Username: "desktop_admin", DisplayName: "Desktop Admin", Email: "desktop@example.com", Quota: 10000, Status: common.UserStatusEnabled, Group: "VIP用户组"}
	require.NoError(t, model.DB.Create(user).Error)
	activeToken := &model.Token{UserId: user.Id, Key: "sk-active-token", Name: "Gaster Code Desktop", Status: common.TokenStatusEnabled, ExpiredTime: -1, UnlimitedQuota: true, Group: user.Group}
	expiredToken := &model.Token{UserId: user.Id, Key: "sk-expired-token", Name: "Gaster Code Desktop", Status: common.TokenStatusEnabled, ExpiredTime: -1, UnlimitedQuota: true, Group: user.Group}
	revokedToken := &model.Token{UserId: user.Id, Key: "sk-revoked-token", Name: "Gaster Code Desktop", Status: common.TokenStatusEnabled, ExpiredTime: -1, UnlimitedQuota: true, Group: user.Group}
	require.NoError(t, model.DB.Create(activeToken).Error)
	require.NoError(t, model.DB.Create(expiredToken).Error)
	require.NoError(t, model.DB.Create(revokedToken).Error)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{UserID: user.Id, AccessTokenHash: "oauth_active_access", RefreshTokenHash: "oauth_active_refresh", ClientName: "Gaster Code Canary", ProviderTokenID: activeToken.Id, ExpiresAt: now + 3600, RefreshExpiresAt: now + 7200}).Error)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{UserID: user.Id, AccessTokenHash: "oauth_expired_access", RefreshTokenHash: "oauth_expired_refresh", ClientName: "Gaster Code Stable", ProviderTokenID: expiredToken.Id, ExpiresAt: now - 1, RefreshExpiresAt: now + 7200}).Error)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{UserID: user.Id, AccessTokenHash: "oauth_revoked_access", RefreshTokenHash: "oauth_revoked_refresh", ClientName: "Gaster Code Revoked", ProviderTokenID: revokedToken.Id, ExpiresAt: now + 3600, RefreshExpiresAt: now + 7200, RevokedAt: now - 30}).Error)

	activeRows, activeTotal, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{Status: model.GasterCodeOAuthLoginStatusActive, StartIdx: 0, Limit: 20, Now: now})
	require.NoError(t, err)
	require.Equal(t, int64(1), activeTotal)
	require.Len(t, activeRows, 1)
	assert.Equal(t, "Gaster Code Canary", activeRows[0].ClientName)

	keywordRows, keywordTotal, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{Keyword: "stable", StartIdx: 0, Limit: 20, Now: now})
	require.NoError(t, err)
	require.Equal(t, int64(1), keywordTotal)
	require.Len(t, keywordRows, 1)
	assert.Equal(t, model.GasterCodeOAuthLoginStatusExpired, keywordRows[0].SessionStatus)
}
```

- [ ] **Step 2: Run tests and verify RED**

Run:

```bash
go test ./service -run 'TestListGasterCodeOAuthLogins' -count=1
```

Expected: FAIL because `model.ListGasterCodeOAuthLogins`, `model.GasterCodeOAuthLoginQuery`, and status constants do not exist.

- [ ] **Step 3: Implement model query and usage aggregation**

Add to `model/gaster_code_auth.go`:

```go
const (
	GasterCodeOAuthLoginStatusActive  = "active"
	GasterCodeOAuthLoginStatusExpired = "expired"
	GasterCodeOAuthLoginStatusRevoked = "revoked"
)

type GasterCodeOAuthLoginQuery struct {
	Keyword  string
	Status   string
	StartIdx int
	Limit    int
	Now      int64
}

type GasterCodeOAuthLogin struct {
	SessionID              int    `json:"session_id" gorm:"column:session_id"`
	UserID                 int    `json:"user_id" gorm:"column:user_id"`
	Username               string `json:"username" gorm:"column:username"`
	DisplayName            string `json:"display_name" gorm:"column:display_name"`
	Email                  string `json:"email" gorm:"column:email"`
	UserGroup              string `json:"user_group" gorm:"column:user_group"`
	UserStatus             int    `json:"user_status" gorm:"column:user_status"`
	ClientName             string `json:"client_name" gorm:"column:client_name"`
	ClientVersion          string `json:"client_version" gorm:"column:client_version"`
	ProviderTokenID        int    `json:"provider_token_id" gorm:"column:provider_token_id"`
	ProviderTokenName      string `json:"provider_token_name" gorm:"column:provider_token_name"`
	ProviderTokenGroup     string `json:"provider_token_group" gorm:"column:provider_token_group"`
	ProviderTokenStatus    int    `json:"provider_token_status" gorm:"column:provider_token_status"`
	ProviderTokenUsedQuota int    `json:"provider_token_used_quota" gorm:"column:provider_token_used_quota"`
	SessionStatus          string `json:"session_status" gorm:"-"`
	CreatedAt              int64  `json:"created_at" gorm:"column:created_at"`
	LastUsedAt             int64  `json:"last_used_at" gorm:"column:last_used_at"`
	ExpiresAt              int64  `json:"expires_at" gorm:"column:expires_at"`
	RevokedAt              int64  `json:"revoked_at" gorm:"column:revoked_at"`
	RequestCount           int    `json:"request_count" gorm:"-"`
	UsedQuota              int    `json:"used_quota" gorm:"-"`
	PromptTokens           int    `json:"prompt_tokens" gorm:"-"`
	CompletionTokens       int    `json:"completion_tokens" gorm:"-"`
}
```

Implement `ListGasterCodeOAuthLogins(query GasterCodeOAuthLoginQuery) ([]*GasterCodeOAuthLogin, int64, error)` using `DB.Table("gaster_code_sessions AS s")`, joins to `users AS u` and `tokens AS t`, GORM `Where`, `Count`, `Order("s.id desc")`, `Limit`, `Offset`, then a helper that batch scans usage from `LOG_DB.Table("logs")` grouped by `token_id`.

- [ ] **Step 4: Run tests and verify GREEN**

Run:

```bash
go test ./service -run 'TestListGasterCodeOAuthLogins' -count=1
```

Expected: PASS.

### Task 2: Backend Controller And Route

**Files:**
- Modify: `controller/gaster_code.go`
- Modify: `router/api-router.go`

- [ ] **Step 1: Add controller**

Add `strconv` import if needed and implement:

```go
func AdminListGasterCodeOAuthLogins(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	now := common.GetTimestamp()
	rows, total, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{
		Keyword:  c.Query("keyword"),
		Status:   c.Query("status"),
		StartIdx: pageInfo.GetStartIdx(),
		Limit:    pageInfo.GetPageSize(),
		Now:      now,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(rows)
	common.ApiSuccess(c, pageInfo)
}
```

- [ ] **Step 2: Add route**

In `router/api-router.go`, add an admin-only group near the existing Gaster Code routes:

```go
gasterCodeAdminRoute := apiRouter.Group("/gaster-code/admin")
gasterCodeAdminRoute.Use(middleware.AdminAuth())
{
	gasterCodeAdminRoute.GET("/oauth-logins", controller.AdminListGasterCodeOAuthLogins)
}
```

- [ ] **Step 3: Verify package build**

Run:

```bash
go test ./controller ./router -run TestNonExistent -count=1
```

Expected: packages compile; no matching tests run.

### Task 3: Frontend Data Hook And Page

**Files:**
- Create: `web/src/pages/OAuthLogin/index.jsx`
- Create: `web/src/hooks/oauth-logins/useOAuthLoginsData.jsx`
- Create: `web/src/components/table/oauth-logins/index.jsx`
- Create: `web/src/components/table/oauth-logins/OAuthLoginsTable.jsx`
- Create: `web/src/components/table/oauth-logins/OAuthLoginsColumnDefs.jsx`
- Create: `web/src/components/table/oauth-logins/OAuthLoginsFilters.jsx`
- Create: `web/src/components/table/oauth-logins/OAuthLoginsDescription.jsx`

- [ ] **Step 1: Implement hook**

Create `useOAuthLoginsData.jsx` with state for rows, loading, active page, page size, total, compact mode, keyword, status, and methods `loadOAuthLogins`, `handlePageChange`, `handlePageSizeChange`, `refresh`, `setFilters`.

- [ ] **Step 2: Implement table columns**

Create `OAuthLoginsColumnDefs.jsx` with columns for user, user group, client, status, provider token, usage, request count, tokens, created time, last used time, and expires time. Use existing helpers `renderGroup`, `renderNumber`, `renderQuota`, and `timestamp2string`.

- [ ] **Step 3: Implement filters and description**

Create `OAuthLoginsFilters.jsx` with Semi `Input`, `Select`, and refresh/search buttons. Create `OAuthLoginsDescription.jsx` with compact mode toggle matching nearby table pages.

- [ ] **Step 4: Implement page wrapper**

Create `web/src/components/table/oauth-logins/index.jsx` using `CardPro`, `createCardProPagination`, and `OAuthLoginsTable`. Create `web/src/pages/OAuthLogin/index.jsx` with the same `mt-[60px] px-2` wrapper used by admin pages.

### Task 4: Frontend Route, Sidebar, And Settings

**Files:**
- Modify: `web/src/App.jsx`
- Modify: `web/src/components/layout/SiderBar.jsx`
- Modify: `web/src/helpers/render.jsx`
- Modify: `web/src/hooks/common/useSidebar.js`
- Modify: `web/src/pages/Setting/Operation/SettingsSidebarModulesAdmin.jsx`
- Modify: `web/src/components/settings/personal/cards/NotificationSettings.jsx`

- [ ] **Step 1: Add route**

Add lazy import:

```jsx
const OAuthLogin = lazy(() => import('./pages/OAuthLogin'));
```

Add route:

```jsx
<Route
  path='/console/oauth-login'
  element={
    <AdminRoute>
      <OAuthLogin />
    </AdminRoute>
  }
/>
```

- [ ] **Step 2: Add sidebar item**

Add router map entry:

```jsx
oauth_login: '/console/oauth-login',
```

Add admin item:

```jsx
{
  text: t('OAuth登录管理'),
  itemKey: 'oauth_login',
  to: '/oauth-login',
  className: isAdmin() ? '' : 'tableHiddle',
}
```

- [ ] **Step 3: Add icon**

Import `ShieldCheck` from `lucide-react` in `web/src/helpers/render.jsx` and return it for `oauth_login`.

- [ ] **Step 4: Add sidebar module defaults and settings switch**

Add `oauth_login: true` to admin defaults in `useSidebar.js`, `SettingsSidebarModulesAdmin.jsx`, and `NotificationSettings.jsx`. Add a settings module card with title `OAuth登录管理` and description `Gaster Code 授权登录记录`.

### Task 5: Verification

**Files:**
- Modify as needed only if verification exposes defects.

- [ ] **Step 1: Run focused backend tests**

Run:

```bash
go test ./service -run 'TestGasterCode|TestListGasterCodeOAuthLogins' -count=1
```

Expected: PASS.

- [ ] **Step 2: Run broader backend compile/test**

Run:

```bash
go test ./model ./controller ./service -count=1
```

Expected: PASS.

- [ ] **Step 3: Run frontend build**

Run:

```bash
cd web && bun run build
```

Expected: PASS.

- [ ] **Step 4: Final git review**

Run:

```bash
git status --short
git diff --stat
```

Expected: only intended files changed.
