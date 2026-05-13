package model

import (
	"testing"

	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
)

func setupChannelSortTestDB(t *testing.T) {
	t.Helper()

	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	initCol()
	require.NoError(t, DB.Exec("DELETE FROM channels").Error)
	t.Cleanup(func() {
		DB.Exec("DELETE FROM channels")
	})
}

func TestGetAllChannelsAppliesExplicitSort(t *testing.T) {
	setupChannelSortTestDB(t)
	seedChannelSortRows(t)

	channels, err := GetAllChannels(0, 10, false, false, NewChannelSortOptions("response_time", "asc", false))

	require.NoError(t, err)
	require.Len(t, channels, 3)
	require.Equal(t, []string{"beta", "gamma", "alpha"}, channelNames(channels))
}

func TestGetAllChannelsFallsBackToIDSort(t *testing.T) {
	setupChannelSortTestDB(t)
	seedChannelSortRows(t)

	channels, err := GetAllChannels(0, 10, false, true, NewChannelSortOptions("invalid", "asc", false))

	require.NoError(t, err)
	require.Len(t, channels, 3)
	require.Equal(t, []string{"gamma", "beta", "alpha"}, channelNames(channels))
}

func TestSearchChannelsAppliesExplicitSort(t *testing.T) {
	setupChannelSortTestDB(t)
	seedChannelSortRows(t)

	channels, err := SearchChannels("", "vip", "gpt", false, NewChannelSortOptions("balance", "desc", false))

	require.NoError(t, err)
	require.Len(t, channels, 2)
	require.Equal(t, []string{"gamma", "alpha"}, channelNames(channels))
}

func seedChannelSortRows(t *testing.T) {
	t.Helper()

	alphaPriority := int64(10)
	betaPriority := int64(30)
	gammaPriority := int64(20)
	require.NoError(t, DB.Create(&Channel{
		Name:         "alpha",
		Key:          "alpha-key",
		Models:       "gpt-4,gpt-3.5",
		Group:        "default,vip",
		Priority:     &alphaPriority,
		ResponseTime: 300,
		Balance:      5,
	}).Error)
	require.NoError(t, DB.Create(&Channel{
		Name:         "beta",
		Key:          "beta-key",
		Models:       "claude-3",
		Group:        "default",
		Priority:     &betaPriority,
		ResponseTime: 100,
		Balance:      10,
	}).Error)
	require.NoError(t, DB.Create(&Channel{
		Name:         "gamma",
		Key:          "gamma-key",
		Models:       "gpt-4",
		Group:        "vip",
		Priority:     &gammaPriority,
		ResponseTime: 200,
		Balance:      20,
	}).Error)
}

func channelNames(channels []*Channel) []string {
	names := make([]string, 0, len(channels))
	for _, channel := range channels {
		names = append(names, channel.Name)
	}
	return names
}
