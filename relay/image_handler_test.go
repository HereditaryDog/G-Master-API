package relay

import (
	"net/http"
	"testing"

	"github.com/stretchr/testify/require"
	relaycommon "github.com/yangjunyu/G-Master-API/relay/common"
	"github.com/yangjunyu/G-Master-API/types"
)

func TestNewImageChannelForbiddenError(t *testing.T) {
	t.Parallel()

	err := newImageChannelForbiddenError(&relaycommon.RelayInfo{
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
	require.Equal(t, "gpt-image-2", openAIError.Model)
}
