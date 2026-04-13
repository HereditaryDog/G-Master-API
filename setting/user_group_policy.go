package setting

import "strings"

var DefaultRegisterGroup = "标准用户组"
var TopUpUpgradeGroup = "VIP用户组"

func GetDefaultRegisterGroup() string {
	return strings.TrimSpace(DefaultRegisterGroup)
}

func GetTopUpUpgradeGroup() string {
	return strings.TrimSpace(TopUpUpgradeGroup)
}
