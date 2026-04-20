package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/controller"
	"github.com/yangjunyu/G-Master-API/middleware"
)

const (
	aiClientDocsURL     = "https://s.apifox.cn/4c8343d0-458d-4898-9813-62a1253fba2d"
	openClawEnglishDocs = "https://s.apifox.cn/4c8343d0-458d-4898-9813-62a1253fba2d/8547263m0"
)

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.GET("/docs", redirectToApifoxDocs(aiClientDocsURL))
	router.HEAD("/docs", redirectToApifoxDocs(aiClientDocsURL))
	router.GET("/docs/ai-client", redirectToApifoxDocs(aiClientDocsURL))
	router.HEAD("/docs/ai-client", redirectToApifoxDocs(aiClientDocsURL))
	router.GET("/docs/openclaw-en", redirectToApifoxDocs(openClawEnglishDocs))
	router.HEAD("/docs/openclaw-en", redirectToApifoxDocs(openClawEnglishDocs))
	router.Use(static.Serve("/", common.EmbedFolder(buildFS, "web/dist")))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}
		c.Header("Cache-Control", "no-cache")
		c.Data(http.StatusOK, "text/html; charset=utf-8", indexPage)
	})
}

func redirectToApifoxDocs(target string) gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Redirect(http.StatusFound, target)
	}
}
