package service

import (
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/dto"
	"github.com/yangjunyu/G-Master-API/model"
	relaycommon "github.com/yangjunyu/G-Master-API/relay/common"
)

func newBillingSessionTestContext() *gin.Context {
	gin.SetMode(gin.TestMode)
	w := httptest.NewRecorder()
	c, _ := gin.CreateTestContext(w)
	return c
}

func seedBillingUser(t *testing.T, id int, group string, quota int) {
	t.Helper()
	require.NoError(t, model.DB.Create(&model.User{
		Id:       id,
		Username: "billing_user",
		Group:    group,
		Quota:    quota,
		Status:   common.UserStatusEnabled,
	}).Error)
}

func seedBillingToken(t *testing.T, id int, userId int, key string, quota int) {
	t.Helper()
	require.NoError(t, model.DB.Create(&model.Token{
		Id:          id,
		UserId:      userId,
		Key:         key,
		Name:        "billing_token",
		Status:      common.TokenStatusEnabled,
		RemainQuota: quota,
	}).Error)
}

func seedBillingSubscription(t *testing.T, id int, userId int, upgradeGroup string, total int64) {
	t.Helper()
	plan := &model.SubscriptionPlan{
		Id:            id,
		Title:         "group plan",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		UpgradeGroup:  upgradeGroup,
		TotalAmount:   total,
		Enabled:       true,
	}
	require.NoError(t, model.DB.Create(plan).Error)
	require.NoError(t, model.DB.Create(&model.UserSubscription{
		Id:            id,
		UserId:        userId,
		PlanId:        plan.Id,
		AmountTotal:   total,
		AmountUsed:    0,
		StartTime:     time.Now().Add(-time.Hour).Unix(),
		EndTime:       time.Now().Add(time.Hour).Unix(),
		Status:        "active",
		UpgradeGroup:  upgradeGroup,
		PrevUserGroup: "vip",
	}).Error)
}

func newBillingRelayInfo(userId, tokenId int, tokenKey, userGroup, usingGroup string, pref string) *relaycommon.RelayInfo {
	return &relaycommon.RelayInfo{
		RequestId:       "req-" + tokenKey,
		UserId:          userId,
		TokenId:         tokenId,
		TokenKey:        tokenKey,
		UserGroup:       userGroup,
		UsingGroup:      usingGroup,
		OriginModelName: "test-model",
		ForcePreConsume: true,
		IsPlayground:    true,
		UserSetting: dto.UserSetting{
			BillingPreference: pref,
		},
	}
}

func TestNewBillingSession_SubscriptionUpgradeGroupUsesSubscription(t *testing.T) {
	truncate(t)

	const (
		userId  = 9101
		tokenId = 9101
		key     = "billing-subscription-group"
	)
	seedBillingUser(t, userId, "svip", 5000)
	seedBillingToken(t, tokenId, userId, key, 5000)
	seedBillingSubscription(t, 9101, userId, "svip", 10000)

	info := newBillingRelayInfo(userId, tokenId, key, "svip", "svip", "wallet_only")
	session, apiErr := NewBillingSession(newBillingSessionTestContext(), info, 1000)
	require.Nil(t, apiErr)
	require.NotNil(t, session)
	assert.Equal(t, BillingSourceSubscription, info.BillingSource)
	assert.Equal(t, 1000, info.FinalPreConsumedQuota)
	assert.Equal(t, int64(1000), info.SubscriptionPreConsumed)

	userQuota, err := model.GetUserQuota(userId, false)
	require.NoError(t, err)
	assert.Equal(t, 5000, userQuota)

	var sub model.UserSubscription
	require.NoError(t, model.DB.Where("id = ?", 9101).First(&sub).Error)
	assert.Equal(t, int64(1000), sub.AmountUsed)
}

func TestNewBillingSession_NonSubscriptionGroupUsesWallet(t *testing.T) {
	truncate(t)

	const (
		userId  = 9102
		tokenId = 9102
		key     = "billing-wallet-group"
	)
	seedBillingUser(t, userId, "svip", 5000)
	seedBillingToken(t, tokenId, userId, key, 5000)
	seedBillingSubscription(t, 9102, userId, "svip", 10000)

	info := newBillingRelayInfo(userId, tokenId, key, "svip", "vip", "subscription_first")
	session, apiErr := NewBillingSession(newBillingSessionTestContext(), info, 1000)
	require.Nil(t, apiErr)
	require.NotNil(t, session)
	assert.Equal(t, BillingSourceWallet, info.BillingSource)
	assert.Equal(t, 1000, info.FinalPreConsumedQuota)
	assert.Zero(t, info.SubscriptionPreConsumed)

	userQuota, err := model.GetUserQuota(userId, false)
	require.NoError(t, err)
	assert.Equal(t, 4000, userQuota)

	var sub model.UserSubscription
	require.NoError(t, model.DB.Where("id = ?", 9102).First(&sub).Error)
	assert.Zero(t, sub.AmountUsed)
}

func TestGetUserUsableGroupsForUser_ActiveSubscriptionCanUseAllConfiguredGroups(t *testing.T) {
	truncate(t)

	const userId = 9103
	seedBillingUser(t, userId, "svip", 5000)
	seedBillingSubscription(t, 9103, userId, "svip", 10000)

	groups := GetUserUsableGroupsForUser(userId, "svip")
	assert.Contains(t, groups, "default")
	assert.Contains(t, groups, "vip")
	assert.Contains(t, groups, "svip")
	assert.True(t, UserCanUseGroup(userId, "svip", "vip"))
}
