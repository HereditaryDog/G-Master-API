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

func SetWebRouter(router *gin.Engine, buildFS embed.FS, indexPage []byte) {
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.GET("/gaster-code/desktop-login", controller.GasterCodeDesktopLogin)
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
