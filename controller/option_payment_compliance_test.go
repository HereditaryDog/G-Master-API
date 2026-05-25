package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/setting/operation_setting"
)

func performUpdateOptionForTest(body string) *httptest.ResponseRecorder {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	request := httptest.NewRequest(http.MethodPut, "/api/option/", strings.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = request
	UpdateOption(ctx)
	return recorder
}

func TestUpdateOptionRejectsPositiveInviteQuotaWithoutPaymentCompliance(t *testing.T) {
	paymentSetting := operation_setting.GetPaymentSetting()
	oldConfirmed := paymentSetting.ComplianceConfirmed
	paymentSetting.ComplianceConfirmed = false
	t.Cleanup(func() {
		paymentSetting.ComplianceConfirmed = oldConfirmed
	})

	recorder := performUpdateOptionForTest(`{"key":"QuotaForInviter","value":"10"}`)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Contains(t, recorder.Body.String(), "请先在支付设置中确认支付合规声明")
}

func TestUpdateOptionRejectsGenericPaymentComplianceKeyWrites(t *testing.T) {
	recorder := performUpdateOptionForTest(`{"key":"payment_setting.compliance_confirmed","value":"true"}`)

	require.Equal(t, http.StatusOK, recorder.Code)
	require.Contains(t, recorder.Body.String(), "合规确认字段不允许通过通用设置接口修改")
}
