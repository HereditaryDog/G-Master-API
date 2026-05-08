package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

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
