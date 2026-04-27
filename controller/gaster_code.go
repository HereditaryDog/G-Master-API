package controller

import (
	"errors"
	"fmt"
	"html"
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-contrib/sessions"
	"github.com/gin-gonic/gin"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
	"github.com/yangjunyu/G-Master-API/service"
	"github.com/yangjunyu/G-Master-API/setting/system_setting"
)

type gasterCodeAuthStartRequest struct {
	CodeChallenge       string `json:"code_challenge" binding:"required"`
	CodeChallengeMethod string `json:"code_challenge_method" binding:"required"`
	State               string `json:"state" binding:"required"`
	RedirectURI         string `json:"redirect_uri" binding:"required"`
	ClientName          string `json:"client_name"`
	ClientVersion       string `json:"client_version"`
}

type gasterCodeTokenRequest struct {
	Code         string `json:"code" binding:"required"`
	CodeVerifier string `json:"code_verifier" binding:"required"`
	RedirectURI  string `json:"redirect_uri" binding:"required"`
}

type gasterCodeRefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

type gasterCodeRevokeRequest struct {
	RevokeProviderToken bool `json:"revoke_provider_token"`
}

func GasterCodeAuthStart(c *gin.Context) {
	var req gasterCodeAuthStartRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	result, err := service.StartGasterCodeAuth(service.GasterCodeAuthStartInput{
		CodeChallenge:       req.CodeChallenge,
		CodeChallengeMethod: req.CodeChallengeMethod,
		State:               req.State,
		RedirectURI:         req.RedirectURI,
		ClientName:          req.ClientName,
		ClientVersion:       req.ClientVersion,
	}, getGasterCodePublicBaseURL(c))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GasterCodeDesktopLogin(c *gin.Context) {
	c.Header("Cache-Control", "no-store")
	requestID := strings.TrimSpace(c.Query("request_id"))
	if requestID == "" {
		c.Data(http.StatusBadRequest, "text/html; charset=utf-8", []byte(renderGasterCodeMessagePage("Gaster Code 授权", "缺少 request_id。", "")))
		return
	}
	req, err := model.GetGasterCodeAuthRequestByRequestID(requestID)
	if err != nil {
		c.Data(http.StatusNotFound, "text/html; charset=utf-8", []byte(renderGasterCodeMessagePage("Gaster Code 授权", "授权请求不存在或已过期。", "")))
		return
	}
	if req.Status != model.GasterCodeAuthStatusPending || req.ExpiresAt <= common.GetTimestamp() {
		c.Data(http.StatusGone, "text/html; charset=utf-8", []byte(renderGasterCodeMessagePage("Gaster Code 授权", "授权请求已过期，请回到 Gaster Code 重新发起登录。", "")))
		return
	}
	userID, ok := getLoggedInUserIDFromSession(c)
	if !ok {
		redirectTarget := "/gaster-code/desktop-login?request_id=" + url.QueryEscape(requestID)
		loginURL := "/login?redirect=" + url.QueryEscape(redirectTarget)
		c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(renderGasterCodeLoginRequiredPage(requestID, loginURL)))
		return
	}
	user, err := model.GetUserById(userID, false)
	if err != nil || user.Status != common.UserStatusEnabled {
		c.Data(http.StatusForbidden, "text/html; charset=utf-8", []byte(renderGasterCodeMessagePage("Gaster Code 授权", "当前账号不可用。", "")))
		return
	}
	c.Data(http.StatusOK, "text/html; charset=utf-8", []byte(renderGasterCodeAuthorizePage(req, user)))
}

func GasterCodeAuthApprove(c *gin.Context) {
	requestID := strings.TrimSpace(c.PostForm("request_id"))
	if requestID == "" {
		var req struct {
			RequestID string `json:"request_id"`
		}
		_ = c.ShouldBindJSON(&req)
		requestID = strings.TrimSpace(req.RequestID)
	}
	userID, ok := getLoggedInUserIDFromSession(c)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": "not logged in"})
		return
	}
	redirectURL, err := service.ApproveGasterCodeAuthRequest(requestID, userID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.Redirect(http.StatusSeeOther, redirectURL)
}

func GasterCodeAuthDeny(c *gin.Context) {
	requestID := strings.TrimSpace(c.PostForm("request_id"))
	if requestID == "" {
		var req struct {
			RequestID string `json:"request_id"`
		}
		_ = c.ShouldBindJSON(&req)
		requestID = strings.TrimSpace(req.RequestID)
	}
	redirectURL, err := service.DenyGasterCodeAuthRequest(requestID)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	c.Redirect(http.StatusSeeOther, redirectURL)
}

func GasterCodeAuthToken(c *gin.Context) {
	var req gasterCodeTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	result, err := service.ExchangeGasterCodeAuthCode(service.GasterCodeTokenExchangeInput{
		Code:         req.Code,
		CodeVerifier: req.CodeVerifier,
		RedirectURI:  req.RedirectURI,
	})
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GasterCodeAuthRefresh(c *gin.Context) {
	var req gasterCodeRefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	result, err := service.RefreshGasterCodeToken(req.RefreshToken)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GasterCodeMe(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}
	result, err := service.BuildGasterCodeMeResult(session.UserID, getGasterCodePublicBaseURL(c))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GasterCodeProviderToken(c *gin.Context) {
	session, err := getGasterCodeSessionFromRequest(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}
	result, err := service.GetOrCreateGasterCodeProviderToken(session, getGasterCodePublicBaseURL(c))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, result)
}

func GasterCodeAuthRevoke(c *gin.Context) {
	token, err := getBearerToken(c)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"success": false, "message": err.Error()})
		return
	}
	var req gasterCodeRevokeRequest
	if c.Request.Body != nil && c.Request.ContentLength != 0 {
		_ = c.ShouldBindJSON(&req)
	}
	if c.Query("revoke_provider_token") == "true" {
		req.RevokeProviderToken = true
	}
	if err := service.RevokeGasterCodeSession(token, req.RevokeProviderToken); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

func getGasterCodeSessionFromRequest(c *gin.Context) (*model.GasterCodeSession, error) {
	token, err := getBearerToken(c)
	if err != nil {
		return nil, err
	}
	return service.GetGasterCodeSessionFromAccessToken(token)
}

func getBearerToken(c *gin.Context) (string, error) {
	auth := strings.TrimSpace(c.GetHeader("Authorization"))
	if auth == "" {
		return "", errors.New("missing Authorization bearer token")
	}
	if strings.HasPrefix(strings.ToLower(auth), "bearer ") {
		auth = strings.TrimSpace(auth[7:])
	}
	if auth == "" {
		return "", errors.New("empty bearer token")
	}
	return auth, nil
}

func getLoggedInUserIDFromSession(c *gin.Context) (int, bool) {
	session := sessions.Default(c)
	id, ok := session.Get("id").(int)
	if !ok || id <= 0 {
		return 0, false
	}
	status, ok := session.Get("status").(int)
	if ok && status == common.UserStatusDisabled {
		return 0, false
	}
	return id, true
}

func getGasterCodePublicBaseURL(c *gin.Context) string {
	if strings.TrimSpace(system_setting.ServerAddress) != "" {
		return strings.TrimRight(system_setting.ServerAddress, "/")
	}
	scheme := c.GetHeader("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
	}
	host := c.GetHeader("X-Forwarded-Host")
	if host == "" {
		host = c.Request.Host
	}
	if host == "" {
		return "https://gmapi.fun"
	}
	return scheme + "://" + host
}

func renderGasterCodeLoginRequiredPage(requestID string, loginURL string) string {
	body := fmt.Sprintf(`
<p>请先登录 G-Master API 账号，然后回到此页面授权 Gaster Code。</p>
<a class="primary" href="%s">打开登录页</a>
<p class="hint">如果登录后没有自动回到授权页，请重新从 Gaster Code 点击“使用 G-Master API 账号登录”。</p>
<p class="mono">request_id: %s</p>`, html.EscapeString(loginURL), html.EscapeString(requestID))
	return renderGasterCodeShell("Gaster Code 登录", body)
}

func renderGasterCodeAuthorizePage(req *model.GasterCodeAuthRequest, user *model.User) string {
	clientName := common.GetStringIfEmpty(req.ClientName, "Gaster Code")
	body := fmt.Sprintf(`
<div class="badge">Desktop Authorization</div>
<h1>Authorize %s</h1>
<p>%s 将获取一个可撤销的桌面端 token，用于查询账号状态并领取专用于 Gaster Code Desktop 的模型调用 token。</p>
<div class="card">
  <div><span>当前账号</span><strong>%s</strong></div>
  <div><span>客户端版本</span><strong>%s</strong></div>
  <div><span>回调地址</span><strong class="mono">%s</strong></div>
</div>
<div class="actions">
  <form method="post" action="/api/gaster-code/auth/approve">
    <input type="hidden" name="request_id" value="%s" />
    <button class="primary" type="submit">授权并返回 Gaster Code</button>
  </form>
  <form method="post" action="/api/gaster-code/auth/deny">
    <input type="hidden" name="request_id" value="%s" />
    <button class="secondary" type="submit">拒绝</button>
  </form>
</div>`,
		html.EscapeString(clientName),
		html.EscapeString(clientName),
		html.EscapeString(user.Username),
		html.EscapeString(req.ClientVersion),
		html.EscapeString(req.RedirectURI),
		html.EscapeString(req.RequestID),
		html.EscapeString(req.RequestID),
	)
	return renderGasterCodeShell("Authorize Gaster Code", body)
}

func renderGasterCodeMessagePage(title string, message string, extra string) string {
	body := fmt.Sprintf("<h1>%s</h1><p>%s</p>%s", html.EscapeString(title), html.EscapeString(message), extra)
	return renderGasterCodeShell(title, body)
}

func renderGasterCodeShell(title string, body string) string {
	return fmt.Sprintf(`<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>%s</title>
  <style>
    :root { color-scheme: dark; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: radial-gradient(circle at 20%% 10%%, rgba(105, 74, 255, .25), transparent 34%%), #071020; color: #edf4ff; }
    main { width: min(720px, calc(100vw - 40px)); border: 1px solid rgba(142, 166, 255, .25); border-radius: 24px; padding: 32px; background: rgba(13, 24, 46, .86); box-shadow: 0 24px 80px rgba(0, 0, 0, .35); }
    h1 { margin: 10px 0 12px; font-size: 32px; }
    p { color: #aebbd6; line-height: 1.7; }
    .badge { display: inline-flex; border-radius: 999px; padding: 6px 12px; background: rgba(116, 87, 255, .16); color: #b9a8ff; font-weight: 700; }
    .card { display: grid; gap: 14px; margin: 24px 0; padding: 18px; border-radius: 18px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.08); }
    .card div { display: flex; justify-content: space-between; gap: 16px; }
    .card span, .hint { color: #8f9cb8; }
    .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; word-break: break-all; }
    .actions { display: flex; flex-wrap: wrap; gap: 12px; }
    button, a.primary { border: 0; cursor: pointer; border-radius: 14px; padding: 12px 18px; font-weight: 800; text-decoration: none; display: inline-flex; }
    .primary { color: #fff; background: linear-gradient(135deg, #4f7dff, #8b4dff); box-shadow: 0 14px 32px rgba(92, 95, 255, .35); }
    .secondary { color: #d6def5; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12); }
  </style>
</head>
<body><main>%s</main></body>
</html>`, html.EscapeString(title), body)
}
