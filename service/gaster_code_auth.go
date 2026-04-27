package service

import (
	"crypto/sha256"
	"crypto/subtle"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"strings"

	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
	"gorm.io/gorm"
)

const (
	gasterCodePKCEMethodS256 = "S256"
	gasterCodeCallbackPath   = "/api/gmaster-auth/callback"
	gasterCodeAuthCodeTTL    = 5 * 60
	gasterCodePendingTTL     = 10 * 60
)

type GasterCodeAuthStartInput struct {
	CodeChallenge       string
	CodeChallengeMethod string
	State               string
	RedirectURI         string
	ClientName          string
	ClientVersion       string
}

type GasterCodeAuthStartResult struct {
	RequestID    string `json:"request_id"`
	AuthorizeURL string `json:"authorize_url"`
	ExpiresAt    int64  `json:"expires_at"`
}

type GasterCodeTokenExchangeInput struct {
	Code         string
	CodeVerifier string
	RedirectURI  string
}

type GasterCodeUserInfo struct {
	Id          int    `json:"id"`
	Username    string `json:"username"`
	DisplayName string `json:"display_name"`
	Email       string `json:"email,omitempty"`
	Group       string `json:"group"`
}

type GasterCodeTokenResult struct {
	AccessToken  string             `json:"access_token"`
	RefreshToken string             `json:"refresh_token"`
	ExpiresAt    int64              `json:"expires_at"`
	User         GasterCodeUserInfo `json:"user"`
}

type GasterCodeSubscriptionInfo struct {
	Id              int    `json:"id"`
	PlanId          int    `json:"plan_id"`
	Status          string `json:"status"`
	StartTime       int64  `json:"start_time"`
	EndTime         int64  `json:"end_time"`
	AmountTotal     int64  `json:"amount_total"`
	AmountUsed      int64  `json:"amount_used"`
	AmountRemaining int64  `json:"amount_remaining"`
	Unlimited       bool   `json:"unlimited"`
	UpgradeGroup    string `json:"upgrade_group"`
}

type GasterCodeSubscriptionSnapshot struct {
	Active bool                         `json:"active"`
	Items  []GasterCodeSubscriptionInfo `json:"items"`
}

type GasterCodeQuotaSnapshot struct {
	Remaining int  `json:"remaining"`
	Used      int  `json:"used"`
	Unlimited bool `json:"unlimited"`
}

type GasterCodeMeResult struct {
	User                  GasterCodeUserInfo             `json:"user"`
	Subscription          GasterCodeSubscriptionSnapshot `json:"subscription"`
	Quota                 GasterCodeQuotaSnapshot        `json:"quota"`
	CanUseBuiltinProvider bool                           `json:"can_use_builtin_provider"`
	BillingURL            string                         `json:"billing_url"`
	AccountURL            string                         `json:"account_url"`
}

type GasterCodeProviderModels struct {
	Main   string `json:"main"`
	Haiku  string `json:"haiku"`
	Sonnet string `json:"sonnet"`
	Opus   string `json:"opus"`
}

type GasterCodeProviderInfo struct {
	Name      string                   `json:"name"`
	BaseURL   string                   `json:"base_url"`
	APIFormat string                   `json:"api_format"`
	APIKey    string                   `json:"api_key"`
	Models    GasterCodeProviderModels `json:"models"`
}

type GasterCodeProviderTokenResult struct {
	Provider GasterCodeProviderInfo `json:"provider"`
}

func ValidateGasterCodeRedirectURI(redirectURI string) error {
	parsed, err := url.Parse(strings.TrimSpace(redirectURI))
	if err != nil {
		return fmt.Errorf("invalid redirect_uri: %w", err)
	}
	if parsed.Scheme != "http" {
		return errors.New("redirect_uri scheme must be http")
	}
	if parsed.User != nil {
		return errors.New("redirect_uri must not include user info")
	}
	host := parsed.Hostname()
	if host != "127.0.0.1" && host != "localhost" {
		return errors.New("redirect_uri host must be 127.0.0.1 or localhost")
	}
	port := parsed.Port()
	if port == "" {
		return errors.New("redirect_uri must include a loopback port")
	}
	portNum, err := strconv.Atoi(port)
	if err != nil || portNum < 1 || portNum > 65535 {
		return errors.New("redirect_uri port is invalid")
	}
	if parsed.Path != gasterCodeCallbackPath {
		return fmt.Errorf("redirect_uri path must be %s", gasterCodeCallbackPath)
	}
	if parsed.Fragment != "" {
		return errors.New("redirect_uri must not include a fragment")
	}
	return nil
}

func StartGasterCodeAuth(input GasterCodeAuthStartInput, publicBaseURL string) (*GasterCodeAuthStartResult, error) {
	input.CodeChallenge = strings.TrimSpace(input.CodeChallenge)
	input.CodeChallengeMethod = strings.TrimSpace(input.CodeChallengeMethod)
	input.State = strings.TrimSpace(input.State)
	input.RedirectURI = strings.TrimSpace(input.RedirectURI)
	input.ClientName = strings.TrimSpace(input.ClientName)
	input.ClientVersion = strings.TrimSpace(input.ClientVersion)

	if input.CodeChallenge == "" || input.State == "" || input.RedirectURI == "" {
		return nil, errors.New("code_challenge, state and redirect_uri are required")
	}
	if input.CodeChallengeMethod != gasterCodePKCEMethodS256 {
		return nil, errors.New("only S256 code_challenge_method is supported")
	}
	if len(input.CodeChallenge) < 32 || len(input.CodeChallenge) > 128 {
		return nil, errors.New("code_challenge length is invalid")
	}
	if len(input.State) > 512 {
		return nil, errors.New("state is too long")
	}
	if err := ValidateGasterCodeRedirectURI(input.RedirectURI); err != nil {
		return nil, err
	}

	requestID, err := randomGasterCodeSecret("gcr_", 40)
	if err != nil {
		return nil, err
	}
	now := common.GetTimestamp()
	req := &model.GasterCodeAuthRequest{
		RequestID:           requestID,
		CodeChallenge:       input.CodeChallenge,
		CodeChallengeMethod: input.CodeChallengeMethod,
		State:               input.State,
		RedirectURI:         input.RedirectURI,
		ClientName:          common.GetStringIfEmpty(input.ClientName, "Gaster Code"),
		ClientVersion:       input.ClientVersion,
		Status:              model.GasterCodeAuthStatusPending,
		ExpiresAt:           now + gasterCodePendingTTL,
	}
	if err := model.CreateGasterCodeAuthRequest(req); err != nil {
		return nil, err
	}
	return &GasterCodeAuthStartResult{
		RequestID:    requestID,
		AuthorizeURL: buildGasterCodeAuthorizeURL(publicBaseURL, requestID),
		ExpiresAt:    req.ExpiresAt,
	}, nil
}

func ApproveGasterCodeAuthRequest(requestID string, userID int) (string, error) {
	if userID <= 0 {
		return "", errors.New("user is not logged in")
	}
	req, err := model.GetGasterCodeAuthRequestByRequestID(strings.TrimSpace(requestID))
	if err != nil {
		return "", err
	}
	now := common.GetTimestamp()
	if req.Status != model.GasterCodeAuthStatusPending || req.ExpiresAt <= now {
		return "", errors.New("authorization request is expired or no longer pending")
	}
	code, err := randomGasterCodeSecret("gc_code_", 48)
	if err != nil {
		return "", err
	}
	codeHash := HashGasterCodeSecret(code)
	updates := map[string]interface{}{
		"user_id":         userID,
		"status":          model.GasterCodeAuthStatusApproved,
		"auth_code_hash":  codeHash,
		"code_expires_at": now + gasterCodeAuthCodeTTL,
		"updated_at":      now,
	}
	res := model.DB.Model(req).Where("status = ?", model.GasterCodeAuthStatusPending).Updates(updates)
	if res.Error != nil {
		return "", res.Error
	}
	if res.RowsAffected != 1 {
		return "", errors.New("authorization request could not be approved")
	}
	return buildGasterCodeCallbackURL(req.RedirectURI, map[string]string{
		"code":  code,
		"state": req.State,
	})
}

func DenyGasterCodeAuthRequest(requestID string) (string, error) {
	req, err := model.GetGasterCodeAuthRequestByRequestID(strings.TrimSpace(requestID))
	if err != nil {
		return "", err
	}
	now := common.GetTimestamp()
	if req.Status == model.GasterCodeAuthStatusPending {
		if err := model.DB.Model(req).Updates(map[string]interface{}{
			"status":     model.GasterCodeAuthStatusDenied,
			"updated_at": now,
		}).Error; err != nil {
			return "", err
		}
	}
	return buildGasterCodeCallbackURL(req.RedirectURI, map[string]string{
		"error": "access_denied",
		"state": req.State,
	})
}

func ExchangeGasterCodeAuthCode(input GasterCodeTokenExchangeInput) (*GasterCodeTokenResult, error) {
	input.Code = strings.TrimSpace(input.Code)
	input.CodeVerifier = strings.TrimSpace(input.CodeVerifier)
	input.RedirectURI = strings.TrimSpace(input.RedirectURI)
	if input.Code == "" || input.CodeVerifier == "" || input.RedirectURI == "" {
		return nil, errors.New("code, code_verifier and redirect_uri are required")
	}
	if err := ValidateGasterCodeRedirectURI(input.RedirectURI); err != nil {
		return nil, err
	}

	now := common.GetTimestamp()
	codeHash := HashGasterCodeSecret(input.Code)
	var sessionToken *GasterCodeTokenResult
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		var req model.GasterCodeAuthRequest
		if err := tx.Where("auth_code_hash = ?", codeHash).First(&req).Error; err != nil {
			return errors.New("authorization code is invalid")
		}
		if req.Status != model.GasterCodeAuthStatusApproved || req.CodeExpiresAt <= now {
			return errors.New("authorization code is expired or already used")
		}
		if req.RedirectURI != input.RedirectURI {
			return errors.New("redirect_uri does not match authorization request")
		}
		expectedChallenge := buildPKCES256Challenge(input.CodeVerifier)
		if subtle.ConstantTimeCompare([]byte(expectedChallenge), []byte(req.CodeChallenge)) != 1 {
			return errors.New("code_verifier is invalid")
		}

		res := tx.Model(&model.GasterCodeAuthRequest{}).
			Where("id = ? AND status = ?", req.Id, model.GasterCodeAuthStatusApproved).
			Updates(map[string]interface{}{
				"status":     model.GasterCodeAuthStatusUsed,
				"updated_at": now,
			})
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected != 1 {
			return errors.New("authorization code is already used")
		}

		result, session, err := createGasterCodeSessionTokensTx(tx, req.UserID, req.ClientName, req.ClientVersion, now)
		if err != nil {
			return err
		}
		if err := tx.Create(session).Error; err != nil {
			return err
		}
		sessionToken = result
		return nil
	})
	if err != nil {
		return nil, err
	}
	return sessionToken, nil
}

func RefreshGasterCodeToken(refreshToken string) (*GasterCodeTokenResult, error) {
	refreshToken = strings.TrimSpace(refreshToken)
	if refreshToken == "" {
		return nil, errors.New("refresh_token is required")
	}
	now := common.GetTimestamp()
	refreshHash := HashGasterCodeSecret(refreshToken)
	var result *GasterCodeTokenResult
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		var session model.GasterCodeSession
		if err := tx.Where("refresh_token_hash = ? AND revoked_at = 0 AND refresh_expires_at > ?", refreshHash, now).
			First(&session).Error; err != nil {
			return errors.New("refresh_token is invalid")
		}
		tokenResult, _, accessHash, newRefreshHash, err := issueGasterCodeTokenPairTx(tx, session.UserID, now)
		if err != nil {
			return err
		}
		if err := tx.Model(&session).Updates(map[string]interface{}{
			"access_token_hash":  accessHash,
			"refresh_token_hash": newRefreshHash,
			"expires_at":         tokenResult.ExpiresAt,
			"refresh_expires_at": now + gasterCodeRefreshTokenTTL(),
			"updated_at":         now,
			"last_used_at":       now,
		}).Error; err != nil {
			return err
		}
		result = tokenResult
		return nil
	})
	if err != nil {
		return nil, err
	}
	return result, nil
}

func GetGasterCodeSessionFromAccessToken(accessToken string) (*model.GasterCodeSession, error) {
	accessToken = strings.TrimSpace(accessToken)
	if strings.HasPrefix(strings.ToLower(accessToken), "bearer ") {
		accessToken = strings.TrimSpace(accessToken[7:])
	}
	if accessToken == "" {
		return nil, errors.New("access_token is required")
	}
	now := common.GetTimestamp()
	session, err := model.GetActiveGasterCodeSessionByAccessHash(HashGasterCodeSecret(accessToken), now)
	if err != nil {
		return nil, err
	}
	_ = model.DB.Model(session).Updates(map[string]interface{}{
		"last_used_at": now,
		"updated_at":   now,
	}).Error
	return session, nil
}

func BuildGasterCodeMeResult(userID int, publicBaseURL string) (*GasterCodeMeResult, error) {
	user, err := model.GetUserById(userID, false)
	if err != nil {
		return nil, err
	}
	usedQuota, _ := model.GetUserUsedQuota(userID)
	activeSubs, err := model.GetAllActiveUserSubscriptions(userID)
	if err != nil {
		activeSubs = []model.SubscriptionSummary{}
	}
	subscription := buildGasterCodeSubscriptionSnapshot(activeSubs)
	canUse := user.Status == common.UserStatusEnabled && (user.Quota > 0 || hasUsableGasterCodeSubscription(subscription))
	base := normalizeGasterCodeBaseURL(publicBaseURL)
	return &GasterCodeMeResult{
		User:                  buildGasterCodeUserInfo(user),
		Subscription:          subscription,
		Quota:                 GasterCodeQuotaSnapshot{Remaining: user.Quota, Used: usedQuota, Unlimited: false},
		CanUseBuiltinProvider: canUse,
		BillingURL:            base + "/console/topup",
		AccountURL:            base + "/console/personal",
	}, nil
}

func GetOrCreateGasterCodeProviderToken(session *model.GasterCodeSession, publicBaseURL string) (*GasterCodeProviderTokenResult, error) {
	if session == nil || session.UserID <= 0 {
		return nil, errors.New("desktop session is invalid")
	}
	token, err := getReusableGasterCodeProviderToken(session)
	if err != nil {
		key, keyErr := common.GenerateKey()
		if keyErr != nil {
			return nil, keyErr
		}
		token = &model.Token{
			UserId:             session.UserID,
			Key:                key,
			Name:               "Gaster Code Desktop",
			Status:             common.TokenStatusEnabled,
			CreatedTime:        common.GetTimestamp(),
			AccessedTime:       common.GetTimestamp(),
			ExpiredTime:        -1,
			RemainQuota:        0,
			UnlimitedQuota:     true,
			ModelLimitsEnabled: false,
			Group:              "",
			CrossGroupRetry:    false,
		}
		if err := token.Insert(); err != nil {
			return nil, err
		}
		session.ProviderTokenID = token.Id
		if err := model.DB.Model(session).Updates(map[string]interface{}{
			"provider_token_id": token.Id,
			"updated_at":        common.GetTimestamp(),
		}).Error; err != nil {
			return nil, err
		}
	}
	return &GasterCodeProviderTokenResult{
		Provider: GasterCodeProviderInfo{
			Name:      "G-Master API",
			BaseURL:   normalizeGasterCodeBaseURL(publicBaseURL),
			APIFormat: "anthropic",
			APIKey:    token.GetFullKey(),
			Models:    getGasterCodeDefaultModels(),
		},
	}, nil
}

func RevokeGasterCodeSession(accessToken string, revokeProviderToken bool) error {
	session, err := GetGasterCodeSessionFromAccessToken(accessToken)
	if err != nil {
		return err
	}
	now := common.GetTimestamp()
	if err := model.DB.Model(session).Updates(map[string]interface{}{
		"revoked_at": now,
		"updated_at": now,
	}).Error; err != nil {
		return err
	}
	if revokeProviderToken && session.ProviderTokenID > 0 {
		token, err := model.GetTokenByIds(session.ProviderTokenID, session.UserID)
		if err != nil {
			return err
		}
		token.Status = common.TokenStatusDisabled
		return token.Update()
	}
	return nil
}

func HashGasterCodeSecret(secret string) string {
	sum := sha256.Sum256([]byte(secret))
	return hex.EncodeToString(sum[:])
}

func buildPKCES256Challenge(verifier string) string {
	sum := sha256.Sum256([]byte(verifier))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func buildGasterCodeAuthorizeURL(publicBaseURL string, requestID string) string {
	base := normalizeGasterCodeBaseURL(publicBaseURL)
	return base + "/gaster-code/desktop-login?request_id=" + url.QueryEscape(requestID)
}

func buildGasterCodeCallbackURL(redirectURI string, params map[string]string) (string, error) {
	parsed, err := url.Parse(redirectURI)
	if err != nil {
		return "", err
	}
	query := parsed.Query()
	for key, value := range params {
		query.Set(key, value)
	}
	parsed.RawQuery = query.Encode()
	return parsed.String(), nil
}

func randomGasterCodeSecret(prefix string, length int) (string, error) {
	key, err := common.GenerateRandomCharsKey(length)
	if err != nil {
		return "", err
	}
	return prefix + key, nil
}

func createGasterCodeSessionTokensTx(tx *gorm.DB, userID int, clientName string, clientVersion string, now int64) (*GasterCodeTokenResult, *model.GasterCodeSession, error) {
	result, refreshToken, accessHash, refreshHash, err := issueGasterCodeTokenPairTx(tx, userID, now)
	if err != nil {
		return nil, nil, err
	}
	session := &model.GasterCodeSession{
		UserID:           userID,
		AccessTokenHash:  accessHash,
		RefreshTokenHash: refreshHash,
		ClientName:       clientName,
		ClientVersion:    clientVersion,
		ExpiresAt:        result.ExpiresAt,
		RefreshExpiresAt: now + gasterCodeRefreshTokenTTL(),
		LastUsedAt:       now,
	}
	result.RefreshToken = refreshToken
	return result, session, nil
}

func issueGasterCodeTokenPairTx(tx *gorm.DB, userID int, now int64) (*GasterCodeTokenResult, string, string, string, error) {
	accessToken, err := randomGasterCodeSecret("gc_at_", 64)
	if err != nil {
		return nil, "", "", "", err
	}
	refreshToken, err := randomGasterCodeSecret("gc_rt_", 64)
	if err != nil {
		return nil, "", "", "", err
	}
	var user model.User
	if err := tx.Omit("password").First(&user, "id = ?", userID).Error; err != nil {
		return nil, "", "", "", err
	}
	if user.Status != common.UserStatusEnabled {
		return nil, "", "", "", errors.New("user is disabled")
	}
	return &GasterCodeTokenResult{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    now + gasterCodeAccessTokenTTL(),
		User:         buildGasterCodeUserInfo(&user),
	}, refreshToken, HashGasterCodeSecret(accessToken), HashGasterCodeSecret(refreshToken), nil
}

func buildGasterCodeUserInfo(user *model.User) GasterCodeUserInfo {
	if user == nil {
		return GasterCodeUserInfo{}
	}
	displayName := strings.TrimSpace(user.DisplayName)
	if displayName == "" {
		displayName = user.Username
	}
	return GasterCodeUserInfo{
		Id:          user.Id,
		Username:    user.Username,
		DisplayName: displayName,
		Email:       user.Email,
		Group:       user.Group,
	}
}

func buildGasterCodeSubscriptionSnapshot(activeSubs []model.SubscriptionSummary) GasterCodeSubscriptionSnapshot {
	items := make([]GasterCodeSubscriptionInfo, 0, len(activeSubs))
	for _, summary := range activeSubs {
		if summary.Subscription == nil {
			continue
		}
		sub := summary.Subscription
		remaining := sub.AmountTotal - sub.AmountUsed
		if sub.AmountTotal == 0 {
			remaining = 0
		} else if remaining < 0 {
			remaining = 0
		}
		items = append(items, GasterCodeSubscriptionInfo{
			Id:              sub.Id,
			PlanId:          sub.PlanId,
			Status:          sub.Status,
			StartTime:       sub.StartTime,
			EndTime:         sub.EndTime,
			AmountTotal:     sub.AmountTotal,
			AmountUsed:      sub.AmountUsed,
			AmountRemaining: remaining,
			Unlimited:       sub.AmountTotal == 0,
			UpgradeGroup:    sub.UpgradeGroup,
		})
	}
	return GasterCodeSubscriptionSnapshot{
		Active: len(items) > 0,
		Items:  items,
	}
}

func hasUsableGasterCodeSubscription(snapshot GasterCodeSubscriptionSnapshot) bool {
	for _, item := range snapshot.Items {
		if item.Unlimited || item.AmountRemaining > 0 {
			return true
		}
	}
	return false
}

func getReusableGasterCodeProviderToken(session *model.GasterCodeSession) (*model.Token, error) {
	if session.ProviderTokenID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}
	token, err := model.GetTokenByIds(session.ProviderTokenID, session.UserID)
	if err != nil {
		return nil, err
	}
	if token.Status != common.TokenStatusEnabled {
		return nil, errors.New("provider token is disabled")
	}
	return token, nil
}

func getGasterCodeDefaultModels() GasterCodeProviderModels {
	mainModel := common.GetEnvOrDefaultString("GASTER_CODE_MODEL_MAIN", "gpt-5.4")
	return GasterCodeProviderModels{
		Main:   mainModel,
		Haiku:  common.GetEnvOrDefaultString("GASTER_CODE_MODEL_HAIKU", "gpt-5.4-mini"),
		Sonnet: common.GetEnvOrDefaultString("GASTER_CODE_MODEL_SONNET", mainModel),
		Opus:   common.GetEnvOrDefaultString("GASTER_CODE_MODEL_OPUS", mainModel),
	}
}

func gasterCodeAccessTokenTTL() int64 {
	return int64(common.GetEnvOrDefault("GASTER_CODE_ACCESS_TOKEN_TTL_SECONDS", 24*60*60))
}

func gasterCodeRefreshTokenTTL() int64 {
	return int64(common.GetEnvOrDefault("GASTER_CODE_REFRESH_TOKEN_TTL_SECONDS", 30*24*60*60))
}

func normalizeGasterCodeBaseURL(base string) string {
	base = strings.TrimRight(strings.TrimSpace(base), "/")
	if base == "" {
		return "https://gmapi.fun"
	}
	return base
}
