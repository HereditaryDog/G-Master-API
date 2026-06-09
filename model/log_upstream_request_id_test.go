package model

import (
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"gorm.io/gorm"
)

func setupLogUpstreamRequestIDTestDB(t *testing.T) {
	t.Helper()
	oldDB := DB
	oldLogDB := LOG_DB
	oldUsingSQLite := common.UsingSQLite
	oldUsingMySQL := common.UsingMySQL
	oldUsingPostgreSQL := common.UsingPostgreSQL
	oldMemoryCacheEnabled := common.MemoryCacheEnabled

	db, err := gorm.Open(sqlite.Open("file:"+strings.ReplaceAll(t.Name(), "/", "_")+"?mode=memory&cache=shared"), &gorm.Config{})
	require.NoError(t, err)

	DB = db
	LOG_DB = db
	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.MemoryCacheEnabled = false
	initCol()
	require.NoError(t, db.AutoMigrate(&Log{}))
	t.Cleanup(func() {
		DB = oldDB
		LOG_DB = oldLogDB
		common.UsingSQLite = oldUsingSQLite
		common.UsingMySQL = oldUsingMySQL
		common.UsingPostgreSQL = oldUsingPostgreSQL
		common.MemoryCacheEnabled = oldMemoryCacheEnabled
		initCol()
		if sqlDB, err := db.DB(); err == nil {
			_ = sqlDB.Close()
		}
	})
}

func TestGetAllLogsFiltersByUpstreamRequestID(t *testing.T) {
	setupLogUpstreamRequestIDTestDB(t)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:            1,
		Username:          "admin",
		CreatedAt:         100,
		Type:              LogTypeConsume,
		ModelName:         "gpt-5.4",
		RequestId:         "local-1",
		UpstreamRequestId: "upstream-keep",
	}).Error)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:            2,
		Username:          "other",
		CreatedAt:         101,
		Type:              LogTypeConsume,
		ModelName:         "gpt-5.4",
		RequestId:         "local-2",
		UpstreamRequestId: "upstream-drop",
	}).Error)

	logs, total, err := GetAllLogs(LogTypeUnknown, 0, 0, "", "", "", 0, 10, 0, "", "", "upstream-keep")

	require.NoError(t, err)
	require.Equal(t, int64(1), total)
	require.Len(t, logs, 1)
	require.Equal(t, "local-1", logs[0].RequestId)
	require.Equal(t, "upstream-keep", logs[0].UpstreamRequestId)
}

func TestGetUserLogsFiltersByUpstreamRequestID(t *testing.T) {
	setupLogUpstreamRequestIDTestDB(t)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:            9,
		Username:          "tester",
		CreatedAt:         100,
		Type:              LogTypeConsume,
		ModelName:         "deepseek-v4-pro",
		RequestId:         "local-user-1",
		UpstreamRequestId: "upstream-user-keep",
	}).Error)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:            9,
		Username:          "tester",
		CreatedAt:         101,
		Type:              LogTypeConsume,
		ModelName:         "deepseek-v4-pro",
		RequestId:         "local-user-2",
		UpstreamRequestId: "upstream-user-drop",
	}).Error)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:            10,
		Username:          "other",
		CreatedAt:         102,
		Type:              LogTypeConsume,
		ModelName:         "deepseek-v4-pro",
		RequestId:         "local-user-3",
		UpstreamRequestId: "upstream-user-keep",
	}).Error)

	logs, total, err := GetUserLogs(9, LogTypeUnknown, 0, 0, "", "", 0, 10, "", "", "upstream-user-keep")

	require.NoError(t, err)
	require.Equal(t, int64(1), total)
	require.Len(t, logs, 1)
	require.Equal(t, "local-user-1", logs[0].RequestId)
	require.Equal(t, "upstream-user-keep", logs[0].UpstreamRequestId)
}

func TestGetAllLogsUsesExplicitWildcardFilters(t *testing.T) {
	setupLogUpstreamRequestIDTestDB(t)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:    1,
		Username:  "alice-main",
		CreatedAt: 100,
		Type:      LogTypeConsume,
		ModelName: "gpt-4_pro",
		TokenName: "desktop-token",
		RequestId: "keep",
	}).Error)
	require.NoError(t, LOG_DB.Create(&Log{
		UserId:    2,
		Username:  "alice-main",
		CreatedAt: 101,
		Type:      LogTypeConsume,
		ModelName: "gpt-4apro",
		TokenName: "desktop-token",
		RequestId: "drop",
	}).Error)

	logs, total, err := GetAllLogs(LogTypeUnknown, 0, 0, "gpt-4_pro", "alice-main", "desktop-token", 0, 10, 0, "", "", "")

	require.NoError(t, err)
	require.Equal(t, int64(1), total)
	require.Len(t, logs, 1)
	require.Equal(t, "keep", logs[0].RequestId)

	logs, total, err = GetAllLogs(LogTypeUnknown, 0, 0, "gpt-4%", "alice-main", "desktop-token", 0, 10, 0, "", "", "")

	require.NoError(t, err)
	require.Equal(t, int64(2), total)
	require.Len(t, logs, 2)

	logs, total, err = GetAllLogs(LogTypeUnknown, 0, 0, "gpt-4%", "alice-main", "desktop", 0, 10, 0, "", "", "")

	require.NoError(t, err)
	require.Equal(t, int64(0), total)
	require.Empty(t, logs)
}
