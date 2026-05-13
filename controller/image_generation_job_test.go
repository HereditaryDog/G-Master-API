package controller

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/constant"
	"github.com/yangjunyu/G-Master-API/dto"
	"github.com/yangjunyu/G-Master-API/model"
	relaycommon "github.com/yangjunyu/G-Master-API/relay/common"
	"github.com/yangjunyu/G-Master-API/types"
	"gorm.io/gorm"
)

func setupImageGenerationJobTestDB(t *testing.T) {
	t.Helper()

	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)
	model.DB = db
	model.LOG_DB = db
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false

	require.NoError(t, db.AutoMigrate(&model.Task{}))
	t.Cleanup(func() {
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})
}

func TestRelayImageJobFetchReturnsOpenAIImageResult(t *testing.T) {
	setupImageGenerationJobTestDB(t)
	gin.SetMode(gin.TestMode)

	task := &model.Task{
		TaskID:     "task_image_success",
		Platform:   constant.TaskPlatformOpenAIImage,
		UserId:     7,
		ChannelId:  12,
		Status:     model.TaskStatusSuccess,
		Progress:   "100%",
		SubmitTime: time.Now().Add(-2 * time.Minute).Unix(),
		StartTime:  time.Now().Add(-90 * time.Second).Unix(),
		FinishTime: time.Now().Unix(),
		Properties: model.Properties{
			OriginModelName:   "gpt-image-2",
			UpstreamModelName: "gpt-image-2",
		},
	}
	task.SetData(dto.ImageResponse{
		Created: time.Now().Unix(),
		Data: []dto.ImageData{
			{Url: "https://example.com/image.png"},
		},
	})
	require.NoError(t, model.DB.Create(task).Error)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/images/jobs/task_image_success", nil)
	ctx.Params = gin.Params{{Key: "task_id", Value: "task_image_success"}}
	ctx.Set("id", 7)

	RelayImageJobFetch(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var body map[string]any
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &body))
	assert.Equal(t, "task_image_success", body["id"])
	assert.Equal(t, "task_image_success", body["job_id"])
	assert.Equal(t, "image.generation.job", body["object"])
	assert.Equal(t, "succeeded", body["status"])
	assert.Equal(t, "gpt-image-2", body["model"])

	result, ok := body["result"].(map[string]any)
	require.True(t, ok)
	data, ok := result["data"].([]any)
	require.True(t, ok)
	require.Len(t, data, 1)
	first, ok := data[0].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "https://example.com/image.png", first["url"])
}

func TestRelayImageJobFetchDoesNotExposeOtherUsersTask(t *testing.T) {
	setupImageGenerationJobTestDB(t)
	gin.SetMode(gin.TestMode)

	task := &model.Task{
		TaskID:   "task_image_other_user",
		Platform: constant.TaskPlatformOpenAIImage,
		UserId:   8,
		Status:   model.TaskStatusQueued,
	}
	require.NoError(t, model.DB.Create(task).Error)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/images/jobs/task_image_other_user", nil)
	ctx.Params = gin.Params{{Key: "task_id", Value: "task_image_other_user"}}
	ctx.Set("id", 7)

	RelayImageJobFetch(ctx)

	require.Equal(t, http.StatusNotFound, recorder.Code)
	var body map[string]any
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &body))
	errorBody, ok := body["error"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "task_not_found", errorBody["code"])
}

func TestRelayImageJobFetchReturnsStoredMachineReadableFailure(t *testing.T) {
	setupImageGenerationJobTestDB(t)
	gin.SetMode(gin.TestMode)

	task := &model.Task{
		TaskID:     "task_image_failed",
		Platform:   constant.TaskPlatformOpenAIImage,
		UserId:     7,
		ChannelId:  12,
		Status:     model.TaskStatusFailure,
		Progress:   "100%",
		SubmitTime: time.Now().Add(-2 * time.Minute).Unix(),
		FinishTime: time.Now().Unix(),
		Properties: model.Properties{
			OriginModelName: "gpt-image-2",
		},
		FailReason: "status_code=524, gpt-image-2 image generation timed out upstream",
	}
	errorBytes, err := common.Marshal(types.OpenAIError{
		Message:        "gpt-image-2 image generation timed out upstream",
		Type:           string(types.ErrorTypeImageTimeout),
		Code:           types.ErrorCodeUpstreamTimeout,
		UpstreamStatus: 524,
		ChannelID:      12,
		Model:          "gpt-image-2",
		RequestID:      "req-timeout",
	})
	require.NoError(t, err)
	task.Data = errorBytes
	require.NoError(t, model.DB.Create(task).Error)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodGet, "/v1/images/jobs/task_image_failed", nil)
	ctx.Params = gin.Params{{Key: "task_id", Value: "task_image_failed"}}
	ctx.Set("id", 7)

	RelayImageJobFetch(ctx)

	require.Equal(t, http.StatusOK, recorder.Code)
	var body map[string]any
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &body))
	assert.Equal(t, "failed", body["status"])
	errorBody, ok := body["error"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, string(types.ErrorTypeImageTimeout), errorBody["type"])
	assert.Equal(t, string(types.ErrorCodeUpstreamTimeout), errorBody["code"])
	assert.Equal(t, float64(524), errorBody["upstream_status"])
	assert.Equal(t, "req-timeout", errorBody["request_id"])
}

func TestInitAsyncImageTaskCapturesBillingSnapshot(t *testing.T) {
	info := &relaycommon.RelayInfo{
		UserId:                7,
		UsingGroup:            "vip",
		TokenId:               34,
		FinalPreConsumedQuota: 5600,
		BillingSource:         "subscription",
		SubscriptionId:        99,
		OriginModelName:       "gpt-image-2",
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId:         12,
			UpstreamModelName: "gpt-image-2",
		},
		PriceData: types.PriceData{
			ModelPrice: 0.08,
			ModelRatio: 2,
			GroupRatioInfo: types.GroupRatioInfo{
				GroupRatio: 1.5,
			},
			OtherRatios: map[string]float64{"n": 2},
		},
	}

	task := initAsyncImageTask(info, &dto.ImageRequest{
		Model:  "gpt-image-2",
		Prompt: "draw a clean architecture diagram",
	})

	assert.EqualValues(t, constant.TaskPlatformOpenAIImage, task.Platform)
	assert.Equal(t, constant.TaskActionImageGeneration, task.Action)
	assert.EqualValues(t, model.TaskStatusQueued, task.Status)
	assert.Equal(t, "vip", task.Group)
	assert.Equal(t, 5600, task.Quota)
	assert.Equal(t, "draw a clean architecture diagram", task.Properties.Input)
	assert.Equal(t, "gpt-image-2", task.Properties.OriginModelName)
	assert.Equal(t, "gpt-image-2", task.Properties.UpstreamModelName)
	require.NotNil(t, task.PrivateData.BillingContext)
	assert.Equal(t, "subscription", task.PrivateData.BillingSource)
	assert.Equal(t, 99, task.PrivateData.SubscriptionId)
	assert.Equal(t, 34, task.PrivateData.TokenId)
	assert.Equal(t, "gpt-image-2", task.PrivateData.BillingContext.OriginModelName)
	assert.Equal(t, 1.5, task.PrivateData.BillingContext.GroupRatio)
	assert.Equal(t, 2.0, task.PrivateData.BillingContext.OtherRatios["n"])

	var storedRequest dto.ImageRequest
	require.NoError(t, task.GetData(&storedRequest))
	assert.Equal(t, "gpt-image-2", storedRequest.Model)
	assert.Equal(t, "draw a clean architecture diagram", storedRequest.Prompt)
}
