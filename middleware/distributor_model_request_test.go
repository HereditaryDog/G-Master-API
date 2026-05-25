package middleware

import (
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

func newDistributorJSONContext(body string) *gin.Context {
	gin.SetMode(gin.TestMode)
	c, _ := gin.CreateTestContext(httptest.NewRecorder())
	req := httptest.NewRequest(http.MethodPost, "/v1/chat/completions", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	c.Request = req
	return c
}

func TestGetModelFromJSONBodyPreservesReusableBody(t *testing.T) {
	c := newDistributorJSONContext(`{"model":"gpt-5.1","group":"vip","messages":[{"role":"user","content":"hi"}]}`)

	modelRequest, err := getModelFromRequest(c)
	require.NoError(t, err)
	require.Equal(t, "gpt-5.1", modelRequest.Model)
	require.Equal(t, "vip", modelRequest.Group)

	bodyAfter, err := io.ReadAll(c.Request.Body)
	require.NoError(t, err)
	require.JSONEq(t, `{"model":"gpt-5.1","group":"vip","messages":[{"role":"user","content":"hi"}]}`, string(bodyAfter))
}

func TestGetModelFromJSONBodyRejectsNonStringModel(t *testing.T) {
	c := newDistributorJSONContext(`{"model":123}`)

	_, err := getModelFromJSONBody(c)
	require.Error(t, err)
	require.Contains(t, err.Error(), "model")
}
