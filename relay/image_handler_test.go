package relay

import (
	"net/http"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	relaycommon "github.com/yangjunyu/G-Master-API/relay/common"
	"github.com/yangjunyu/G-Master-API/types"
)

func TestNewImageChannelForbiddenError(t *testing.T) {
	t.Parallel()

	c := &gin.Context{}
	c.Set("channel_name", "MKMKAPI")
	err := newImageChannelForbiddenError(c, &relaycommon.RelayInfo{
		OriginModelName: "gpt-image-2",
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId:         12,
			UpstreamModelName: "gpt-image-2",
		},
	}, http.StatusForbidden)

	require.Equal(t, http.StatusForbidden, err.StatusCode)
	openAIError := err.ToOpenAIError()
	require.Equal(t, string(types.ErrorTypeImageForbidden), openAIError.Type)
	require.Equal(t, types.ErrorCodeUpstreamForbidden, openAIError.Code)
	require.Equal(t, "gpt-image-2 image channel returned 403 from upstream", openAIError.Message)
	require.Equal(t, http.StatusForbidden, openAIError.UpstreamStatus)
	require.Equal(t, 12, openAIError.ChannelID)
	require.Equal(t, "MKMKAPI", openAIError.Provider)
	require.Equal(t, "gpt-image-2", openAIError.Model)
}

func TestNewImageGenerationTimeoutError(t *testing.T) {
	t.Parallel()

	c := &gin.Context{}
	c.Set("channel_name", "MKMKAPI")
	c.Set(common.RequestIdKey, "fallback-request-id")
	err := newImageGenerationTimeoutError(c, &relaycommon.RelayInfo{
		RequestId:       "request-id-1",
		OriginModelName: "gpt-image-2",
		StartTime:       time.Now().Add(-125 * time.Second),
		ChannelMeta: &relaycommon.ChannelMeta{
			ChannelId:         12,
			UpstreamModelName: "gpt-image-2",
		},
	}, httpStatusCloudflareTimeout)

	require.Equal(t, httpStatusCloudflareTimeout, err.StatusCode)
	openAIError := err.ToOpenAIError()
	require.Equal(t, string(types.ErrorTypeImageTimeout), openAIError.Type)
	require.Equal(t, types.ErrorCodeUpstreamTimeout, openAIError.Code)
	require.Equal(t, "gpt-image-2 image generation timed out upstream", openAIError.Message)
	require.Equal(t, httpStatusCloudflareTimeout, openAIError.UpstreamStatus)
	require.Equal(t, 12, openAIError.ChannelID)
	require.Equal(t, "MKMKAPI", openAIError.Provider)
	require.Equal(t, "gpt-image-2", openAIError.Model)
	require.Equal(t, "request-id-1", openAIError.RequestID)
	require.GreaterOrEqual(t, openAIError.ElapsedMS, int64(125000))
}
