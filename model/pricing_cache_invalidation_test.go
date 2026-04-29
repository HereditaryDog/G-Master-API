package model

import (
	"testing"
	"time"

	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
)

func seedPricingCacheForTest() {
	pricingMap = []Pricing{{ModelName: "cached-model"}}
	vendorsList = []PricingVendor{{ID: 1, Name: "cached-vendor"}}
	lastGetPricingTime = time.Now()
}

func requirePricingCacheInvalidated(t *testing.T) {
	t.Helper()
	require.Nil(t, pricingMap)
	require.Nil(t, vendorsList)
	require.True(t, lastGetPricingTime.IsZero())
}

func TestPricingOptionUpdateInvalidatesPricingCache(t *testing.T) {
	seedPricingCacheForTest()
	common.OptionMap = map[string]string{}

	require.NoError(t, updateOptionMap("ModelPrice", "{}"))

	requirePricingCacheInvalidated(t)
}

func TestBatchInsertChannelsInvalidatesPricingCache(t *testing.T) {
	truncatePricingCacheInvalidationTables(t)
	seedPricingCacheForTest()

	priority := int64(0)
	weight := uint(0)
	err := BatchInsertChannels([]Channel{
		{
			Name:     "DeepSeekv4",
			Key:      "sk-test",
			Models:   "deepseek-v4",
			Group:    "default",
			Status:   common.ChannelStatusEnabled,
			Priority: &priority,
			Weight:   &weight,
		},
	})
	require.NoError(t, err)

	requirePricingCacheInvalidated(t)
}

func truncatePricingCacheInvalidationTables(t *testing.T) {
	t.Helper()
	t.Cleanup(func() {
		DB.Exec("DELETE FROM abilities")
		DB.Exec("DELETE FROM channels")
		InvalidatePricingCache()
	})
	require.NoError(t, DB.Exec("DELETE FROM abilities").Error)
	require.NoError(t, DB.Exec("DELETE FROM channels").Error)
}
