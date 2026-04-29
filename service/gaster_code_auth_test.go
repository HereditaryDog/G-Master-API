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
