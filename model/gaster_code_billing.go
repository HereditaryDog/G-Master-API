package model

import (
	"errors"
	"strings"

	"github.com/yangjunyu/G-Master-API/common"
	"gorm.io/gorm"
)

const (
	GasterCodeBillingKindTopup        = "topup"
	GasterCodeBillingKindSubscription = "subscription"

	GasterCodeCheckoutStatusPending   = "pending"
	GasterCodeCheckoutStatusPaid      = "paid"
	GasterCodeCheckoutStatusFailed    = "failed"
	GasterCodeCheckoutStatusExpired   = "expired"
	GasterCodeCheckoutStatusCancelled = "cancelled"
)

type GasterCodeBillingCheckout struct {
	Id        string `json:"id" gorm:"type:varchar(64);primaryKey"`
	UserID    int    `json:"user_id" gorm:"index"`
	Kind      string `json:"kind" gorm:"type:varchar(32);index"`
	PlanID    string `json:"plan_id" gorm:"type:varchar(128);index"`
	TradeNo   string `json:"trade_no" gorm:"type:varchar(255);index"`
	Status    string `json:"status" gorm:"type:varchar(32);index"`
	URL       string `json:"url" gorm:"type:text"`
	ExpiresAt int64  `json:"expires_at" gorm:"bigint;index"`
	CreatedAt int64  `json:"created_at" gorm:"bigint"`
	UpdatedAt int64  `json:"updated_at" gorm:"bigint"`
}

func (s *GasterCodeBillingCheckout) BeforeCreate(tx *gorm.DB) error {
	now := common.GetTimestamp()
	if s.CreatedAt == 0 {
		s.CreatedAt = now
	}
	if s.UpdatedAt == 0 {
		s.UpdatedAt = now
	}
	if strings.TrimSpace(s.Status) == "" {
		s.Status = GasterCodeCheckoutStatusPending
	}
	return nil
}

func (s *GasterCodeBillingCheckout) BeforeUpdate(tx *gorm.DB) error {
	s.UpdatedAt = common.GetTimestamp()
	return nil
}

func GetGasterCodeBillingCheckout(id string, userID int) (*GasterCodeBillingCheckout, error) {
	id = strings.TrimSpace(id)
	if id == "" || userID <= 0 {
		return nil, errors.New("invalid checkout id or user id")
	}
	var checkout GasterCodeBillingCheckout
	if err := DB.Where("id = ? AND user_id = ?", id, userID).First(&checkout).Error; err != nil {
		return nil, err
	}
	return &checkout, nil
}
