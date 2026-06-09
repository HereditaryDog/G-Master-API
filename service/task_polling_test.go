package service

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/constant"
)

func TestPlatformHandledOutsideTaskPolling(t *testing.T) {
	require.True(t, platformHandledOutsideTaskPolling(constant.TaskPlatformOpenAIImage))
	require.False(t, platformHandledOutsideTaskPolling(constant.TaskPlatformSuno))
	require.False(t, platformHandledOutsideTaskPolling(constant.TaskPlatform("302")))
}
