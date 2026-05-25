package controller

import (
	"net/http"
	"net/http/httptest"
	"slices"
	"strconv"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
	"github.com/yangjunyu/G-Master-API/service"
	"github.com/yangjunyu/G-Master-API/setting/operation_setting"
	"gorm.io/gorm"
)

func createGasterCodeAccountTestUser(t *testing.T, id int, quota int, usedQuota int, group string) (*model.User, string) {
	t.Helper()
	if group == "" {
		group = "用户分组"
	}
	user := &model.User{
		Id:          id,
		Username:    "desktop_user_" + strconv.Itoa(id),
		DisplayName: "Desktop User",
		Email:       "desktop" + strconv.Itoa(id) + "@example.com",
		Quota:       quota,
		UsedQuota:   usedQuota,
		Status:      common.UserStatusEnabled,
		Group:       group,
		AffCode:     "aff-desktop-" + strconv.Itoa(id),
	}
	require.NoError(t, model.DB.Create(user).Error)
	accessToken := "gc_at_desktop_account_" + strconv.Itoa(id)
	require.NoError(t, model.DB.Create(&model.GasterCodeSession{
		UserID:           id,
		AccessTokenHash:  service.HashGasterCodeSecret(accessToken),
		RefreshTokenHash: service.HashGasterCodeSecret("gc_rt_desktop_account_" + strconv.Itoa(id)),
		ClientName:       "Gaster Code",
		ClientVersion:    "999.0.0-local",
		ExpiresAt:        common.GetTimestamp() + 3600,
		RefreshExpiresAt: common.GetTimestamp() + 7200,
	}).Error)
	return user, accessToken
}

func newGasterCodeAccountRequest(method string, target string, accessToken string, body string) (*gin.Context, *httptest.ResponseRecorder) {
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	if body == "" {
		ctx.Request = httptest.NewRequest(method, target, nil)
	} else {
		ctx.Request = httptest.NewRequest(method, target, strings.NewReader(body))
		ctx.Request.Header.Set("Content-Type", "application/json")
	}
	ctx.Request.Host = "gmapi.fun"
	if accessToken != "" {
		ctx.Request.Header.Set("Authorization", "Bearer "+accessToken)
	}
	return ctx, recorder
}

func TestGasterCodeMeIncludesAccountCenterFields(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	user, accessToken := createGasterCodeAccountTestUser(t, 501, 12000, 3400, "VIP用户组")
	require.NoError(t, model.DB.Create(&model.Ability{Group: user.Group, Model: "deepseek-v4-pro", ChannelId: 1, Enabled: true}).Error)
	require.NoError(t, model.DB.Create(&model.Ability{Group: user.Group, Model: "gpt-image-2", ChannelId: 2, Enabled: true}).Error)
	sub := &model.UserSubscription{
		UserId:             user.Id,
		PlanId:             88,
		AmountTotal:        50000,
		AmountUsed:         12500,
		StartTime:          common.GetTimestamp() - 60,
		EndTime:            common.GetTimestamp() + 86400,
		Status:             "active",
		UpgradeGroup:       "VIP用户组",
		CancelAtPeriodEnd:  false,
		CancellationReason: "",
	}
	require.NoError(t, model.DB.Create(sub).Error)

	ctx, recorder := newGasterCodeAccountRequest(http.MethodGet, "/api/gaster-code/me", accessToken, "")
	GasterCodeMe(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool `json:"success"`
		Data    struct {
			User struct {
				Id          int    `json:"id"`
				Username    string `json:"username"`
				DisplayName string `json:"display_name"`
				Email       string `json:"email"`
				Group       string `json:"group"`
			} `json:"user"`
			Quota struct {
				Remaining int  `json:"remaining"`
				Used      int  `json:"used"`
				Unlimited bool `json:"unlimited"`
			} `json:"quota"`
			Wallet struct {
				Balance    int    `json:"balance"`
				Currency   string `json:"currency"`
				LowBalance bool   `json:"low_balance"`
			} `json:"wallet"`
			Subscription struct {
				Active bool `json:"active"`
				Items  []struct {
					Id                int    `json:"id"`
					PlanId            int    `json:"plan_id"`
					Status            string `json:"status"`
					AmountTotal       int64  `json:"amount_total"`
					AmountUsed        int64  `json:"amount_used"`
					AmountRemaining   int64  `json:"amount_remaining"`
					Unlimited         bool   `json:"unlimited"`
					UpgradeGroup      string `json:"upgrade_group"`
					CancelAtPeriodEnd bool   `json:"cancel_at_period_end"`
					Resumable         bool   `json:"resumable"`
				} `json:"items"`
			} `json:"subscription"`
			Entitlements struct {
				CanUseBuiltinProvider bool     `json:"can_use_builtin_provider"`
				EnabledModels         []string `json:"enabled_models"`
				EnabledFeatures       []string `json:"enabled_features"`
				ExpiresAt             int64    `json:"expires_at"`
			} `json:"entitlements"`
			BillingURL string `json:"billing_url"`
			AccountURL string `json:"account_url"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	assert.Equal(t, user.Id, response.Data.User.Id)
	assert.Equal(t, "Desktop User", response.Data.User.DisplayName)
	assert.Equal(t, "VIP用户组", response.Data.User.Group)
	assert.Equal(t, 12000, response.Data.Quota.Remaining)
	assert.Equal(t, 3400, response.Data.Quota.Used)
	assert.Equal(t, 12000, response.Data.Wallet.Balance)
	assert.Equal(t, operation_setting.GetQuotaDisplayType(), response.Data.Wallet.Currency)
	assert.False(t, response.Data.Wallet.LowBalance)
	require.True(t, response.Data.Subscription.Active)
	require.Len(t, response.Data.Subscription.Items, 1)
	assert.Equal(t, int64(37500), response.Data.Subscription.Items[0].AmountRemaining)
	assert.False(t, response.Data.Subscription.Items[0].CancelAtPeriodEnd)
	assert.False(t, response.Data.Subscription.Items[0].Resumable)
	assert.True(t, response.Data.Entitlements.CanUseBuiltinProvider)
	assert.True(t, slices.Contains(response.Data.Entitlements.EnabledModels, "deepseek-v4-pro"))
	assert.True(t, slices.Contains(response.Data.Entitlements.EnabledModels, "gpt-image-2"))
	assert.True(t, slices.Contains(response.Data.Entitlements.EnabledFeatures, "billing"))
	assert.Equal(t, sub.EndTime, response.Data.Entitlements.ExpiresAt)
	assert.True(t, strings.HasSuffix(response.Data.BillingURL, "/console/topup"))
	assert.True(t, strings.HasSuffix(response.Data.AccountURL, "/console/personal"))
}

func TestGasterCodeBillingPlansReturnsTopupAndSubscriptionPlans(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	_, accessToken := createGasterCodeAccountTestUser(t, 502, 5000, 0, "用户分组")
	require.NoError(t, model.DB.Create(&model.SubscriptionPlan{
		Id:            88,
		Title:         "VIP 月度套餐",
		Subtitle:      "桌面端订阅额度",
		PriceAmount:   19.9,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
		SortOrder:     10,
		TotalAmount:   0,
		UpgradeGroup:  "VIP用户组",
	}).Error)

	ctx, recorder := newGasterCodeAccountRequest(http.MethodGet, "/api/gaster-code/billing/plans", accessToken, "")
	GasterCodeBillingPlans(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Plans []struct {
				Id          string  `json:"id"`
				Kind        string  `json:"kind"`
				Name        string  `json:"name"`
				Description string  `json:"description"`
				Price       float64 `json:"price"`
				Currency    string  `json:"currency"`
				Interval    string  `json:"interval"`
				QuotaAmount int64   `json:"quota_amount"`
				Unlimited   bool    `json:"unlimited"`
				Recommended bool    `json:"recommended"`
			} `json:"plans"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	require.GreaterOrEqual(t, len(response.Data.Plans), 2)
	planIDs := make([]string, 0, len(response.Data.Plans))
	for _, plan := range response.Data.Plans {
		planIDs = append(planIDs, plan.Id)
	}
	assert.True(t, slices.Contains(planIDs, "topup_10"))
	assert.True(t, slices.Contains(planIDs, "subscription_88"))
}

func TestGasterCodeBillingCheckoutCreatesAndPollsTopupSession(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	user, accessToken := createGasterCodeAccountTestUser(t, 503, 5000, 0, "用户分组")

	ctx, recorder := newGasterCodeAccountRequest(http.MethodPost, "/api/gaster-code/billing/checkout", accessToken, `{"kind":"topup","plan_id":"topup_10","return_to":"account"}`)
	GasterCodeBillingCheckout(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var created struct {
		Success bool `json:"success"`
		Data    struct {
			Id        string `json:"id"`
			URL       string `json:"url"`
			Status    string `json:"status"`
			Kind      string `json:"kind"`
			ExpiresAt int64  `json:"expires_at"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &created))
	require.True(t, created.Success)
	require.NotEmpty(t, created.Data.Id)
	assert.Equal(t, "pending", created.Data.Status)
	assert.Equal(t, "topup", created.Data.Kind)
	assert.Contains(t, created.Data.URL, "/console/topup")
	assert.Greater(t, created.Data.ExpiresAt, common.GetTimestamp())

	var checkout model.GasterCodeBillingCheckout
	require.NoError(t, model.DB.Where("id = ? AND user_id = ?", created.Data.Id, user.Id).First(&checkout).Error)
	assert.Equal(t, "topup_10", checkout.PlanID)
	require.NotEmpty(t, checkout.TradeNo)
	var topUp model.TopUp
	require.NoError(t, model.DB.Where("trade_no = ?", checkout.TradeNo).First(&topUp).Error)
	assert.Equal(t, user.Id, topUp.UserId)
	assert.Equal(t, common.TopUpStatusPending, topUp.Status)
	assert.Equal(t, "gaster_code", topUp.PaymentProvider)

	statusCtx, statusRecorder := newGasterCodeAccountRequest(http.MethodGet, "/api/gaster-code/billing/checkout/"+created.Data.Id, accessToken, "")
	statusCtx.Params = gin.Params{{Key: "id", Value: created.Data.Id}}
	GasterCodeBillingCheckoutStatus(statusCtx)
	require.Equal(t, http.StatusOK, statusRecorder.Code)
	var polled struct {
		Success bool `json:"success"`
		Data    struct {
			Id     string `json:"id"`
			Status string `json:"status"`
			Kind   string `json:"kind"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(statusRecorder.Body.Bytes(), &polled))
	assert.True(t, polled.Success)
	assert.Equal(t, created.Data.Id, polled.Data.Id)
	assert.Equal(t, "pending", polled.Data.Status)
	assert.Equal(t, "topup", polled.Data.Kind)

	require.NoError(t, model.DB.Create(&model.TopUp{
		UserId:          user.Id,
		Amount:          topUp.Amount,
		Money:           topUp.Money,
		TradeNo:         "web_console_topup_success",
		PaymentMethod:   "stripe",
		PaymentProvider: model.PaymentProviderStripe,
		CreateTime:      common.GetTimestamp(),
		CompleteTime:    common.GetTimestamp(),
		Status:          common.TopUpStatusSuccess,
	}).Error)
	paidCtx, paidRecorder := newGasterCodeAccountRequest(http.MethodGet, "/api/gaster-code/billing/checkout/"+created.Data.Id, accessToken, "")
	paidCtx.Params = gin.Params{{Key: "id", Value: created.Data.Id}}
	GasterCodeBillingCheckoutStatus(paidCtx)
	require.Equal(t, http.StatusOK, paidRecorder.Code)
	require.NoError(t, common.Unmarshal(paidRecorder.Body.Bytes(), &polled))
	assert.Equal(t, "paid", polled.Data.Status)
}

func TestGasterCodeBillingCheckoutRejectsUnavailablePlan(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	_, accessToken := createGasterCodeAccountTestUser(t, 504, 5000, 0, "用户分组")

	ctx, recorder := newGasterCodeAccountRequest(http.MethodPost, "/api/gaster-code/billing/checkout", accessToken, `{"kind":"subscription","plan_id":"subscription_404","return_to":"account"}`)
	GasterCodeBillingCheckout(ctx)

	require.Equal(t, http.StatusBadRequest, recorder.Code)
	var response struct {
		Success bool   `json:"success"`
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.False(t, response.Success)
	assert.Equal(t, "GMASTER_BILLING_PLAN_UNAVAILABLE", response.Code)
	assert.NotEmpty(t, response.Message)
}

func TestGasterCodeBillingTransactionsListsDesktopRecords(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	user, accessToken := createGasterCodeAccountTestUser(t, 505, 5000, 0, "用户分组")
	now := common.GetTimestamp()
	require.NoError(t, model.DB.Create(&model.TopUp{
		UserId:          user.Id,
		Amount:          10,
		Money:           10,
		TradeNo:         "gc_topup_paid",
		PaymentMethod:   "gaster_code",
		PaymentProvider: "gaster_code",
		CreateTime:      now - 30,
		CompleteTime:    now - 20,
		Status:          common.TopUpStatusSuccess,
	}).Error)
	require.NoError(t, model.DB.Create(&model.SubscriptionOrder{
		UserId:          user.Id,
		PlanId:          88,
		Money:           19.9,
		TradeNo:         "gc_subscription_paid",
		PaymentMethod:   "gaster_code",
		PaymentProvider: "gaster_code",
		CreateTime:      now - 25,
		CompleteTime:    now - 15,
		Status:          common.TopUpStatusSuccess,
	}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{
		UserId:       user.Id,
		Username:     user.Username,
		CreatedAt:    now - 10,
		Type:         model.LogTypeConsume,
		Content:      "Gaster Code Desktop usage",
		TokenName:    "Gaster Code Desktop",
		ModelName:    "deepseek-v4-pro",
		Quota:        123,
		PromptTokens: 12,
		TokenId:      9,
	}).Error)
	require.NoError(t, model.LOG_DB.Create(&model.Log{
		UserId:    user.Id,
		Username:  user.Username,
		CreatedAt: now - 5,
		Type:      model.LogTypeManage,
		Content:   "管理员增加用户额度",
	}).Error)

	ctx, recorder := newGasterCodeAccountRequest(http.MethodGet, "/api/gaster-code/billing/transactions", accessToken, "")
	GasterCodeBillingTransactions(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Transactions []struct {
				Id          string  `json:"id"`
				Kind        string  `json:"kind"`
				Status      string  `json:"status"`
				Amount      float64 `json:"amount"`
				Currency    string  `json:"currency"`
				CreatedAt   int64   `json:"created_at"`
				Description string  `json:"description"`
			} `json:"transactions"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	kinds := make([]string, 0, len(response.Data.Transactions))
	for _, transaction := range response.Data.Transactions {
		kinds = append(kinds, transaction.Kind+":"+transaction.Status)
	}
	assert.True(t, slices.Contains(kinds, "topup:paid"))
	assert.True(t, slices.Contains(kinds, "subscription:paid"))
	assert.True(t, slices.Contains(kinds, "usage:paid"))
	assert.True(t, slices.Contains(kinds, "adjustment:paid"))
}

func TestGasterCodeSubscriptionCancelAndResume(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	user, accessToken := createGasterCodeAccountTestUser(t, 506, 5000, 0, "VIP用户组")
	sub := &model.UserSubscription{
		UserId:       user.Id,
		PlanId:       88,
		AmountTotal:  0,
		StartTime:    common.GetTimestamp() - 60,
		EndTime:      common.GetTimestamp() + 86400,
		Status:       "active",
		UpgradeGroup: "VIP用户组",
	}
	require.NoError(t, model.DB.Create(sub).Error)

	cancelCtx, cancelRecorder := newGasterCodeAccountRequest(http.MethodPost, "/api/gaster-code/subscription/cancel", accessToken, `{}`)
	GasterCodeSubscriptionCancel(cancelCtx)
	require.Equal(t, http.StatusOK, cancelRecorder.Code)
	var okResponse struct {
		Success bool `json:"success"`
		Data    struct {
			Ok bool `json:"ok"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(cancelRecorder.Body.Bytes(), &okResponse))
	assert.True(t, okResponse.Success)
	assert.True(t, okResponse.Data.Ok)

	var cancelled model.UserSubscription
	require.NoError(t, model.DB.First(&cancelled, sub.Id).Error)
	assert.True(t, cancelled.CancelAtPeriodEnd)
	assert.Equal(t, "active", cancelled.Status)
	assert.Equal(t, sub.EndTime, cancelled.EndTime)

	resumeCtx, resumeRecorder := newGasterCodeAccountRequest(http.MethodPost, "/api/gaster-code/subscription/resume", accessToken, `{}`)
	GasterCodeSubscriptionResume(resumeCtx)
	require.Equal(t, http.StatusOK, resumeRecorder.Code)
	require.NoError(t, common.Unmarshal(resumeRecorder.Body.Bytes(), &okResponse))
	assert.True(t, okResponse.Success)
	assert.True(t, okResponse.Data.Ok)

	var resumed model.UserSubscription
	require.NoError(t, model.DB.First(&resumed, sub.Id).Error)
	assert.False(t, resumed.CancelAtPeriodEnd)
	assert.Equal(t, int64(0), resumed.CancelledAt)
}

func TestGasterCodeSubscriptionResumeRejectsNonResumable(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	user, accessToken := createGasterCodeAccountTestUser(t, 507, 5000, 0, "VIP用户组")
	require.NoError(t, model.DB.Create(&model.UserSubscription{
		UserId:       user.Id,
		PlanId:       88,
		AmountTotal:  0,
		StartTime:    common.GetTimestamp() - 60,
		EndTime:      common.GetTimestamp() + 86400,
		Status:       "active",
		UpgradeGroup: "VIP用户组",
	}).Error)

	ctx, recorder := newGasterCodeAccountRequest(http.MethodPost, "/api/gaster-code/subscription/resume", accessToken, `{}`)
	GasterCodeSubscriptionResume(ctx)

	require.Equal(t, http.StatusConflict, recorder.Code)
	var response struct {
		Success bool   `json:"success"`
		Code    string `json:"code"`
		Message string `json:"message"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	assert.False(t, response.Success)
	assert.Equal(t, "GMASTER_SUBSCRIPTION_NOT_RESUMABLE", response.Code)
	assert.NotEmpty(t, response.Message)
}

func TestGasterCodeProviderTokenReflectsGroupAfterSubscriptionChange(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	user, accessToken := createGasterCodeAccountTestUser(t, 508, 5000, 0, "用户分组")
	token := &model.Token{
		UserId:         user.Id,
		Key:            "sk-existing-gaster-code-token",
		Name:           "Gaster Code Desktop",
		Status:         common.TokenStatusEnabled,
		ExpiredTime:    -1,
		UnlimitedQuota: true,
		Group:          user.Group,
	}
	require.NoError(t, model.DB.Create(token).Error)
	require.NoError(t, model.DB.Model(&model.GasterCodeSession{}).Where("user_id = ?", user.Id).Update("provider_token_id", token.Id).Error)
	require.NoError(t, model.DB.Create(&model.SubscriptionPlan{
		Id:            99,
		Title:         "VIP",
		PriceAmount:   1,
		Currency:      "USD",
		DurationUnit:  model.SubscriptionDurationMonth,
		DurationValue: 1,
		Enabled:       true,
		UpgradeGroup:  "VIP用户组",
	}).Error)
	model.InvalidateSubscriptionPlanCache(99)
	plan, err := model.GetSubscriptionPlanById(99)
	require.NoError(t, err)
	require.NoError(t, model.DB.Transaction(func(tx *gorm.DB) error {
		_, err := model.CreateUserSubscriptionFromPlanTx(tx, user.Id, plan, "order")
		return err
	}))

	ctx, recorder := newGasterCodeAccountRequest(http.MethodPost, "/api/gaster-code/provider-token", accessToken, `{}`)
	GasterCodeProviderToken(ctx)
	require.Equal(t, http.StatusOK, recorder.Code)

	var updated model.Token
	require.NoError(t, model.DB.First(&updated, token.Id).Error)
	assert.Equal(t, "VIP用户组", updated.Group)
}
