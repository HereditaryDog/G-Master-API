package model

import (
	"fmt"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/require"
	"github.com/yangjunyu/G-Master-API/common"
	"github.com/yangjunyu/G-Master-API/setting"
	"gorm.io/gorm"
)

func setupOptionBulkTestDB(t *testing.T) *gorm.DB {
	t.Helper()

	oldDB := DB
	oldLogDB := LOG_DB
	oldOptionMap := common.OptionMap
	oldMerchantID := setting.WaffoPancakeMerchantID
	oldPrivateKey := setting.WaffoPancakePrivateKey
	oldReturnURL := setting.WaffoPancakeReturnURL
	oldStoreID := setting.WaffoPancakeStoreID
	oldProductID := setting.WaffoPancakeProductID

	common.UsingSQLite = true
	common.UsingMySQL = false
	common.UsingPostgreSQL = false
	common.RedisEnabled = false
	common.OptionMap = map[string]string{}

	dsn := fmt.Sprintf("file:%s?mode=memory&cache=shared", strings.ReplaceAll(t.Name(), "/", "_"))
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	require.NoError(t, err)
	DB = db
	LOG_DB = db
	require.NoError(t, db.AutoMigrate(&Option{}))

	t.Cleanup(func() {
		DB = oldDB
		LOG_DB = oldLogDB
		common.OptionMap = oldOptionMap
		setting.WaffoPancakeMerchantID = oldMerchantID
		setting.WaffoPancakePrivateKey = oldPrivateKey
		setting.WaffoPancakeReturnURL = oldReturnURL
		setting.WaffoPancakeStoreID = oldStoreID
		setting.WaffoPancakeProductID = oldProductID
		sqlDB, err := db.DB()
		if err == nil {
			_ = sqlDB.Close()
		}
	})

	return db
}

func TestUpdateOptionsBulkPersistsAndRefreshesOptionMap(t *testing.T) {
	db := setupOptionBulkTestDB(t)

	err := UpdateOptionsBulk(map[string]string{
		"WaffoPancakeMerchantID": "merchant_123",
		"WaffoPancakePrivateKey": "private_key_123",
		"WaffoPancakeReturnURL":  "https://gmapi.fun/console/topup",
		"WaffoPancakeStoreID":    "store_123",
		"WaffoPancakeProductID":  "product_123",
	})
	require.NoError(t, err)

	var option Option
	require.NoError(t, db.Where("key = ?", "WaffoPancakeStoreID").First(&option).Error)
	require.Equal(t, "store_123", option.Value)
	require.Equal(t, "merchant_123", setting.WaffoPancakeMerchantID)
	require.Equal(t, "product_123", setting.WaffoPancakeProductID)
	require.Equal(t, "https://gmapi.fun/console/topup", common.OptionMap["WaffoPancakeReturnURL"])
}

func TestUpdateOptionsBulkEmptyInputIsNoop(t *testing.T) {
	setupOptionBulkTestDB(t)
	require.NoError(t, UpdateOptionsBulk(nil))
	require.NoError(t, UpdateOptionsBulk(map[string]string{}))
}
