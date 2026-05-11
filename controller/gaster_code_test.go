package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
	"gorm.io/gorm"
)

func setupGasterCodeControllerTestDB(t *testing.T) {
	t.Helper()
	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "_")+"?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	model.LOG_DB = db
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	require.NoError(t, db.AutoMigrate(&model.GasterCodeSession{}))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
}

func TestGasterCodeAuthStartReturnsBadRequestForInvalidIntent(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/gaster-code/auth/start", strings.NewReader(`{
		"state":"state-invalid-intent",
		"redirect_uri":"http://127.0.0.1:18790/api/gmaster-auth/callback",
		"code_challenge":"abcdefghijklmnopqrstuvwxyz1234567890ABCDEFG",
		"code_challenge_method":"S256",
		"client_name":"Gaster Code",
		"client_version":"0.2.1-gastercode.test",
		"intent":"signup"
	}`))
	ctx.Request.Header.Set("Content-Type", "application/json")

	GasterCodeAuthStart(ctx)

	assert.Equal(t, http.StatusBadRequest, recorder.Code)
	assert.Contains(t, recorder.Body.String(), "intent")
}

func TestGasterCodeMeMissingBearerReturnsMachineReadableLoginRequired(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/gaster-code/me", nil)

	GasterCodeMe(ctx)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	var body map[string]any
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &body))
	assert.Equal(t, false, body["success"])
	assert.Equal(t, "authentication_failed", body["code"])
	assert.Equal(t, "login_required", body["reason"])
	assert.Equal(t, "relogin", body["action"])
	assert.NotEmpty(t, body["userMessage"])
}

func TestGasterCodeAuthRefreshInvalidTokenReturnsMachineReadableSessionExpired(t *testing.T) {
	setupGasterCodeControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/api/gaster-code/auth/refresh", strings.NewReader(`{"refresh_token":"gc_rt_invalid"}`))
	ctx.Request.Header.Set("Content-Type", "application/json")

	GasterCodeAuthRefresh(ctx)

	assert.Equal(t, http.StatusUnauthorized, recorder.Code)
	var body map[string]any
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &body))
	assert.Equal(t, false, body["success"])
	assert.Equal(t, "authentication_failed", body["code"])
	assert.Equal(t, "session_expired", body["reason"])
	assert.Equal(t, "relogin", body["action"])
	assert.NotEmpty(t, body["userMessage"])
}
