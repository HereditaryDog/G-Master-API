package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
)

func TestGetTopUpInfoIncludesTopupLink(t *testing.T) {
	gin.SetMode(gin.TestMode)

	originalTopUpLink := common.TopUpLink
	t.Cleanup(func() {
		common.TopUpLink = originalTopUpLink
	})
	common.TopUpLink = "https://example.com/topup"

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	GetTopUpInfo(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)

	var response struct {
		Success bool `json:"success"`
		Data    struct {
			TopupLink string `json:"topup_link"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	require.Equal(t, common.TopUpLink, response.Data.TopupLink)
}
