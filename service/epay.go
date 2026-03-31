package service

import (
	"github.com/yangjunyu/G-Master-API/setting/operation_setting"
	"github.com/yangjunyu/G-Master-API/setting/system_setting"
)

func GetCallbackAddress() string {
	if operation_setting.CustomCallbackAddress == "" {
		return system_setting.ServerAddress
	}
	return operation_setting.CustomCallbackAddress
}
