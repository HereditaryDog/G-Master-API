package model

import (
	"errors"

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
