package relay

import (
	"bytes"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/constant"
	"github.com/yangjunyu/G-Master-API/dto"
	"github.com/yangjunyu/G-Master-API/logger"
	relaycommon "github.com/yangjunyu/G-Master-API/relay/common"
	"github.com/yangjunyu/G-Master-API/relay/helper"
	"github.com/yangjunyu/G-Master-API/service"
	"github.com/yangjunyu/G-Master-API/setting/model_setting"
	"github.com/yangjunyu/G-Master-API/types"

	"github.com/gin-gonic/gin"
)

const httpStatusCloudflareTimeout = 524

func ImageHelper(c *gin.Context, info *relaycommon.RelayInfo) (newAPIError *types.NewAPIError) {
	info.InitChannelMeta(c)

	imageReq, ok := info.Request.(*dto.ImageRequest)
	if !ok {
		return types.NewErrorWithStatusCode(fmt.Errorf("invalid request type, expected dto.ImageRequest, got %T", info.Request), types.ErrorCodeInvalidRequest, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
	}

	request, err := common.DeepCopy(imageReq)
	if err != nil {
		return types.NewError(fmt.Errorf("failed to copy request to ImageRequest: %w", err), types.ErrorCodeInvalidRequest, types.ErrOptionWithSkipRetry())
	}

	err = helper.ModelMappedHelper(c, info, request)
	if err != nil {
		return types.NewError(err, types.ErrorCodeChannelModelMappedError, types.ErrOptionWithSkipRetry())
	}

	adaptor := GetAdaptor(info.ApiType)
	if adaptor == nil {
		return types.NewError(fmt.Errorf("invalid api type: %d", info.ApiType), types.ErrorCodeInvalidApiType, types.ErrOptionWithSkipRetry())
	}
	adaptor.Init(info)

	var requestBody io.Reader

	if model_setting.GetGlobalSettings().PassThroughRequestEnabled || info.ChannelSetting.PassThroughBodyEnabled {
		storage, err := common.GetBodyStorage(c)
		if err != nil {
			return types.NewErrorWithStatusCode(err, types.ErrorCodeReadRequestBodyFailed, http.StatusBadRequest, types.ErrOptionWithSkipRetry())
		}
		requestBody = common.ReaderOnly(storage)
	} else {
		convertedRequest, err := adaptor.ConvertImageRequest(c, info, *request)
		if err != nil {
			return types.NewError(err, types.ErrorCodeConvertRequestFailed)
		}
		relaycommon.AppendRequestConversionFromRequest(info, convertedRequest)

		switch convertedRequest.(type) {
		case *bytes.Buffer:
			requestBody = convertedRequest.(io.Reader)
		default:
			jsonData, err := common.Marshal(convertedRequest)
			if err != nil {
				return types.NewError(err, types.ErrorCodeConvertRequestFailed, types.ErrOptionWithSkipRetry())
			}

			// apply param override
			if len(info.ParamOverride) > 0 {
				jsonData, err = relaycommon.ApplyParamOverrideWithRelayInfo(jsonData, info)
				if err != nil {
					return newAPIErrorFromParamOverride(err)
				}
			}

			if common.DebugEnabled {
				logger.LogDebug(c, "image request body: %s", jsonData)
			}
			requestBody = bytes.NewBuffer(jsonData)
		}
	}

	statusCodeMappingStr := c.GetString("status_code_mapping")

	resp, err := adaptor.DoRequest(c, info, requestBody)
	if err != nil {
		return types.NewOpenAIError(err, types.ErrorCodeDoRequestFailed, http.StatusInternalServerError)
	}
	var httpResp *http.Response
	if resp != nil {
		httpResp = resp.(*http.Response)
		info.IsStream = info.IsStream || strings.HasPrefix(httpResp.Header.Get("Content-Type"), "text/event-stream")
		if httpResp.StatusCode != http.StatusOK {
			if httpResp.StatusCode == http.StatusCreated && info.ApiType == constant.APITypeReplicate {
				// replicate channel returns 201 Created when using Prefer: wait, treat it as success.
				httpResp.StatusCode = http.StatusOK
			} else {
				newAPIError = service.RelayErrorHandler(c.Request.Context(), httpResp, false)
				if httpResp.StatusCode == http.StatusForbidden {
					newAPIError = newImageChannelForbiddenError(c, info, httpResp.StatusCode)
				}
				if httpResp.StatusCode == httpStatusCloudflareTimeout {
					newAPIError = newImageGenerationTimeoutError(c, info, httpResp.StatusCode)
				}
				// reset status code 重置状态码
				service.ResetStatusCode(newAPIError, statusCodeMappingStr)
				return newAPIError
			}
		}
	}

	usage, newAPIError := adaptor.DoResponse(c, httpResp, info)
	if newAPIError != nil {
		// reset status code 重置状态码
		service.ResetStatusCode(newAPIError, statusCodeMappingStr)
		return newAPIError
	}

	imageN := uint(1)
	if request.N != nil {
		imageN = *request.N
	}

	// n is handled via OtherRatio so it is applied exactly once in quota
	// calculation (both price-based and ratio-based paths).
	// Adaptors may have already set a more accurate count from the
	// upstream response; only set the default when they haven't.
	if info.PriceData.UsePrice { // only price model use N ratio
		if _, hasN := info.PriceData.OtherRatios["n"]; !hasN {
			info.PriceData.AddOtherRatio("n", float64(imageN))
		}
	}

	if usage.(*dto.Usage).TotalTokens == 0 {
		usage.(*dto.Usage).TotalTokens = 1
	}
	if usage.(*dto.Usage).PromptTokens == 0 {
		usage.(*dto.Usage).PromptTokens = 1
	}

	quality := "standard"
	if request.Quality == "hd" {
		quality = "hd"
	}

	var logContent []string

	if len(request.Size) > 0 {
		logContent = append(logContent, fmt.Sprintf("大小 %s", request.Size))
	}
	if len(quality) > 0 {
		logContent = append(logContent, fmt.Sprintf("品质 %s", quality))
	}
	if imageN > 0 {
		logContent = append(logContent, fmt.Sprintf("生成数量 %d", imageN))
	}

	service.PostTextConsumeQuota(c, info, usage.(*dto.Usage), logContent)
	return nil
}

func newImageChannelForbiddenError(c *gin.Context, info *relaycommon.RelayInfo, upstreamStatus int) *types.NewAPIError {
	channelID := 0
	provider := ""
	modelName := ""
	if info != nil {
		modelName = info.UpstreamModelName
		if modelName == "" {
			modelName = info.OriginModelName
		}
		if info.ChannelMeta != nil {
			channelID = info.ChannelId
		}
	}
	if c != nil {
		provider = c.GetString("channel_name")
	}
	message := fmt.Sprintf("image channel returned %d from upstream", upstreamStatus)
	if modelName != "" {
		message = fmt.Sprintf("%s image channel returned %d from upstream", modelName, upstreamStatus)
	}
	return types.WithOpenAIError(types.OpenAIError{
		Message:        message,
		Type:           string(types.ErrorTypeImageForbidden),
		Code:           types.ErrorCodeUpstreamForbidden,
		UpstreamStatus: upstreamStatus,
		ChannelID:      channelID,
		Provider:       provider,
		Model:          modelName,
	}, upstreamStatus)
}

func newImageGenerationTimeoutError(c *gin.Context, info *relaycommon.RelayInfo, upstreamStatus int) *types.NewAPIError {
	channelID := 0
	provider := ""
	modelName := ""
	requestID := ""
	var elapsedMS int64
	if info != nil {
		modelName = info.UpstreamModelName
		if modelName == "" {
			modelName = info.OriginModelName
		}
		requestID = info.RequestId
		if !info.StartTime.IsZero() {
			elapsedMS = time.Since(info.StartTime).Milliseconds()
		}
		if info.ChannelMeta != nil {
			channelID = info.ChannelId
		}
	}
	if c != nil {
		provider = c.GetString("channel_name")
		if requestID == "" {
			requestID = c.GetString(common.RequestIdKey)
		}
	}
	message := "Image generation timed out upstream"
	if modelName != "" {
		message = fmt.Sprintf("%s image generation timed out upstream", modelName)
	}
	return types.WithOpenAIError(types.OpenAIError{
		Message:        message,
		Type:           string(types.ErrorTypeImageTimeout),
		Code:           types.ErrorCodeUpstreamTimeout,
		UpstreamStatus: upstreamStatus,
		ChannelID:      channelID,
		Provider:       provider,
		Model:          modelName,
		ElapsedMS:      elapsedMS,
		RequestID:      requestID,
	}, upstreamStatus)
}
