package controller

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"runtime/debug"
	"strings"
	"time"

	"github.com/bytedance/gopkg/util/gopool"
	"github.com/gin-gonic/gin"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/constant"
	"github.com/yangjunyu/G-Master-API/dto"
	"github.com/yangjunyu/G-Master-API/logger"
	"github.com/yangjunyu/G-Master-API/model"
	"github.com/yangjunyu/G-Master-API/relay"
	relaycommon "github.com/yangjunyu/G-Master-API/relay/common"
	relayconstant "github.com/yangjunyu/G-Master-API/relay/constant"
	"github.com/yangjunyu/G-Master-API/relay/helper"
	"github.com/yangjunyu/G-Master-API/service"
	"github.com/yangjunyu/G-Master-API/setting"
	"github.com/yangjunyu/G-Master-API/setting/operation_setting"
	"github.com/yangjunyu/G-Master-API/types"
)

const imageGenerationJobObject = "image.generation.job"
const httpStatusCloudflareTimeout = 524
const minAsyncImageGenerationRetryTimes = 1

type imageGenerationJobResponse struct {
	ID         string             `json:"id"`
	JobID      string             `json:"job_id"`
	Object     string             `json:"object"`
	Status     string             `json:"status"`
	Created    int64              `json:"created,omitempty"`
	StartedAt  int64              `json:"started_at,omitempty"`
	FinishedAt int64              `json:"finished_at,omitempty"`
	Model      string             `json:"model,omitempty"`
	PollURL    string             `json:"poll_url,omitempty"`
	Result     *json.RawMessage   `json:"result,omitempty"`
	Error      *types.OpenAIError `json:"error,omitempty"`
}

type asyncImageJobContext struct {
	taskID      string
	relayInfo   *relaycommon.RelayInfo
	requestBody []byte
	headers     http.Header
	keys        map[string]any
}

var enqueueAsyncImageGenerationJob = func(job asyncImageJobContext) {
	gopool.Go(func() {
		runAsyncImageGenerationJob(job)
	})
}

var imageGenerationJobRelay = relay.ImageHelper

func RelayImageGenerationAsync(c *gin.Context) {
	requestId := c.GetString(common.RequestIdKey)
	var newAPIError *types.NewAPIError
	var relayInfo *relaycommon.RelayInfo

	defer func() {
		if recovered := recover(); recovered != nil {
			logger.LogError(c, fmt.Sprintf("async image generation panic: %v\n%s", recovered, string(debug.Stack())))
			if relayInfo != nil && relayInfo.Billing != nil {
				relayInfo.Billing.Refund(c)
			}
			if !c.Writer.Written() {
				message := common.MessageWithRequestId(
					"Async image generation gateway failed before the job could be queued. The original prompt was not rewritten; retry after the gateway is healthy.",
					requestId,
				)
				c.JSON(http.StatusInternalServerError, gin.H{
					"error": types.OpenAIError{
						Message:   message,
						Type:      "server_error",
						Code:      "async_image_generation_panic",
						RequestID: requestId,
					},
				})
			}
			return
		}
		if newAPIError == nil {
			return
		}
		logger.LogError(c, fmt.Sprintf("async image generation error: %s", newAPIError.Error()))
		newAPIError.SetMessage(common.MessageWithRequestId(newAPIError.Error(), requestId))
		if relayInfo != nil && relayInfo.Billing != nil {
			relayInfo.Billing.Refund(c)
		}
		c.JSON(newAPIError.StatusCode, gin.H{
			"error": newAPIError.ToOpenAIError(),
		})
	}()

	request, err := helper.GetAndValidateRequest(c, types.RelayFormatOpenAIImage)
	if err != nil {
		if common.IsRequestBodyTooLargeError(err) || errors.Is(err, common.ErrRequestBodyTooLarge) {
			newAPIError = types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusRequestEntityTooLarge, types.ErrOptionWithSkipRetry())
		} else {
			newAPIError = types.NewError(err, types.ErrorCodeInvalidRequest, types.ErrOptionWithStatusCode(http.StatusBadRequest))
		}
		return
	}

	imageRequest, ok := request.(*dto.ImageRequest)
	if !ok {
		newAPIError = types.NewErrorWithStatusCode(errors.New("request is not an image request"), types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
		return
	}

	relayInfo, err = relaycommon.GenRelayInfo(c, types.RelayFormatOpenAIImage, request, nil)
	if err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeGenRelayInfoFailed)
		return
	}
	relayInfo.RelayMode = relayconstant.RelayModeImagesGenerations

	if newAPIError = prepareAsyncImageRelay(c, relayInfo, request); newAPIError != nil {
		return
	}

	bodyStorage, err := common.GetBodyStorage(c)
	if err != nil {
		newAPIError = types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
		return
	}
	requestBody, err := bodyStorage.Bytes()
	if err != nil {
		newAPIError = types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
		return
	}
	if len(requestBody) == 0 {
		requestBody, _ = common.Marshal(imageRequest)
	}

	task := initAsyncImageTask(relayInfo, imageRequest)
	if err := task.Insert(); err != nil {
		newAPIError = types.NewError(err, types.ErrorCodeUpdateDataError)
		return
	}

	enqueueAsyncImageGenerationJob(asyncImageJobContext{
		taskID:      task.TaskID,
		relayInfo:   relayInfo,
		requestBody: append([]byte(nil), requestBody...),
		headers:     cloneHeaders(c.Request.Header),
		keys:        cloneGinKeys(c),
	})

	c.JSON(http.StatusAccepted, imageTaskToJobResponse(task))
}

func RelayImageJobFetch(c *gin.Context) {
	taskID := strings.TrimSpace(c.Param("task_id"))
	if taskID == "" {
		taskID = strings.TrimSpace(c.Param("id"))
	}
	if taskID == "" {
		writeImageJobOpenAIError(c, http.StatusBadRequest, "invalid_request_error", "task_id is required", "invalid_request")
		return
	}

	task, exists, err := model.GetByTaskId(c.GetInt("id"), taskID)
	if err != nil {
		writeImageJobOpenAIError(c, http.StatusInternalServerError, "server_error", err.Error(), "query_data_error")
		return
	}
	if !exists || task.Platform != constant.TaskPlatformOpenAIImage {
		writeImageJobOpenAIError(c, http.StatusNotFound, "invalid_request_error", "image generation job not found", "task_not_found")
		return
	}

	c.JSON(http.StatusOK, imageTaskToJobResponse(task))
}

func prepareAsyncImageRelay(c *gin.Context, relayInfo *relaycommon.RelayInfo, request dto.Request) *types.NewAPIError {
	meta := request.GetTokenCountMeta()
	if setting.ShouldCheckPromptSensitive() && meta != nil {
		contains, words := service.CheckSensitiveText(meta.CombineText)
		if contains {
			logger.LogWarn(c, fmt.Sprintf("user sensitive words detected: %s", strings.Join(words, ", ")))
			return types.NewError(errors.New("sensitive words detected"), types.ErrorCodeSensitiveWordsDetected, types.ErrOptionWithStatusCode(http.StatusBadRequest))
		}
	}

	tokens, err := service.EstimateRequestToken(c, meta, relayInfo)
	if err != nil {
		return types.NewError(err, types.ErrorCodeCountTokenFailed)
	}
	relayInfo.SetEstimatePromptTokens(tokens)

	priceData, err := helper.ModelPriceHelper(c, relayInfo, tokens, meta)
	if err != nil {
		return types.NewError(err, types.ErrorCodeModelPriceError, types.ErrOptionWithStatusCode(http.StatusBadRequest))
	}
	if priceData.FreeModel {
		logger.LogInfo(c, fmt.Sprintf("模型 %s 免费，跳过异步图片预扣费", relayInfo.OriginModelName))
		return nil
	}

	relayInfo.ForcePreConsume = true
	return service.PreConsumeBilling(c, priceData.QuotaToPreConsume, relayInfo)
}

func initAsyncImageTask(relayInfo *relaycommon.RelayInfo, imageRequest *dto.ImageRequest) *model.Task {
	now := time.Now().Unix()
	task := model.InitTask(constant.TaskPlatformOpenAIImage, relayInfo)
	task.Status = model.TaskStatusQueued
	task.Action = constant.TaskActionImageGeneration
	task.Progress = "0%"
	task.SubmitTime = now
	task.CreatedAt = now
	task.UpdatedAt = now
	task.Quota = relayInfo.FinalPreConsumedQuota
	task.Properties.Input = imageRequest.Prompt
	task.Properties.OriginModelName = relayInfo.OriginModelName
	task.Properties.UpstreamModelName = relayInfo.OriginModelName
	if relayInfo.ChannelMeta != nil && relayInfo.ChannelMeta.UpstreamModelName != "" {
		task.Properties.UpstreamModelName = relayInfo.ChannelMeta.UpstreamModelName
	}
	task.PrivateData.BillingSource = relayInfo.BillingSource
	task.PrivateData.SubscriptionId = relayInfo.SubscriptionId
	task.PrivateData.TokenId = relayInfo.TokenId
	task.PrivateData.BillingContext = &model.TaskBillingContext{
		ModelPrice:      relayInfo.PriceData.ModelPrice,
		GroupRatio:      relayInfo.PriceData.GroupRatioInfo.GroupRatio,
		ModelRatio:      relayInfo.PriceData.ModelRatio,
		OtherRatios:     cloneFloat64Map(relayInfo.PriceData.OtherRatios),
		OriginModelName: relayInfo.OriginModelName,
	}
	task.SetData(imageRequest)
	return task
}

func runAsyncImageGenerationJob(job asyncImageJobContext) {
	ctxBg := context.Background()
	task, exists, err := model.GetByOnlyTaskId(job.taskID)
	if err != nil {
		logger.LogError(ctxBg, fmt.Sprintf("load async image job %s failed: %s", job.taskID, err.Error()))
		return
	}
	if !exists {
		logger.LogWarn(ctxBg, fmt.Sprintf("async image job %s not found", job.taskID))
		return
	}

	task.StartTime = time.Now().Unix()
	task.Status = model.TaskStatusInProgress
	task.Progress = "10%"
	won, err := task.UpdateWithStatus(model.TaskStatusQueued)
	if err != nil {
		logger.LogError(ctxBg, fmt.Sprintf("start async image job %s failed: %s", job.taskID, err.Error()))
		return
	}
	if !won {
		return
	}

	recorder, newAPIError := runAsyncImageGenerationJobAttempts(job)
	if newAPIError != nil {
		failAsyncImageTask(task, newAPIError.ToOpenAIError(), newAPIError.ErrorWithStatusCode())
		return
	}
	if recorder.Code >= http.StatusBadRequest {
		failAsyncImageTask(task, types.OpenAIError{
			Message: fmt.Sprintf("image generation job returned status %d", recorder.Code),
			Type:    "image_generation_failed",
			Code:    "bad_response_status_code",
		}, fmt.Sprintf("status_code=%d", recorder.Code))
		return
	}
	responseBody := bytes.TrimSpace(recorder.Body.Bytes())
	if len(responseBody) == 0 {
		failAsyncImageTask(task, types.OpenAIError{
			Message: "image generation job returned empty response",
			Type:    "image_generation_failed",
			Code:    "empty_response",
		}, "empty image generation response")
		return
	}

	finishAsyncImageTask(task, responseBody)
}

func runAsyncImageGenerationJobAttempts(job asyncImageJobContext) (*httptest.ResponseRecorder, *types.NewAPIError) {
	ctx, recorder := newAsyncImageGinContext(job)
	retryTimes := asyncImageGenerationRetryTimes()
	retryParam := &service.RetryParam{
		Ctx:        ctx,
		TokenGroup: job.relayInfo.TokenGroup,
		ModelName:  job.relayInfo.OriginModelName,
		Retry:      common.GetPointer(0),
	}
	job.relayInfo.RetryIndex = 0
	job.relayInfo.LastError = nil

	var newAPIError *types.NewAPIError
	for ; retryParam.GetRetry() <= retryTimes; retryParam.IncreaseRetry() {
		job.relayInfo.RetryIndex = retryParam.GetRetry()
		if retryParam.GetRetry() > 0 {
			resetAsyncImageRecorder(recorder)
		}

		channel, channelErr := getChannel(ctx, job.relayInfo, retryParam)
		if channelErr != nil {
			return recorder, channelErr
		}
		addUsedChannel(ctx, channel.Id)
		resetAsyncImageRequestBody(ctx, job.requestBody)

		newAPIError = imageGenerationJobRelay(ctx, job.relayInfo)
		if newAPIError == nil {
			job.relayInfo.LastError = nil
			return recorder, nil
		}

		newAPIError = service.NormalizeViolationFeeError(newAPIError)
		job.relayInfo.LastError = newAPIError
		processChannelError(ctx, *types.NewChannelError(
			channel.Id,
			channel.Type,
			channel.Name,
			channel.ChannelInfo.IsMultiKey,
			common.GetContextKeyString(ctx, constant.ContextKeyChannelKey),
			channel.GetAutoBan(),
		), newAPIError)

		if !shouldRetryAsyncImageGenerationJob(ctx, newAPIError, retryTimes-retryParam.GetRetry()) {
			break
		}
	}

	return recorder, newAPIError
}

func asyncImageGenerationRetryTimes() int {
	if common.RetryTimes < minAsyncImageGenerationRetryTimes {
		return minAsyncImageGenerationRetryTimes
	}
	return common.RetryTimes
}

func resetAsyncImageRequestBody(ctx *gin.Context, requestBody []byte) {
	common.CleanupBodyStorage(ctx)
	ctx.Set(common.KeyRequestBody, nil)
	ctx.Request.Body = io.NopCloser(bytes.NewReader(requestBody))
	ctx.Request.ContentLength = int64(len(requestBody))
}

func resetAsyncImageRecorder(recorder *httptest.ResponseRecorder) {
	recorder.Body.Reset()
	recorder.Code = http.StatusOK
	for key := range recorder.Header() {
		recorder.Header().Del(key)
	}
}

func shouldRetryAsyncImageGenerationJob(c *gin.Context, openaiErr *types.NewAPIError, retryTimes int) bool {
	if openaiErr == nil {
		return false
	}
	if c != nil && service.ShouldSkipRetryAfterChannelAffinityFailure(c) {
		return false
	}
	if retryTimes <= 0 {
		return false
	}
	if c != nil {
		if _, ok := c.Get("specific_channel_id"); ok {
			return false
		}
	}
	if types.IsSkipRetryError(openaiErr) {
		return false
	}
	if types.IsChannelError(openaiErr) {
		return true
	}

	code := openaiErr.StatusCode
	if code == http.StatusGatewayTimeout || code == httpStatusCloudflareTimeout {
		return true
	}
	if openaiErr.GetErrorCode() == types.ErrorCodeUpstreamTimeout {
		return true
	}
	if code >= 200 && code < 300 {
		return false
	}
	if code < 100 || code > 599 {
		return true
	}
	if operation_setting.IsAlwaysSkipRetryCode(openaiErr.GetErrorCode()) {
		return false
	}
	return operation_setting.ShouldRetryByStatusCode(code)
}

func newAsyncImageGinContext(job asyncImageJobContext) (*gin.Context, *httptest.ResponseRecorder) {
	recorder := httptest.NewRecorder()
	ctx, _ := gin.CreateTestContext(recorder)
	ctx.Request = httptest.NewRequest(http.MethodPost, "/v1/images/generations", bytes.NewReader(job.requestBody))
	ctx.Request.Header = cloneHeaders(job.headers)
	ctx.Keys = cloneKeyMap(job.keys)
	common.SetContextKey(ctx, constant.ContextKeyRequestStartTime, time.Now())
	return ctx, recorder
}

func finishAsyncImageTask(task *model.Task, responseBody []byte) {
	task.FinishTime = time.Now().Unix()
	task.UpdatedAt = task.FinishTime
	task.Status = model.TaskStatusSuccess
	task.Progress = "100%"
	task.Data = json.RawMessage(append([]byte(nil), responseBody...))
	if _, err := task.UpdateWithStatus(model.TaskStatusInProgress); err != nil {
		logger.LogError(context.Background(), fmt.Sprintf("finish async image job %s failed: %s", task.TaskID, err.Error()))
	}
}

func failAsyncImageTask(task *model.Task, openAIError types.OpenAIError, reason string) {
	if openAIError.Message == "" {
		openAIError.Message = reason
	}
	if openAIError.Type == "" {
		openAIError.Type = "image_generation_failed"
	}
	if openAIError.Code == nil {
		openAIError.Code = "image_generation_failed"
	}

	errorBytes, _ := common.Marshal(openAIError)
	task.FinishTime = time.Now().Unix()
	task.UpdatedAt = task.FinishTime
	task.Status = model.TaskStatusFailure
	task.Progress = "100%"
	task.FailReason = reason
	task.Data = json.RawMessage(errorBytes)
	won, err := task.UpdateWithStatus(model.TaskStatusInProgress)
	if err != nil {
		logger.LogError(context.Background(), fmt.Sprintf("fail async image job %s failed: %s", task.TaskID, err.Error()))
		return
	}
	if won {
		service.RefundTaskQuota(context.Background(), task, reason)
	}
}

func imageTaskToJobResponse(task *model.Task) imageGenerationJobResponse {
	resp := imageGenerationJobResponse{
		ID:         task.TaskID,
		JobID:      task.TaskID,
		Object:     imageGenerationJobObject,
		Status:     imageJobStatus(task.Status),
		Created:    task.SubmitTime,
		StartedAt:  task.StartTime,
		FinishedAt: task.FinishTime,
		Model:      task.Properties.OriginModelName,
		PollURL:    "/v1/images/jobs/" + task.TaskID,
	}
	if resp.Created == 0 {
		resp.Created = task.CreatedAt
	}

	switch task.Status {
	case model.TaskStatusSuccess:
		if len(task.Data) > 0 {
			raw := json.RawMessage(append([]byte(nil), task.Data...))
			resp.Result = &raw
		}
	case model.TaskStatusFailure:
		resp.Error = imageTaskError(task)
	}
	return resp
}

func imageJobStatus(status model.TaskStatus) string {
	switch status {
	case model.TaskStatusQueued, model.TaskStatusSubmitted, model.TaskStatusNotStart:
		return "queued"
	case model.TaskStatusInProgress:
		return "running"
	case model.TaskStatusSuccess:
		return "succeeded"
	case model.TaskStatusFailure:
		return "failed"
	default:
		return "unknown"
	}
}

func imageTaskError(task *model.Task) *types.OpenAIError {
	if len(task.Data) > 0 {
		var openAIError types.OpenAIError
		if err := common.Unmarshal(task.Data, &openAIError); err == nil && openAIError.Message != "" {
			return &openAIError
		}
	}
	message := task.FailReason
	if message == "" {
		message = "image generation job failed"
	}
	return &types.OpenAIError{
		Message: message,
		Type:    "image_generation_failed",
		Code:    "image_generation_failed",
	}
}

func writeImageJobOpenAIError(c *gin.Context, statusCode int, errorType string, message string, code string) {
	c.JSON(statusCode, gin.H{
		"error": types.OpenAIError{
			Message: message,
			Type:    errorType,
			Code:    code,
		},
	})
}

func cloneGinKeys(c *gin.Context) map[string]any {
	if c == nil || len(c.Keys) == 0 {
		return nil
	}
	return cloneKeyMap(c.Keys)
}

func cloneKeyMap(keys map[string]any) map[string]any {
	if len(keys) == 0 {
		return nil
	}
	out := make(map[string]any, len(keys))
	for key, value := range keys {
		if key == common.KeyBodyStorage || key == common.KeyRequestBody {
			continue
		}
		out[key] = value
	}
	return out
}

func cloneHeaders(headers http.Header) http.Header {
	if len(headers) == 0 {
		return http.Header{}
	}
	return headers.Clone()
}

func cloneFloat64Map(values map[string]float64) map[string]float64 {
	if len(values) == 0 {
		return nil
	}
	out := make(map[string]float64, len(values))
	for key, value := range values {
		out[key] = value
	}
	return out
}
