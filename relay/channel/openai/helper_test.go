package openai

import (
	"strings"
	"testing"

	"github.com/stretchr/testify/require"
	relayconstant "github.com/yangjunyu/G-Master-API/relay/constant"
)

func TestProcessTokenDataChatCompletions(t *testing.T) {
	var builder strings.Builder
	toolCount := 0

	err := processTokenData(
		relayconstant.RelayModeChatCompletions,
		`{"choices":[{"delta":{"content":"hello","reasoning_content":" think","tool_calls":[{"function":{"name":"lookup","arguments":"{}"}}]}}]}`,
		&builder,
		&toolCount,
	)
	require.NoError(t, err)
	require.Equal(t, "hello thinklookup{}", builder.String())
	require.Equal(t, 1, toolCount)
}

func TestProcessTokenDataCompletions(t *testing.T) {
	var builder strings.Builder
	toolCount := 0

	err := processTokenData(
		relayconstant.RelayModeCompletions,
		`{"choices":[{"text":"hello"}]}`,
		&builder,
		&toolCount,
	)
	require.NoError(t, err)
	require.Equal(t, "hello", builder.String())
	require.Equal(t, 0, toolCount)
}
