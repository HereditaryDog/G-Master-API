package model

import (
	"errors"
	"strconv"
	"strings"

	"github.com/yangjunyu/G-Master-API/common"
	"gorm.io/gorm"
)

const (
	GasterCodeAuthStatusPending  = "pending"
	GasterCodeAuthStatusApproved = "approved"
	GasterCodeAuthStatusUsed     = "used"
	GasterCodeAuthStatusDenied   = "denied"
	GasterCodeAuthStatusExpired  = "expired"
)

const (
	GasterCodeOAuthLoginStatusActive  = "active"
	GasterCodeOAuthLoginStatusExpired = "expired"
	GasterCodeOAuthLoginStatusRevoked = "revoked"
)

type GasterCodeAuthRequest struct {
	Id                  int    `json:"id"`
	RequestID           string `json:"request_id" gorm:"type:varchar(80);uniqueIndex"`
	UserID              int    `json:"user_id" gorm:"index"`
	CodeChallenge       string `json:"code_challenge" gorm:"type:varchar(128)"`
	CodeChallengeMethod string `json:"code_challenge_method" gorm:"type:varchar(16)"`
	State               string `json:"state" gorm:"type:varchar(512)"`
	RedirectURI         string `json:"redirect_uri" gorm:"type:varchar(512)"`
	ClientName          string `json:"client_name" gorm:"type:varchar(80)"`
	ClientVersion       string `json:"client_version" gorm:"type:varchar(64)"`
	Status              string `json:"status" gorm:"type:varchar(32);index"`
	AuthCodeHash        string `json:"-" gorm:"type:varchar(64);index"`
	ExpiresAt           int64  `json:"expires_at" gorm:"bigint;index"`
	CodeExpiresAt       int64  `json:"code_expires_at" gorm:"bigint;index"`
	CreatedAt           int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt           int64  `json:"updated_at" gorm:"bigint"`
}

func (r *GasterCodeAuthRequest) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	r.CreatedAt = now
	r.UpdatedAt = now
	if r.Status == "" {
		r.Status = GasterCodeAuthStatusPending
	}
	return nil
}

func (r *GasterCodeAuthRequest) BeforeUpdate(tx *gorm.DB) error {
	r.UpdatedAt = common.GetTimestamp()
	return nil
}

type GasterCodeSession struct {
	Id               int    `json:"id"`
	UserID           int    `json:"user_id" gorm:"index"`
	AccessTokenHash  string `json:"-" gorm:"type:varchar(64);uniqueIndex"`
	RefreshTokenHash string `json:"-" gorm:"type:varchar(64);uniqueIndex"`
	ClientName       string `json:"client_name" gorm:"type:varchar(80)"`
	ClientVersion    string `json:"client_version" gorm:"type:varchar(64)"`
	ProviderTokenID  int    `json:"provider_token_id" gorm:"index"`
	ExpiresAt        int64  `json:"expires_at" gorm:"bigint;index"`
	RefreshExpiresAt int64  `json:"refresh_expires_at" gorm:"bigint;index"`
	RevokedAt        int64  `json:"revoked_at" gorm:"bigint;index"`
	LastUsedAt       int64  `json:"last_used_at" gorm:"bigint"`
	CreatedAt        int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt        int64  `json:"updated_at" gorm:"bigint"`
}

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

func (s *GasterCodeSession) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	s.CreatedAt = now
	s.UpdatedAt = now
	return nil
}

func (s *GasterCodeSession) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = common.GetTimestamp()
	return nil
}

func CreateGasterCodeAuthRequest(req *GasterCodeAuthRequest) error {
	if req == nil {
		return errors.New("auth request is nil")
	}
	return DB.Create(req).Error
}

func GetGasterCodeAuthRequestByRequestID(requestID string) (*GasterCodeAuthRequest, error) {
	if requestID == "" {
		return nil, errors.New("request_id is empty")
	}
	var req GasterCodeAuthRequest
	if err := DB.Where("request_id = ?", requestID).First(&req).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

func GetGasterCodeAuthRequestByCodeHash(codeHash string) (*GasterCodeAuthRequest, error) {
	if codeHash == "" {
		return nil, errors.New("code hash is empty")
	}
	var req GasterCodeAuthRequest
	if err := DB.Where("auth_code_hash = ?", codeHash).First(&req).Error; err != nil {
		return nil, err
	}
	return &req, nil
}

func CreateGasterCodeSession(session *GasterCodeSession) error {
	if session == nil {
		return errors.New("session is nil")
	}
	return DB.Create(session).Error
}

func GetActiveGasterCodeSessionByAccessHash(accessHash string, now int64) (*GasterCodeSession, error) {
	if accessHash == "" {
		return nil, errors.New("access token hash is empty")
	}
	var session GasterCodeSession
	err := DB.Where("access_token_hash = ? AND revoked_at = 0 AND expires_at > ?", accessHash, now).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func GetActiveGasterCodeSessionByRefreshHash(refreshHash string, now int64) (*GasterCodeSession, error) {
	if refreshHash == "" {
		return nil, errors.New("refresh token hash is empty")
	}
	var session GasterCodeSession
	err := DB.Where("refresh_token_hash = ? AND revoked_at = 0 AND refresh_expires_at > ?", refreshHash, now).First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

func ListGasterCodeOAuthLogins(query GasterCodeOAuthLoginQuery) ([]*GasterCodeOAuthLogin, int64, error) {
	if query.Now <= 0 {
		query.Now = common.GetTimestamp()
	}
	if query.StartIdx < 0 {
		query.StartIdx = 0
	}
	if query.Limit <= 0 {
		query.Limit = common.ItemsPerPage
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	baseQuery := buildGasterCodeOAuthLoginBaseQuery(query)
	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []*GasterCodeOAuthLogin
	err := buildGasterCodeOAuthLoginBaseQuery(query).
		Select(gasterCodeOAuthLoginSelectClause()).
		Order("s.id desc").
		Limit(query.Limit).
		Offset(query.StartIdx).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	for _, row := range rows {
		row.SessionStatus = resolveGasterCodeOAuthLoginStatus(row.RevokedAt, row.ExpiresAt, query.Now)
	}
	if err := hydrateGasterCodeOAuthLoginUsage(rows); err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func buildGasterCodeOAuthLoginBaseQuery(query GasterCodeOAuthLoginQuery) *gorm.DB {
	tx := DB.Table("gaster_code_sessions AS s").
		Joins("LEFT JOIN users AS u ON u.id = s.user_id").
		Joins("LEFT JOIN tokens AS t ON t.id = s.provider_token_id")

	switch query.Status {
	case GasterCodeOAuthLoginStatusActive:
		tx = tx.Where("s.revoked_at = 0 AND s.expires_at > ?", query.Now)
	case GasterCodeOAuthLoginStatusExpired:
		tx = tx.Where("s.revoked_at = 0 AND s.expires_at <= ?", query.Now)
	case GasterCodeOAuthLoginStatusRevoked:
		tx = tx.Where("s.revoked_at > 0")
	}

	keyword := strings.TrimSpace(query.Keyword)
	if keyword == "" {
		return tx
	}
	pattern := buildGasterCodeOAuthLoginKeywordPattern(keyword)
	likeCondition := "LOWER(u.username) LIKE ? ESCAPE '!' OR LOWER(u.display_name) LIKE ? ESCAPE '!' OR LOWER(u.email) LIKE ? ESCAPE '!' OR LOWER(s.client_name) LIKE ? ESCAPE '!'"
	args := []interface{}{pattern, pattern, pattern, pattern}
	if userID, err := strconv.Atoi(keyword); err == nil {
		args = append([]interface{}{userID}, args...)
		tx = tx.Where("(s.user_id = ? OR "+likeCondition+")", args...)
	} else {
		tx = tx.Where("("+likeCondition+")", args...)
	}
	return tx
}

func gasterCodeOAuthLoginSelectClause() string {
	return strings.Join([]string{
		"s.id AS session_id",
		"s.user_id AS user_id",
		"u.username AS username",
		"u.display_name AS display_name",
		"u.email AS email",
		"u." + gasterCodeOAuthLoginGroupCol() + " AS user_group",
		"u.status AS user_status",
		"s.client_name AS client_name",
		"s.client_version AS client_version",
		"s.provider_token_id AS provider_token_id",
		"t.name AS provider_token_name",
		"t." + gasterCodeOAuthLoginGroupCol() + " AS provider_token_group",
		"t.status AS provider_token_status",
		"t.used_quota AS provider_token_used_quota",
		"s.created_at AS created_at",
		"s.last_used_at AS last_used_at",
		"s.expires_at AS expires_at",
		"s.revoked_at AS revoked_at",
	}, ", ")
}

func gasterCodeOAuthLoginGroupCol() string {
	if commonGroupCol != "" {
		return commonGroupCol
	}
	if common.UsingPostgreSQL {
		return `"group"`
	}
	return "`group`"
}

func buildGasterCodeOAuthLoginKeywordPattern(keyword string) string {
	keyword = strings.ToLower(strings.TrimSpace(keyword))
	keyword = strings.ReplaceAll(keyword, "!", "!!")
	keyword = strings.ReplaceAll(keyword, "%", "!%")
	keyword = strings.ReplaceAll(keyword, "_", "!_")
	return "%" + keyword + "%"
}

func resolveGasterCodeOAuthLoginStatus(revokedAt int64, expiresAt int64, now int64) string {
	if revokedAt > 0 {
		return GasterCodeOAuthLoginStatusRevoked
	}
	if expiresAt <= now {
		return GasterCodeOAuthLoginStatusExpired
	}
	return GasterCodeOAuthLoginStatusActive
}

type gasterCodeOAuthLoginUsage struct {
	TokenID          int `gorm:"column:token_id"`
	RequestCount     int `gorm:"column:request_count"`
	UsedQuota        int `gorm:"column:used_quota"`
	PromptTokens     int `gorm:"column:prompt_tokens"`
	CompletionTokens int `gorm:"column:completion_tokens"`
}

func hydrateGasterCodeOAuthLoginUsage(rows []*GasterCodeOAuthLogin) error {
	tokenIDSet := make(map[int]struct{})
	tokenIDs := make([]int, 0, len(rows))
	for _, row := range rows {
		if row.ProviderTokenID <= 0 {
			continue
		}
		if _, ok := tokenIDSet[row.ProviderTokenID]; ok {
			continue
		}
		tokenIDSet[row.ProviderTokenID] = struct{}{}
		tokenIDs = append(tokenIDs, row.ProviderTokenID)
	}
	if len(tokenIDs) == 0 {
		return nil
	}

	var usageRows []gasterCodeOAuthLoginUsage
	err := LOG_DB.Table("logs").
		Select("token_id, COUNT(*) AS request_count, COALESCE(SUM(quota), 0) AS used_quota, COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens, COALESCE(SUM(completion_tokens), 0) AS completion_tokens").
		Where("token_id IN ? AND type = ?", tokenIDs, LogTypeConsume).
		Group("token_id").
		Scan(&usageRows).Error
	if err != nil {
		return err
	}

	usageByTokenID := make(map[int]gasterCodeOAuthLoginUsage, len(usageRows))
	for _, usage := range usageRows {
		usageByTokenID[usage.TokenID] = usage
	}
	for _, row := range rows {
		usage, ok := usageByTokenID[row.ProviderTokenID]
		if !ok {
			continue
		}
		row.RequestCount = usage.RequestCount
		row.UsedQuota = usage.UsedQuota
		row.PromptTokens = usage.PromptTokens
		row.CompletionTokens = usage.CompletionTokens
	}
	return nil
}
