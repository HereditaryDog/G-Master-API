package controller

import (
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
	"github.com/yangjunyu/G-Master-API/setting/operation_setting"
	"gorm.io/gorm"
)

const (
	gasterCodeBillingCheckoutFailedCode       = "GMASTER_BILLING_CHECKOUT_FAILED"
	gasterCodeBillingPaymentPendingCode       = "GMASTER_BILLING_PAYMENT_PENDING"
	gasterCodeBillingPlanUnavailableCode      = "GMASTER_BILLING_PLAN_UNAVAILABLE"
	gasterCodeBillingProviderUnavailableCode  = "GMASTER_BILLING_PROVIDER_UNAVAILABLE"
	gasterCodeSubscriptionNotFoundCode        = "GMASTER_SUBSCRIPTION_NOT_FOUND"
	gasterCodeSubscriptionNotResumableCode    = "GMASTER_SUBSCRIPTION_NOT_RESUMABLE"
	gasterCodeDesktopPaymentProvider          = "gaster_code"
	gasterCodeBillingCheckoutDefaultTTLSecond = 30 * 60
)

type gasterCodeBillingPlan struct {
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
}

type gasterCodeBillingCheckoutRequest struct {
	Kind     string `json:"kind"`
	PlanID   string `json:"plan_id"`
	ReturnTo string `json:"return_to"`
}

type gasterCodeBillingCheckoutResponse struct {
	Id        string `json:"id"`
	URL       string `json:"url"`
	Status    string `json:"status"`
	Kind      string `json:"kind"`
	ExpiresAt int64  `json:"expires_at"`
}

type gasterCodeBillingTransaction struct {
	Id          string  `json:"id"`
	Kind        string  `json:"kind"`
	Status      string  `json:"status"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	CreatedAt   int64   `json:"created_at"`
	Description string  `json:"description"`
}

func GasterCodeBillingPlans(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		writeGasterCodeAuthError(c, classifyGasterCodeAuthReason(err), err.Error())
		return
	}
	user, err := model.GetUserById(session.UserID, false)
	if err != nil {
		writeGasterCodeAuthError(c, gasterCodeAuthReasonExpired, err.Error())
		return
	}
	common.ApiSuccess(c, gin.H{"plans": buildGasterCodeBillingPlans(user)})
}

func GasterCodeBillingCheckout(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		writeGasterCodeAuthError(c, classifyGasterCodeAuthReason(err), err.Error())
		return
	}
	var req gasterCodeBillingCheckoutRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		writeGasterCodeAPIError(c, http.StatusBadRequest, gasterCodeBillingCheckoutFailedCode, "checkout request is invalid")
		return
	}
	req.Kind = strings.TrimSpace(req.Kind)
	req.PlanID = strings.TrimSpace(req.PlanID)
	req.ReturnTo = strings.TrimSpace(req.ReturnTo)
	if req.Kind != model.GasterCodeBillingKindTopup && req.Kind != model.GasterCodeBillingKindSubscription {
		writeGasterCodeAPIError(c, http.StatusBadRequest, gasterCodeBillingCheckoutFailedCode, "kind must be topup or subscription")
		return
	}
	if req.PlanID == "" {
		writeGasterCodeAPIError(c, http.StatusBadRequest, gasterCodeBillingPlanUnavailableCode, "plan_id is required")
		return
	}

	user, err := model.GetUserById(session.UserID, false)
	if err != nil {
		writeGasterCodeAuthError(c, gasterCodeAuthReasonExpired, err.Error())
		return
	}
	result, err := createGasterCodeBillingCheckout(user, req, getGasterCodePublicBaseURL(c))
	if err != nil {
		writeGasterCodeBillingError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GasterCodeBillingCheckoutStatus(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		writeGasterCodeAuthError(c, classifyGasterCodeAuthReason(err), err.Error())
		return
	}
	checkout, err := model.GetGasterCodeBillingCheckout(c.Param("id"), session.UserID)
	if err != nil {
		writeGasterCodeAPIError(c, http.StatusNotFound, gasterCodeBillingCheckoutFailedCode, "checkout session was not found")
		return
	}
	if err := refreshGasterCodeCheckoutStatus(checkout); err != nil {
		writeGasterCodeAPIError(c, http.StatusInternalServerError, gasterCodeBillingCheckoutFailedCode, err.Error())
		return
	}
	common.ApiSuccess(c, buildGasterCodeCheckoutResponse(checkout))
}

func GasterCodeBillingTransactions(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		writeGasterCodeAuthError(c, classifyGasterCodeAuthReason(err), err.Error())
		return
	}
	transactions, err := listGasterCodeBillingTransactions(session.UserID)
	if err != nil {
		writeGasterCodeAPIError(c, http.StatusInternalServerError, gasterCodeBillingCheckoutFailedCode, err.Error())
		return
	}
	common.ApiSuccess(c, gin.H{"transactions": transactions})
}

func GasterCodeSubscriptionCancel(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		writeGasterCodeAuthError(c, classifyGasterCodeAuthReason(err), err.Error())
		return
	}
	if err := model.CancelCurrentUserSubscription(session.UserID); err != nil {
		if errors.Is(err, model.ErrUserSubscriptionNotFound) {
			writeGasterCodeAPIError(c, http.StatusNotFound, gasterCodeSubscriptionNotFoundCode, "subscription was not found")
			return
		}
		writeGasterCodeAPIError(c, http.StatusInternalServerError, gasterCodeSubscriptionNotFoundCode, err.Error())
		return
	}
	common.ApiSuccess(c, gin.H{"ok": true})
}

func GasterCodeSubscriptionResume(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		writeGasterCodeAuthError(c, classifyGasterCodeAuthReason(err), err.Error())
		return
	}
	if err := model.ResumeCurrentUserSubscription(session.UserID); err != nil {
		if errors.Is(err, model.ErrUserSubscriptionNotFound) {
			writeGasterCodeAPIError(c, http.StatusNotFound, gasterCodeSubscriptionNotFoundCode, "subscription was not found")
			return
		}
		if errors.Is(err, model.ErrUserSubscriptionNotResumable) {
			writeGasterCodeAPIError(c, http.StatusConflict, gasterCodeSubscriptionNotResumableCode, "subscription is not resumable")
			return
		}
		writeGasterCodeAPIError(c, http.StatusInternalServerError, gasterCodeSubscriptionNotResumableCode, err.Error())
		return
	}
	common.ApiSuccess(c, gin.H{"ok": true})
}

func buildGasterCodeBillingPlans(user *model.User) []gasterCodeBillingPlan {
	if user == nil {
		return []gasterCodeBillingPlan{}
	}
	plans := make([]gasterCodeBillingPlan, 0)
	amountOptions := append([]int(nil), operation_setting.GetPaymentSetting().AmountOptions...)
	sort.Ints(amountOptions)
	recommendedTopup := firstRecommendedTopupAmount(amountOptions)
	for _, amount := range amountOptions {
		if amount <= 0 || int64(amount) < getMinTopup() {
			continue
		}
		plans = append(plans, gasterCodeBillingPlan{
			Id:          fmt.Sprintf("topup_%d", amount),
			Kind:        model.GasterCodeBillingKindTopup,
			Name:        fmt.Sprintf("充值 %d", amount),
			Description: "G-Master API 额度充值，可用于 Gaster Code Desktop 内置 provider。",
			Price:       getPayMoney(int64(amount), user.Group),
			Currency:    operation_setting.GetQuotaDisplayType(),
			Interval:    "one_time",
			QuotaAmount: gasterCodeTopupQuotaAmount(int64(amount)),
			Unlimited:   false,
			Recommended: amount == recommendedTopup,
		})
	}

	var subscriptionPlans []model.SubscriptionPlan
	if err := model.DB.Where("enabled = ?", true).Order("sort_order desc, id desc").Find(&subscriptionPlans).Error; err != nil {
		return plans
	}
	for i, plan := range subscriptionPlans {
		description := strings.TrimSpace(plan.Subtitle)
		if description == "" {
			description = "G-Master API 订阅套餐，可用于 Gaster Code Desktop。"
		}
		plans = append(plans, gasterCodeBillingPlan{
			Id:          fmt.Sprintf("subscription_%d", plan.Id),
			Kind:        model.GasterCodeBillingKindSubscription,
			Name:        plan.Title,
			Description: description,
			Price:       plan.PriceAmount,
			Currency:    strings.TrimSpace(common.GetStringIfEmpty(plan.Currency, "USD")),
			Interval:    gasterCodeSubscriptionInterval(plan.DurationUnit),
			QuotaAmount: plan.TotalAmount,
			Unlimited:   plan.TotalAmount == 0,
			Recommended: i == 0,
		})
	}
	return plans
}

func createGasterCodeBillingCheckout(user *model.User, req gasterCodeBillingCheckoutRequest, publicBaseURL string) (*gasterCodeBillingCheckoutResponse, error) {
	if user == nil || user.Id <= 0 {
		return nil, newGasterCodeBillingError(gasterCodeBillingCheckoutFailedCode, "user is invalid")
	}
	switch req.Kind {
	case model.GasterCodeBillingKindTopup:
		return createGasterCodeTopupCheckout(user, req, publicBaseURL)
	case model.GasterCodeBillingKindSubscription:
		return createGasterCodeSubscriptionCheckout(user, req, publicBaseURL)
	default:
		return nil, newGasterCodeBillingError(gasterCodeBillingCheckoutFailedCode, "kind must be topup or subscription")
	}
}

func createGasterCodeTopupCheckout(user *model.User, req gasterCodeBillingCheckoutRequest, publicBaseURL string) (*gasterCodeBillingCheckoutResponse, error) {
	amount, ok := parseGasterCodeTopupPlanID(req.PlanID)
	if !ok || !isGasterCodeTopupAmountAvailable(amount) {
		return nil, newGasterCodeBillingError(gasterCodeBillingPlanUnavailableCode, "topup plan is unavailable")
	}
	payMoney := getPayMoney(amount, user.Group)
	if payMoney < 0.01 {
		return nil, newGasterCodeBillingError(gasterCodeBillingCheckoutFailedCode, "checkout amount is too low")
	}
	now := common.GetTimestamp()
	expiresAt := now + gasterCodeBillingCheckoutTTL()
	checkoutID := newGasterCodeCheckoutID(user.Id, model.GasterCodeBillingKindTopup)
	tradeNo := newGasterCodeTradeNo("topup", user.Id, checkoutID)
	checkoutURL := buildGasterCodeCheckoutURL(publicBaseURL, checkoutID, req)
	checkout := &model.GasterCodeBillingCheckout{
		Id:        checkoutID,
		UserID:    user.Id,
		Kind:      model.GasterCodeBillingKindTopup,
		PlanID:    fmt.Sprintf("topup_%d", amount),
		TradeNo:   tradeNo,
		Status:    model.GasterCodeCheckoutStatusPending,
		URL:       checkoutURL,
		ExpiresAt: expiresAt,
	}
	topUp := &model.TopUp{
		UserId:          user.Id,
		Amount:          normalizeGasterCodeTopupAmountForStorage(amount),
		Money:           payMoney,
		TradeNo:         tradeNo,
		PaymentMethod:   gasterCodeDesktopPaymentProvider,
		PaymentProvider: gasterCodeDesktopPaymentProvider,
		CreateTime:      now,
		Status:          common.TopUpStatusPending,
	}
	err := model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(topUp).Error; err != nil {
			return err
		}
		return tx.Create(checkout).Error
	})
	if err != nil {
		return nil, fmt.Errorf("%s: %w", gasterCodeBillingCheckoutFailedCode, err)
	}
	model.RecordLog(user.Id, model.LogTypeSystem, fmt.Sprintf("Gaster Code Desktop 创建充值 checkout: %s", checkoutID))
	return buildGasterCodeCheckoutResponse(checkout), nil
}

func createGasterCodeSubscriptionCheckout(user *model.User, req gasterCodeBillingCheckoutRequest, publicBaseURL string) (*gasterCodeBillingCheckoutResponse, error) {
	planID, ok := parseGasterCodeSubscriptionPlanID(req.PlanID)
	if !ok {
		return nil, newGasterCodeBillingError(gasterCodeBillingPlanUnavailableCode, "subscription plan is unavailable")
	}
	plan, err := model.GetSubscriptionPlanById(planID)
	if err != nil || plan == nil || !plan.Enabled {
		return nil, newGasterCodeBillingError(gasterCodeBillingPlanUnavailableCode, "subscription plan is unavailable")
	}
	if plan.MaxPurchasePerUser > 0 {
		count, err := model.CountUserSubscriptionsByPlan(user.Id, plan.Id)
		if err != nil {
			return nil, err
		}
		if count >= int64(plan.MaxPurchasePerUser) {
			return nil, newGasterCodeBillingError(gasterCodeBillingPlanUnavailableCode, "subscription purchase limit reached")
		}
	}
	now := common.GetTimestamp()
	expiresAt := now + gasterCodeBillingCheckoutTTL()
	checkoutID := newGasterCodeCheckoutID(user.Id, model.GasterCodeBillingKindSubscription)
	tradeNo := newGasterCodeTradeNo("subscription", user.Id, checkoutID)
	checkoutURL := buildGasterCodeCheckoutURL(publicBaseURL, checkoutID, req)
	checkout := &model.GasterCodeBillingCheckout{
		Id:        checkoutID,
		UserID:    user.Id,
		Kind:      model.GasterCodeBillingKindSubscription,
		PlanID:    fmt.Sprintf("subscription_%d", plan.Id),
		TradeNo:   tradeNo,
		Status:    model.GasterCodeCheckoutStatusPending,
		URL:       checkoutURL,
		ExpiresAt: expiresAt,
	}
	order := &model.SubscriptionOrder{
		UserId:          user.Id,
		PlanId:          plan.Id,
		Money:           plan.PriceAmount,
		TradeNo:         tradeNo,
		PaymentMethod:   gasterCodeDesktopPaymentProvider,
		PaymentProvider: gasterCodeDesktopPaymentProvider,
		CreateTime:      now,
		Status:          common.TopUpStatusPending,
	}
	err = model.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		return tx.Create(checkout).Error
	})
	if err != nil {
		return nil, fmt.Errorf("%s: %w", gasterCodeBillingCheckoutFailedCode, err)
	}
	model.RecordLog(user.Id, model.LogTypeSystem, fmt.Sprintf("Gaster Code Desktop 创建订阅 checkout: %s", checkoutID))
	return buildGasterCodeCheckoutResponse(checkout), nil
}

func refreshGasterCodeCheckoutStatus(checkout *model.GasterCodeBillingCheckout) error {
	if checkout == nil {
		return errors.New("checkout is nil")
	}
	status := checkout.Status
	switch checkout.Kind {
	case model.GasterCodeBillingKindTopup:
		if topUp := model.GetTopUpByTradeNo(checkout.TradeNo); topUp != nil {
			status = gasterCodeCheckoutStatusFromPaymentStatus(topUp.Status)
		}
	case model.GasterCodeBillingKindSubscription:
		if order := model.GetSubscriptionOrderByTradeNo(checkout.TradeNo); order != nil {
			status = gasterCodeCheckoutStatusFromPaymentStatus(order.Status)
		}
	}
	if status == model.GasterCodeCheckoutStatusPending {
		inferredStatus, err := inferGasterCodeCheckoutStatusFromAccountChanges(checkout)
		if err != nil {
			return err
		}
		if inferredStatus != "" {
			status = inferredStatus
		}
	}
	if status == model.GasterCodeCheckoutStatusPending && checkout.ExpiresAt > 0 && checkout.ExpiresAt <= common.GetTimestamp() {
		status = model.GasterCodeCheckoutStatusExpired
	}
	if status == checkout.Status {
		return nil
	}
	checkout.Status = status
	return model.DB.Model(checkout).Update("status", status).Error
}

func inferGasterCodeCheckoutStatusFromAccountChanges(checkout *model.GasterCodeBillingCheckout) (string, error) {
	if checkout == nil || checkout.UserID <= 0 {
		return "", nil
	}
	switch checkout.Kind {
	case model.GasterCodeBillingKindTopup:
		amount, ok := parseGasterCodeTopupPlanID(checkout.PlanID)
		if !ok {
			return "", nil
		}
		storedAmount := normalizeGasterCodeTopupAmountForStorage(amount)
		var count int64
		if err := model.DB.Model(&model.TopUp{}).
			Where("user_id = ? AND status = ? AND create_time >= ? AND amount = ?", checkout.UserID, common.TopUpStatusSuccess, checkout.CreatedAt, storedAmount).
			Count(&count).Error; err != nil {
			return "", err
		}
		if count > 0 {
			return model.GasterCodeCheckoutStatusPaid, nil
		}
	case model.GasterCodeBillingKindSubscription:
		planID, ok := parseGasterCodeSubscriptionPlanID(checkout.PlanID)
		if !ok {
			return "", nil
		}
		var count int64
		if err := model.DB.Model(&model.UserSubscription{}).
			Where("user_id = ? AND plan_id = ? AND status = ? AND created_at >= ?", checkout.UserID, planID, "active", checkout.CreatedAt).
			Count(&count).Error; err != nil {
			return "", err
		}
		if count > 0 {
			return model.GasterCodeCheckoutStatusPaid, nil
		}
	}
	return "", nil
}

func listGasterCodeBillingTransactions(userID int) ([]gasterCodeBillingTransaction, error) {
	transactions := make([]gasterCodeBillingTransaction, 0)
	var topUps []model.TopUp
	if err := model.DB.Where("user_id = ?", userID).Order("id desc").Limit(100).Find(&topUps).Error; err != nil {
		return nil, err
	}
	for _, topUp := range topUps {
		transactions = append(transactions, gasterCodeBillingTransaction{
			Id:          topUp.TradeNo,
			Kind:        "topup",
			Status:      gasterCodeTransactionStatusFromPaymentStatus(topUp.Status),
			Amount:      topUp.Money,
			Currency:    operation_setting.GetQuotaDisplayType(),
			CreatedAt:   topUp.CreateTime,
			Description: gasterCodeTopupDescription(topUp),
		})
	}

	var orders []model.SubscriptionOrder
	if err := model.DB.Where("user_id = ?", userID).Order("id desc").Limit(100).Find(&orders).Error; err != nil {
		return nil, err
	}
	for _, order := range orders {
		transactions = append(transactions, gasterCodeBillingTransaction{
			Id:          order.TradeNo,
			Kind:        "subscription",
			Status:      gasterCodeTransactionStatusFromPaymentStatus(order.Status),
			Amount:      order.Money,
			Currency:    operation_setting.GetQuotaDisplayType(),
			CreatedAt:   order.CreateTime,
			Description: fmt.Sprintf("Gaster Code Desktop 订阅订单 #%d", order.PlanId),
		})
	}

	var logs []model.Log
	if err := model.LOG_DB.Where("user_id = ? AND type IN ?", userID, []int{model.LogTypeConsume, model.LogTypeRefund, model.LogTypeManage}).
		Order("id desc").
		Limit(100).
		Find(&logs).Error; err != nil {
		return nil, err
	}
	for _, log := range logs {
		kind := "usage"
		status := "paid"
		amount := float64(log.Quota)
		if log.Type == model.LogTypeRefund {
			kind = "refund"
			status = "refunded"
			if amount > 0 {
				amount = -amount
			}
		} else if log.Type == model.LogTypeManage {
			kind = "adjustment"
			amount = 0
		}
		description := strings.TrimSpace(log.Content)
		if description == "" {
			description = strings.TrimSpace(log.ModelName)
		}
		transactions = append(transactions, gasterCodeBillingTransaction{
			Id:          fmt.Sprintf("log_%d", log.Id),
			Kind:        kind,
			Status:      status,
			Amount:      amount,
			Currency:    "quota",
			CreatedAt:   log.CreatedAt,
			Description: description,
		})
	}

	sort.SliceStable(transactions, func(i, j int) bool {
		return transactions[i].CreatedAt > transactions[j].CreatedAt
	})
	if len(transactions) > 100 {
		transactions = transactions[:100]
	}
	return transactions, nil
}

type gasterCodeBillingError struct {
	Code    string
	Message string
}

func (e *gasterCodeBillingError) Error() string {
	return e.Message
}

func newGasterCodeBillingError(code string, message string) error {
	return &gasterCodeBillingError{Code: code, Message: message}
}

func writeGasterCodeBillingError(c *gin.Context, err error) {
	var billingErr *gasterCodeBillingError
	if errors.As(err, &billingErr) {
		status := http.StatusBadRequest
		if billingErr.Code == gasterCodeBillingProviderUnavailableCode {
			status = http.StatusServiceUnavailable
		}
		writeGasterCodeAPIError(c, status, billingErr.Code, billingErr.Message)
		return
	}
	msg := err.Error()
	code := gasterCodeBillingCheckoutFailedCode
	if strings.Contains(msg, gasterCodeBillingCheckoutFailedCode) {
		msg = strings.TrimSpace(strings.TrimPrefix(msg, gasterCodeBillingCheckoutFailedCode+":"))
	}
	writeGasterCodeAPIError(c, http.StatusInternalServerError, code, msg)
}

func writeGasterCodeAPIError(c *gin.Context, status int, code string, message string) {
	c.JSON(status, gin.H{
		"success": false,
		"code":    code,
		"message": message,
	})
}

func buildGasterCodeCheckoutResponse(checkout *model.GasterCodeBillingCheckout) *gasterCodeBillingCheckoutResponse {
	if checkout == nil {
		return &gasterCodeBillingCheckoutResponse{}
	}
	return &gasterCodeBillingCheckoutResponse{
		Id:        checkout.Id,
		URL:       checkout.URL,
		Status:    checkout.Status,
		Kind:      checkout.Kind,
		ExpiresAt: checkout.ExpiresAt,
	}
}

func firstRecommendedTopupAmount(amounts []int) int {
	if len(amounts) == 0 {
		return 0
	}
	for _, amount := range amounts {
		if amount == 100 {
			return amount
		}
	}
	return amounts[len(amounts)/2]
}

func gasterCodeSubscriptionInterval(unit string) string {
	switch strings.TrimSpace(unit) {
	case model.SubscriptionDurationYear:
		return "year"
	case model.SubscriptionDurationMonth:
		return "month"
	default:
		return "one_time"
	}
}

func parseGasterCodeTopupPlanID(planID string) (int64, bool) {
	trimmed := strings.TrimSpace(planID)
	trimmed = strings.TrimPrefix(trimmed, "topup_")
	trimmed = strings.TrimPrefix(trimmed, "topup:")
	amount, err := strconv.ParseInt(trimmed, 10, 64)
	if err != nil || amount <= 0 {
		return 0, false
	}
	return amount, true
}

func parseGasterCodeSubscriptionPlanID(planID string) (int, bool) {
	trimmed := strings.TrimSpace(planID)
	trimmed = strings.TrimPrefix(trimmed, "subscription_")
	trimmed = strings.TrimPrefix(trimmed, "subscription:")
	planIDInt, err := strconv.Atoi(trimmed)
	if err != nil || planIDInt <= 0 {
		return 0, false
	}
	return planIDInt, true
}

func isGasterCodeTopupAmountAvailable(amount int64) bool {
	if amount < getMinTopup() {
		return false
	}
	for _, option := range operation_setting.GetPaymentSetting().AmountOptions {
		if int64(option) == amount {
			return true
		}
	}
	return false
}

func gasterCodeTopupQuotaAmount(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() == operation_setting.QuotaDisplayTypeTokens {
		return amount
	}
	return decimal.NewFromInt(amount).Mul(decimal.NewFromFloat(common.QuotaPerUnit)).IntPart()
}

func normalizeGasterCodeTopupAmountForStorage(amount int64) int64 {
	if operation_setting.GetQuotaDisplayType() != operation_setting.QuotaDisplayTypeTokens {
		return amount
	}
	dAmount := decimal.NewFromInt(amount)
	dQuotaPerUnit := decimal.NewFromFloat(common.QuotaPerUnit)
	return dAmount.Div(dQuotaPerUnit).IntPart()
}

func newGasterCodeCheckoutID(userID int, kind string) string {
	seed := fmt.Sprintf("%d:%s:%d:%s", userID, kind, time.Now().UnixNano(), common.GetRandomString(8))
	return "gcbc_" + common.Sha1([]byte(seed))[:32]
}

func newGasterCodeTradeNo(kind string, userID int, checkoutID string) string {
	seed := fmt.Sprintf("%s:%d:%s:%d", kind, userID, checkoutID, time.Now().UnixNano())
	return "gc_" + kind + "_" + common.Sha1([]byte(seed))[:24]
}

func buildGasterCodeCheckoutURL(publicBaseURL string, checkoutID string, req gasterCodeBillingCheckoutRequest) string {
	base := strings.TrimRight(strings.TrimSpace(publicBaseURL), "/")
	if base == "" {
		base = "https://gmapi.fun"
	}
	values := url.Values{}
	values.Set("source", "gaster-code")
	values.Set("checkout_id", checkoutID)
	values.Set("kind", req.Kind)
	values.Set("plan_id", req.PlanID)
	if req.ReturnTo != "" {
		values.Set("return_to", req.ReturnTo)
	}
	return base + "/console/topup?" + values.Encode()
}

func gasterCodeBillingCheckoutTTL() int64 {
	ttl := common.GetEnvOrDefault("GASTER_CODE_BILLING_CHECKOUT_TTL_SECONDS", gasterCodeBillingCheckoutDefaultTTLSecond)
	if ttl <= 0 {
		ttl = gasterCodeBillingCheckoutDefaultTTLSecond
	}
	return int64(ttl)
}

func gasterCodeCheckoutStatusFromPaymentStatus(status string) string {
	switch strings.TrimSpace(status) {
	case common.TopUpStatusSuccess:
		return model.GasterCodeCheckoutStatusPaid
	case common.TopUpStatusFailed:
		return model.GasterCodeCheckoutStatusFailed
	case common.TopUpStatusExpired:
		return model.GasterCodeCheckoutStatusExpired
	case "cancelled", "canceled":
		return model.GasterCodeCheckoutStatusCancelled
	default:
		return model.GasterCodeCheckoutStatusPending
	}
}

func gasterCodeTransactionStatusFromPaymentStatus(status string) string {
	switch gasterCodeCheckoutStatusFromPaymentStatus(status) {
	case model.GasterCodeCheckoutStatusPaid:
		return "paid"
	case model.GasterCodeCheckoutStatusFailed:
		return "failed"
	case model.GasterCodeCheckoutStatusExpired:
		return "cancelled"
	case model.GasterCodeCheckoutStatusCancelled:
		return "cancelled"
	default:
		return "pending"
	}
}

func gasterCodeTopupDescription(topUp model.TopUp) string {
	if topUp.PaymentProvider == gasterCodeDesktopPaymentProvider {
		return "Gaster Code Desktop 充值"
	}
	if strings.TrimSpace(topUp.PaymentProvider) != "" {
		return "在线充值 - " + topUp.PaymentProvider
	}
	return "在线充值"
}
