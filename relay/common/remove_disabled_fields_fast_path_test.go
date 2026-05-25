package common

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/dto"
)

func TestRemoveDisabledFieldsNoControlledFieldsKeepsOriginalBytes(t *testing.T) {
	input := []byte(`{"model":"gpt-5.1","temperature":0,"stream":false}`)

	out, err := RemoveDisabledFields(input, dto.ChannelOtherSettings{}, false)
	require.NoError(t, err)
	require.Equal(t, input, out)
}

func TestHasRemovableDisabledFieldHonorsChannelSettings(t *testing.T) {
	input := []byte(`{"model":"gpt-5.1","stream_options":{"include_obfuscation":false},"store":false}`)

	require.True(t, hasRemovableDisabledField(input, dto.ChannelOtherSettings{}))
	require.True(t, hasRemovableDisabledField(input, dto.ChannelOtherSettings{DisableStore: true, AllowIncludeObfuscation: true}))
	require.False(t, hasRemovableDisabledField(input, dto.ChannelOtherSettings{AllowIncludeObfuscation: true}))
}
