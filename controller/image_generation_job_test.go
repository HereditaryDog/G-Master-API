package controller

import (
	"bytes"
	"errors"
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

	require.NoError(t, db.AutoMigrate(&model.Task{}, &model.User{}, &model.Token{}, &model.UserSubscription{}))
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

func TestCloneGinKeysDropsRequestBodyStorageForAsyncImageJobs(t *testing.T) {
	gin.SetMode(gin.TestMode)

	ctx, _ := gin.CreateTestContext(httptest.NewRecorder())
	storage, err := common.CreateBodyStorage([]byte(`{"model":"gpt-image-2","prompt":"original prompt"}`))
	require.NoError(t, err)
	ctx.Set(common.KeyBodyStorage, storage)
	ctx.Set(common.KeyRequestBody, []byte(`{"prompt":"stale cached prompt"}`))
	ctx.Set("channel_id", 12)

	keys := cloneGinKeys(ctx)

	_, hasBodyStorage := keys[common.KeyBodyStorage]
	_, hasRequestBody := keys[common.KeyRequestBody]
	assert.False(t, hasBodyStorage)
	assert.False(t, hasRequestBody)
	assert.Equal(t, 12, keys["channel_id"])
}

func TestRunAsyncImageGenerationJobRetriesTimeoutAndPreservesPrompt(t *testing.T) {
	setupImageGenerationJobTestDB(t)
	gin.SetMode(gin.TestMode)

	originalRetryTimes := common.RetryTimes
	common.RetryTimes = 0
	t.Cleanup(func() {
		common.RetryTimes = originalRetryTimes
	})

	task := &model.Task{
		TaskID:     "task_image_retry",
		Platform:   constant.TaskPlatformOpenAIImage,
		UserId:     7,
		ChannelId:  12,
		Status:     model.TaskStatusQueued,
		Progress:   "0%",
		SubmitTime: time.Now().Unix(),
		Properties: model.Properties{
			OriginModelName: "gpt-image-2",
		},
	}
	require.NoError(t, model.DB.Create(task).Error)

	originalRelay := imageGenerationJobRelay
	t.Cleanup(func() {
		imageGenerationJobRelay = originalRelay
	})

	const prompt = "A complex, multi-scene architectural image prompt with exact lighting notes; do not rewrite this."
	attempts := 0
	var prompts []string
	imageGenerationJobRelay = func(ctx *gin.Context, info *relaycommon.RelayInfo) *types.NewAPIError {
		attempts++

		storage, err := common.GetBodyStorage(ctx)
		require.NoError(t, err)
		requestBytes, err := storage.Bytes()
		require.NoError(t, err)

		var imageRequest dto.ImageRequest
		require.NoError(t, common.Unmarshal(requestBytes, &imageRequest))
		prompts = append(prompts, imageRequest.Prompt)

		if attempts == 1 {
			ctx.JSON(http.StatusGatewayTimeout, gin.H{"error": gin.H{"message": "stale timeout response"}})
			return types.WithOpenAIError(types.OpenAIError{
				Message:        "gpt-image-2 image generation timed out upstream",
				Type:           string(types.ErrorTypeImageTimeout),
				Code:           types.ErrorCodeUpstreamTimeout,
				UpstreamStatus: 524,
			}, 524)
		}

		ctx.JSON(http.StatusOK, dto.ImageResponse{
			Created: time.Now().Unix(),
			Data: []dto.ImageData{
				{Url: "https://example.com/generated-after-retry.png"},
			},
		})
		return nil
	}

	requestBody, err := common.Marshal(dto.ImageRequest{
		Model:  "gpt-image-2",
		Prompt: prompt,
		Size:   "1024x1536",
	})
	require.NoError(t, err)

	runAsyncImageGenerationJob(asyncImageJobContext{
		taskID: task.TaskID,
		relayInfo: &relaycommon.RelayInfo{
			UserId:          7,
			TokenGroup:      "default",
			UsingGroup:      "default",
			OriginModelName: "gpt-image-2",
			PriceData: types.PriceData{
				OtherRatios: map[string]float64{},
			},
		},
		requestBody: requestBody,
		headers: http.Header{
			"Content-Type": []string{"application/json"},
		},
		keys: map[string]any{
			string(constant.ContextKeyUserId):               7,
			string(constant.ContextKeyTokenGroup):           "default",
			string(constant.ContextKeyUsingGroup):           "default",
			string(constant.ContextKeyOriginalModel):        "gpt-image-2",
			string(constant.ContextKeyChannelId):            12,
			string(constant.ContextKeyChannelName):          "image-primary",
			string(constant.ContextKeyChannelType):          constant.ChannelTypeOpenAI,
			string(constant.ContextKeyChannelAutoBan):       false,
			string(constant.ContextKeyChannelBaseUrl):       "https://api.openai.example",
			string(constant.ContextKeyChannelKey):           "sk-test",
			string(constant.ContextKeyChannelCreateTime):    int64(1),
			string(constant.ContextKeyChannelIsMultiKey):    false,
			string(constant.ContextKeyChannelMultiKeyIndex): 0,
		},
	})

	reloaded, exists, err := model.GetByOnlyTaskId(task.TaskID)
	require.NoError(t, err)
	require.True(t, exists)
	assert.EqualValues(t, model.TaskStatusSuccess, reloaded.Status)
	assert.Equal(t, 2, attempts)
	assert.Equal(t, []string{prompt, prompt}, prompts)

	var response dto.ImageResponse
	require.NoError(t, reloaded.GetData(&response))
	require.Len(t, response.Data, 1)
	assert.Equal(t, "https://example.com/generated-after-retry.png", response.Data[0].Url)
	assert.Empty(t, reloaded.FailReason)
}

func TestRelayImageGenerationAsyncQueuesExactPrompt(t *testing.T) {
	setupImageGenerationJobTestDB(t)
	gin.SetMode(gin.TestMode)

	originalEnqueue := enqueueAsyncImageGenerationJob
	t.Cleanup(func() {
		enqueueAsyncImageGenerationJob = originalEnqueue
	})

	var enqueued asyncImageJobContext
	enqueueAsyncImageGenerationJob = func(job asyncImageJobContext) {
		enqueued = job
	}

	const prompt = "  Complex cinematic prompt with exact spacing, punctuation; do not rewrite.  "
	ctx, recorder := newAsyncImageGenerationRequestContext(t, prompt)

	RelayImageGenerationAsync(ctx)

	require.Equal(t, http.StatusAccepted, recorder.Code)
	require.NotEmpty(t, enqueued.taskID)

	var request dto.ImageRequest
	require.NoError(t, common.Unmarshal(enqueued.requestBody, &request))
	assert.Equal(t, prompt, request.Prompt)
	assert.Equal(t, "gpt-image-2", request.Model)
	assert.Equal(t, "/v1/images/generations", enqueued.relayInfo.RequestURLPath)

	_, hasBodyStorage := enqueued.keys[common.KeyBodyStorage]
	_, hasRequestBody := enqueued.keys[common.KeyRequestBody]
	assert.False(t, hasBodyStorage)
	assert.False(t, hasRequestBody)

	task, exists, err := model.GetByOnlyTaskId(enqueued.taskID)
	require.NoError(t, err)
	require.True(t, exists)
	assert.EqualValues(t, model.TaskStatusQueued, task.Status)
	assert.Equal(t, prompt, task.Properties.Input)
}

func TestRelayImageGenerationAsyncRecoversQueuePanic(t *testing.T) {
	setupImageGenerationJobTestDB(t)
	gin.SetMode(gin.TestMode)

	originalEnqueue := enqueueAsyncImageGenerationJob
	t.Cleanup(func() {
		enqueueAsyncImageGenerationJob = originalEnqueue
	})

	enqueueAsyncImageGenerationJob = func(job asyncImageJobContext) {
		panic("simulated async queue panic")
	}

	ctx, recorder := newAsyncImageGenerationRequestContext(t, "prompt that should never be rewritten")

	require.NotPanics(t, func() {
		RelayImageGenerationAsync(ctx)
	})
	require.Equal(t, http.StatusInternalServerError, recorder.Code)

	var body map[string]any
	require.NoError(t, common.Unmarshal(recorder.Body.Bytes(), &body))
	errorBody, ok := body["error"].(map[string]any)
	require.True(t, ok)
	assert.Equal(t, "async_image_generation_panic", errorBody["code"])
	assert.Contains(t, errorBody["message"], "original prompt was not rewritten")
}

func TestAsyncImageGenerationRetrySkipsNonGatewayFailures(t *testing.T) {
	assert.False(t, shouldRetryAsyncImageGenerationJob(nil, types.NewOpenAIError(errors.New("bad request"), types.ErrorCodeBadResponseStatusCode, http.StatusBadRequest), 1))
}

func newAsyncImageGenerationRequestContext(t *testing.T, prompt string) (*gin.Context, *httptest.ResponseRecorder) {
	t.Helper()

	require.NoError(t, model.DB.Create(&model.User{
		Id:       7,
		Username: "async-image-user",
		Password: "password123",
		Quota:    1_000_000_000,
		Group:    "default",
	}).Error)
	require.NoError(t, model.DB.Create(&model.Token{
		Id:          34,
		UserId:      7,
		Key:         "sk-test",
		Status:      common.TokenStatusEnabled,
		RemainQuota: 1_000_000_000,
		Group:       "default",
	}).Error)

	requestBody, err := common.Marshal(dto.ImageRequest{
		Model:  "gpt-image-2",
		Prompt: prompt,
		Size:   "1024x1024",
	})
	require.NoError(t, err)

	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/pg/v1/images/generations/async", bytes.NewReader(requestBody))
	ctx.Request.Header.Set("Content-Type", "application/json")
	ctx.Set(common.RequestIdKey, "req_async_image_test")
	common.SetContextKey(ctx, constant.ContextKeyRequestStartTime, time.Now())
	common.SetContextKey(ctx, constant.ContextKeyUserId, 7)
	common.SetContextKey(ctx, constant.ContextKeyUserGroup, "default")
	common.SetContextKey(ctx, constant.ContextKeyUsingGroup, "default")
	common.SetContextKey(ctx, constant.ContextKeyTokenGroup, "default")
	common.SetContextKey(ctx, constant.ContextKeyTokenId, 34)
	common.SetContextKey(ctx, constant.ContextKeyTokenKey, "sk-test")
	common.SetContextKey(ctx, constant.ContextKeyOriginalModel, "gpt-image-2")
	common.SetContextKey(ctx, constant.ContextKeyUserSetting, dto.UserSetting{AcceptUnsetRatioModel: true})
	common.SetContextKey(ctx, constant.ContextKeyChannelId, 12)
	common.SetContextKey(ctx, constant.ContextKeyChannelName, "image-primary")
	common.SetContextKey(ctx, constant.ContextKeyChannelType, constant.ChannelTypeOpenAI)
	common.SetContextKey(ctx, constant.ContextKeyChannelAutoBan, false)
	common.SetContextKey(ctx, constant.ContextKeyChannelBaseUrl, "https://api.openai.example")
	common.SetContextKey(ctx, constant.ContextKeyChannelKey, "sk-test")
	common.SetContextKey(ctx, constant.ContextKeyChannelCreateTime, int64(1))
	common.SetContextKey(ctx, constant.ContextKeyChannelIsMultiKey, false)
	common.SetContextKey(ctx, constant.ContextKeyChannelMultiKeyIndex, 0)
	return ctx, recorder
}
