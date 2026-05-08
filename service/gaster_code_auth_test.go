package service

import (
	"crypto/sha256"
	"encoding/base64"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
)

func pkceChallengeForTest(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func TestValidateGasterCodeRedirectURI(t *testing.T) {
	validURIs := []string{
		"http://127.0.0.1:18790/api/gmaster-auth/callback",
		"http://localhost:18790/api/gmaster-auth/callback",
	}
	for _, redirectURI := range validURIs {
		require.NoError(t, ValidateGasterCodeRedirectURI(redirectURI))
	}

	invalidURIs := []string{
		"https://127.0.0.1:18790/api/gmaster-auth/callback",
		"http://127.0.0.1/api/gmaster-auth/callback",
		"http://127.0.0.1:18790/wrong/callback",
		"http://example.com:18790/api/gmaster-auth/callback",
		"http://127.0.0.1:abc/api/gmaster-auth/callback",
	}
	for _, redirectURI := range invalidURIs {
		require.Error(t, ValidateGasterCodeRedirectURI(redirectURI))
	}
}

func TestGasterCodePKCEExchangeUsesSingleUseAuthorizationCode(t *testing.T) {
	truncate(t)
	const userID = 101
	seedUser(t, userID, 20000)

	verifier := "desktop-test-verifier-with-enough-entropy"
	redirectURI := "http://127.0.0.1:18790/api/gmaster-auth/callback"
	started, err := StartGasterCodeAuth(GasterCodeAuthStartInput{
		CodeChallenge:       pkceChallengeForTest(verifier),
		CodeChallengeMethod: "S256",
		State:               "state-1",
		RedirectURI:         redirectURI,
		ClientName:          "Gaster Code",
		ClientVersion:       "0.1.0",
	}, "https://gmapi.fun")
	require.NoError(t, err)
	require.Contains(t, started.AuthorizeURL, "/gaster-code/desktop-login?request_id=")
	require.NotEmpty(t, started.RequestID)

	redirected, err := ApproveGasterCodeAuthRequest(started.RequestID, userID)
	require.NoError(t, err)
	parsedRedirect, err := url.Parse(redirected)
	require.NoError(t, err)
	code := parsedRedirect.Query().Get("code")
	require.NotEmpty(t, code)
	assert.Equal(t, "state-1", parsedRedirect.Query().Get("state"))

	exchanged, err := ExchangeGasterCodeAuthCode(GasterCodeTokenExchangeInput{
		Code:         code,
		CodeVerifier: verifier,
		RedirectURI:  redirectURI,
	})
	require.NoError(t, err)
	require.NotEmpty(t, exchanged.AccessToken)
	require.NotEmpty(t, exchanged.RefreshToken)
	require.Equal(t, userID, exchanged.User.Id)

	_, err = ExchangeGasterCodeAuthCode(GasterCodeTokenExchangeInput{
		Code:         code,
		CodeVerifier: verifier,
		RedirectURI:  redirectURI,
	})
	require.Error(t, err)
}

func TestGasterCodePKCEExchangeRejectsWrongVerifier(t *testing.T) {
	truncate(t)
	const userID = 102
	seedUser(t, userID, 20000)

	redirectURI := "http://localhost:18790/api/gmaster-auth/callback"
	started, err := StartGasterCodeAuth(GasterCodeAuthStartInput{
		CodeChallenge:       pkceChallengeForTest("correct-verifier-with-enough-entropy"),
		CodeChallengeMethod: "S256",
		State:               "state-2",
		RedirectURI:         redirectURI,
		ClientName:          "Gaster Code",
		ClientVersion:       "0.1.0",
	}, "https://gmapi.fun")
	require.NoError(t, err)

	redirected, err := ApproveGasterCodeAuthRequest(started.RequestID, userID)
	require.NoError(t, err)
	parsedRedirect, err := url.Parse(redirected)
	require.NoError(t, err)

	_, err = ExchangeGasterCodeAuthCode(GasterCodeTokenExchangeInput{
		Code:         parsedRedirect.Query().Get("code"),
		CodeVerifier: "wrong-verifier",
		RedirectURI:  redirectURI,
	})
	require.Error(t, err)

	var authReq model.GasterCodeAuthRequest
	require.NoError(t, model.DB.Where("request_id = ?", started.RequestID).First(&authReq).Error)
	assert.Equal(t, model.GasterCodeAuthStatusApproved, authReq.Status)
}

func TestStartGasterCodeAuthBuildsAuthorizeURLByIntent(t *testing.T) {
	truncate(t)
	redirectURI := "http://127.0.0.1:18790/api/gmaster-auth/callback"
	challenge := pkceChallengeForTest("desktop-test-verifier-with-enough-entropy")

	tests := []struct {
		name         string
		intent       string
		wantPath     string
		wantRedirect bool
	}{
		{
			name:     "explicit login intent uses login authorization page",
			intent:   "login",
			wantPath: "/gaster-code/desktop-login",
		},
		{
			name:     "missing intent defaults to login authorization page",
			intent:   "",
			wantPath: "/gaster-code/desktop-login",
		},
		{
			name:         "register intent uses registration-first page",
			intent:       "register",
			wantPath:     "/register",
			wantRedirect: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			started, err := StartGasterCodeAuth(GasterCodeAuthStartInput{
				CodeChallenge:       challenge,
				CodeChallengeMethod: "S256",
				State:               "state-" + tt.name,
				RedirectURI:         redirectURI,
				ClientName:          "Gaster Code",
				ClientVersion:       "0.2.1-gastercode.test",
				Intent:              tt.intent,
			}, "https://gmapi.fun")
			require.NoError(t, err)

			parsedURL, err := url.Parse(started.AuthorizeURL)
			require.NoError(t, err)
			assert.Equal(t, tt.wantPath, parsedURL.Path)

			if tt.wantRedirect {
				target := parsedURL.Query().Get("redirect")
				require.NotEmpty(t, target)
				parsedTarget, err := url.Parse(target)
				require.NoError(t, err)
				assert.Equal(t, "/gaster-code/desktop-login", parsedTarget.Path)
				assert.Equal(t, started.RequestID, parsedTarget.Query().Get("request_id"))
			} else {
				assert.Equal(t, started.RequestID, parsedURL.Query().Get("request_id"))
			}
		})
	}
}

func TestStartGasterCodeAuthRejectsInvalidIntent(t *testing.T) {
	truncate(t)
	_, err := StartGasterCodeAuth(GasterCodeAuthStartInput{
		CodeChallenge:       pkceChallengeForTest("desktop-test-verifier-with-enough-entropy"),
		CodeChallengeMethod: "S256",
		State:               "state-invalid-intent",
		RedirectURI:         "http://127.0.0.1:18790/api/gmaster-auth/callback",
		ClientName:          "Gaster Code",
		ClientVersion:       "0.2.1-gastercode.test",
		Intent:              "signup",
	}, "https://gmapi.fun")

	require.Error(t, err)
	assert.Contains(t, err.Error(), "intent")
}

func TestGasterCodeRegisterIntentCompletesCallbackAndCodeExchange(t *testing.T) {
	truncate(t)
	const userID = 105
	seedUser(t, userID, 20000)

	verifier := "desktop-register-verifier-with-enough-entropy"
	redirectURI := "http://localhost:18790/api/gmaster-auth/callback"
	started, err := StartGasterCodeAuth(GasterCodeAuthStartInput{
		CodeChallenge:       pkceChallengeForTest(verifier),
		CodeChallengeMethod: "S256",
		State:               "register-state-original-value",
		RedirectURI:         redirectURI,
		ClientName:          "Gaster Code",
		ClientVersion:       "0.2.1-gastercode.test",
		Intent:              "register",
	}, "https://gmapi.fun")
	require.NoError(t, err)
	require.Contains(t, started.AuthorizeURL, "/register?")

	redirected, err := ApproveGasterCodeAuthRequest(started.RequestID, userID)
	require.NoError(t, err)
	parsedRedirect, err := url.Parse(redirected)
	require.NoError(t, err)
	code := parsedRedirect.Query().Get("code")
	require.NotEmpty(t, code)
	assert.Equal(t, "register-state-original-value", parsedRedirect.Query().Get("state"))

	exchanged, err := ExchangeGasterCodeAuthCode(GasterCodeTokenExchangeInput{
		Code:         code,
		CodeVerifier: verifier,
		RedirectURI:  redirectURI,
	})
	require.NoError(t, err)
	require.NotEmpty(t, exchanged.AccessToken)
	require.NotEmpty(t, exchanged.RefreshToken)
	require.Equal(t, userID, exchanged.User.Id)
}

func TestGasterCodeProviderTokenUsesCurrentUserGroupWhenCreated(t *testing.T) {
	truncate(t)
	const userID = 103
	const userGroup = "VIP用户组"
	user := &model.User{
		Id:       userID,
		Username: "vip_user",
		Quota:    20000,
		Status:   common.UserStatusEnabled,
		Group:    userGroup,
	}
	require.NoError(t, model.DB.Create(user).Error)
	session := &model.GasterCodeSession{
		UserID:           userID,
		AccessTokenHash:  "access_hash_created",
		RefreshTokenHash: "refresh_hash_created",
		ExpiresAt:        4102444800,
		RefreshExpiresAt: 4102444800,
	}
	require.NoError(t, model.DB.Create(session).Error)

	_, err := GetOrCreateGasterCodeProviderToken(session, "https://gmapi.fun")
	require.NoError(t, err)
	require.NotZero(t, session.ProviderTokenID)

	var token model.Token
	require.NoError(t, model.DB.First(&token, session.ProviderTokenID).Error)
	assert.Equal(t, userGroup, token.Group)
}

func TestGasterCodeProviderTokenSyncsReusableTokenToCurrentUserGroup(t *testing.T) {
	truncate(t)
	const userID = 104
	const userGroup = "VIP用户组"
	user := &model.User{
		Id:       userID,
		Username: "vip_user_reuse",
		Quota:    20000,
		Status:   common.UserStatusEnabled,
		Group:    userGroup,
	}
	require.NoError(t, model.DB.Create(user).Error)
	token := &model.Token{
		UserId:         userID,
		Key:            "sk-reusable-gaster-code-token",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          "",
	}
	require.NoError(t, model.DB.Create(token).Error)
	session := &model.GasterCodeSession{
		UserID:           userID,
		AccessTokenHash:  "access_hash_reused",
		RefreshTokenHash: "refresh_hash_reused",
		ProviderTokenID:  token.Id,
		ExpiresAt:        4102444800,
		RefreshExpiresAt: 4102444800,
	}
	require.NoError(t, model.DB.Create(session).Error)

	_, err := GetOrCreateGasterCodeProviderToken(session, "https://gmapi.fun")
	require.NoError(t, err)

	var updated model.Token
	require.NoError(t, model.DB.First(&updated, token.Id).Error)
	assert.Equal(t, userGroup, updated.Group)
}

func TestListGasterCodeOAuthLoginsReturnsSessionScopedUsage(t *testing.T) {
	truncate(t)
	now := common.GetTimestamp()
	userA := &model.User{
		Id:          201,
		Username:    "vip_user",
		DisplayName: "VIP User",
		Email:       "vip@example.com",
		Quota:       10000,
		Status:      common.UserStatusEnabled,
		Group:       "VIP用户组",
		AffCode:     "aff-vip-oauth",
	}
	userB := &model.User{
		Id:          202,
		Username:    "normal_user",
		DisplayName: "Normal User",
		Email:       "normal@example.com",
		Quota:       10000,
		Status:      common.UserStatusEnabled,
		Group:       "用户分组",
		AffCode:     "aff-normal-oauth",
	}
	require.NoError(t, model.DB.Create(userA).Error)
	require.NoError(t, model.DB.Create(userB).Error)
	tokenA := &model.Token{
		UserId:         userA.Id,
		Key:            "sk-gaster-a",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          userA.Group,
		UsedQuota:      900,
	}
	tokenB := &model.Token{
		UserId:         userB.Id,
		Key:            "sk-gaster-b",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          userB.Group,
		UsedQuota:      300,
	}
	require.NoError(t, model.DB.Create(tokenA).Error)
	require.NoError(t, model.DB.Create(tokenB).Error)
	sessionA := &model.GasterCodeSession{
		UserID:           userA.Id,
		AccessTokenHash:  "oauth_usage_access_a",
		RefreshTokenHash: "oauth_usage_refresh_a",
		ClientName:       "Gaster Code",
		ClientVersion:    "1.2.0",
		ProviderTokenID:  tokenA.Id,
		ExpiresAt:        now + 3600,
		RefreshExpiresAt: now + 7200,
		LastUsedAt:       now - 10,
	}
	sessionB := &model.GasterCodeSession{
		UserID:           userB.Id,
		AccessTokenHash:  "oauth_usage_access_b",
		RefreshTokenHash: "oauth_usage_refresh_b",
		ClientName:       "Gaster Code",
		ClientVersion:    "1.1.0",
		ProviderTokenID:  tokenB.Id,
		ExpiresAt:        now + 3600,
		RefreshExpiresAt: now + 7200,
		LastUsedAt:       now - 20,
	}
	require.NoError(t, model.DB.Create(sessionA).Error)
	require.NoError(t, model.DB.Create(sessionB).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{
		UserId:           userA.Id,
		Username:         userA.Username,
		CreatedAt:        now - 9,
		Type:             model.LogTypeConsume,
		TokenId:          tokenA.Id,
		TokenName:        tokenA.Name,
		Quota:            600,
		PromptTokens:     20,
		CompletionTokens: 30,
	}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{
		UserId:           userA.Id,
		Username:         userA.Username,
		CreatedAt:        now - 8,
		Type:             model.LogTypeConsume,
		TokenId:          tokenA.Id,
		TokenName:        tokenA.Name,
		Quota:            300,
		PromptTokens:     10,
		CompletionTokens: 15,
	}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{
		UserId:           userB.Id,
		Username:         userB.Username,
		CreatedAt:        now - 7,
		Type:             model.LogTypeConsume,
		TokenId:          tokenB.Id,
		TokenName:        tokenB.Name,
		Quota:            300,
		PromptTokens:     5,
		CompletionTokens: 6,
	}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{
		UserId:    userA.Id,
		Username:  userA.Username,
		CreatedAt: now - 6,
		Type:      model.LogTypeError,
		TokenId:   tokenA.Id,
		TokenName: tokenA.Name,
		Quota:     999,
	}).Error)

	rows, total, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{
		StartIdx: 0,
		Limit:    20,
		Now:      now,
	})

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
	user := &model.User{
		Id:          203,
		Username:    "desktop_admin",
		DisplayName: "Desktop Admin",
		Email:       "desktop@example.com",
		Quota:       10000,
		Status:      common.UserStatusEnabled,
		Group:       "VIP用户组",
		AffCode:     "aff-desktop-oauth",
	}
	require.NoError(t, model.DB.Create(user).Error)
	activeToken := &model.Token{
		UserId:         user.Id,
		Key:            "sk-active-token",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          user.Group,
	}
	expiredToken := &model.Token{
		UserId:         user.Id,
		Key:            "sk-expired-token",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          user.Group,
	}
	revokedToken := &model.Token{
		UserId:         user.Id,
		Key:            "sk-revoked-token",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          user.Group,
	}
	require.NoError(t, model.DB.Create(activeToken).Error)
	require.NoError(t, model.DB.Create(expiredToken).Error)
	require.NoError(t, model.DB.Create(revokedToken).Error)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{
		UserID:           user.Id,
		AccessTokenHash:  "oauth_active_access",
		RefreshTokenHash: "oauth_active_refresh",
		ClientName:       "Gaster Code Canary",
		ProviderTokenID:  activeToken.Id,
		ExpiresAt:        now + 3600,
		RefreshExpiresAt: now + 7200,
	}).Error)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{
		UserID:           user.Id,
		AccessTokenHash:  "oauth_expired_access",
		RefreshTokenHash: "oauth_expired_refresh",
		ClientName:       "Gaster Code Stable",
		ProviderTokenID:  expiredToken.Id,
		ExpiresAt:        now - 1,
		RefreshExpiresAt: now + 7200,
	}).Error)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{
		UserID:           user.Id,
		AccessTokenHash:  "oauth_revoked_access",
		RefreshTokenHash: "oauth_revoked_refresh",
		ClientName:       "Gaster Code Revoked",
		ProviderTokenID:  revokedToken.Id,
		ExpiresAt:        now + 3600,
		RefreshExpiresAt: now + 7200,
		RevokedAt:        now - 30,
	}).Error)

	activeRows, activeTotal, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{
		Status:   model.GasterCodeOAuthLoginStatusActive,
		StartIdx: 0,
		Limit:    20,
		Now:      now,
	})
	require.NoError(t, err)
	require.Equal(t, int64(1), activeTotal)
	require.Len(t, activeRows, 1)
	assert.Equal(t, "Gaster Code Canary", activeRows[0].ClientName)

	keywordRows, keywordTotal, err := model.ListGasterCodeOAuthLogins(model.GasterCodeOAuthLoginQuery{
		Keyword:  "stable",
		StartIdx: 0,
		Limit:    20,
		Now:      now,
	})
	require.NoError(t, err)
	require.Equal(t, int64(1), keywordTotal)
	require.Len(t, keywordRows, 1)
	assert.Equal(t, model.GasterCodeOAuthLoginStatusExpired, keywordRows[0].SessionStatus)
}
