package service

import (
	"crypto/sha256"
	"encoding/base64"
	"net/url"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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
