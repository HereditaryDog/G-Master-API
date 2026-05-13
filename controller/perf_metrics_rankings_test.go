package controller

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/model"
	"gorm.io/gorm"
)

func setupPerfMetricsControllerTestDB(t *testing.T) {
	t.Helper()
	oldDB := model.DB
	oldLogDB := model.LOG_DB
	oldUsingSQLite := common.UsingSQLite
	oldUsingMySQL := common.UsingMySQL
	oldUsingPostgreSQL := common.UsingPostgreSQL
	oldRedisEnabled := common.RedisEnabled

	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "_")+"?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	model.LOG_DB = db
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	require.NoError(t, db.AutoMigrate(&model.PerfMetric{}, &model.QuotaData{}, &model.Ability{}, &model.Model{}, &model.Vendor{}))
	model.InvalidatePricingCache()
	t.Cleanup(func() {
		model.DB = oldDB
		model.LOG_DB = oldLogDB
		common.UsingSQLite = oldUsingSQLite
		common.UsingMySQL = oldUsingMySQL
		common.UsingPostgreSQL = oldUsingPostgreSQL
		common.RedisEnabled = oldRedisEnabled
		model.InvalidatePricingCache()
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
}

func TestGetPerfMetricsSummaryReturnsAggregatedModels(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	require.NoError(t, model.DB.Create(&model.PerfMetric{
		ModelName:      "deepseek-v4-pro",
		Group:          "auto",
		BucketTs:       time.Now().Add(-time.Hour).Unix(),
		RequestCount:   2,
		SuccessCount:   1,
		TotalLatencyMs: 3000,
		OutputTokens:   1200,
		GenerationMs:   2000,
	}).Error)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics/summary?hours=24", nil)

	GetPerfMetricsSummary(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Models []struct {
				ModelName    string  `json:"model_name"`
				AvgLatencyMs int64   `json:"avg_latency_ms"`
				SuccessRate  float64 `json:"success_rate"`
				AvgTps       float64 `json:"avg_tps"`
			} `json:"models"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	require.Len(t, response.Data.Models, 1)
	require.Equal(t, "deepseek-v4-pro", response.Data.Models[0].ModelName)
	require.Equal(t, int64(1500), response.Data.Models[0].AvgLatencyMs)
	require.Equal(t, 50.0, response.Data.Models[0].SuccessRate)
	require.Equal(t, 600.0, response.Data.Models[0].AvgTps)
}

func TestGetPerfMetricsRequiresModel(t *testing.T) {
	gin.SetMode(gin.TestMode)
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/perf-metrics", nil)

	GetPerfMetrics(ctx)

	require.Equal(t, http.StatusBadRequest, recorder.Code)
	var response struct {
		Success bool   `json:"success"`
		Message string `json:"message"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.False(t, response.Success)
	require.Contains(t, response.Message, "model")
}

func TestGetRankingsReturnsModelLeaderboard(t *testing.T) {
	setupPerfMetricsControllerTestDB(t)
	gin.SetMode(gin.TestMode)
	nowBucket := time.Now().Add(-time.Hour).Unix()
	nowBucket -= nowBucket % 3600
	require.NoError(t, model.DB.Create(&model.QuotaData{
		UserID:    1,
		Username:  "tester",
		ModelName: "gpt-5.4",
		CreatedAt: nowBucket,
		TokenUsed: 3600,
		Count:     3,
		Quota:     100,
	}).Error)
	require.NoError(t, model.DB.Create(&model.QuotaData{
		UserID:    1,
		Username:  "tester",
		ModelName: "deepseek-v4-pro",
		CreatedAt: nowBucket,
		TokenUsed: 1200,
		Count:     1,
		Quota:     40,
	}).Error)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/api/rankings?period=week", nil)

	GetRankings(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var response struct {
		Success bool `json:"success"`
		Data    struct {
			Models []struct {
				Rank        int    `json:"rank"`
				ModelName   string `json:"model_name"`
				TotalTokens int64  `json:"total_tokens"`
			} `json:"models"`
		} `json:"data"`
	}
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &response))
	require.True(t, response.Success)
	require.Len(t, response.Data.Models, 2)
	require.Equal(t, 1, response.Data.Models[0].Rank)
	require.Equal(t, "gpt-5.4", response.Data.Models[0].ModelName)
	require.Equal(t, int64(3600), response.Data.Models[0].TotalTokens)
}
