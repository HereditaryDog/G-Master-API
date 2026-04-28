package service

import (
	"strings"

	"github.com/yangjunyu/G-Master-API/model"
	"github.com/yangjunyu/G-Master-API/setting"
	"github.com/yangjunyu/G-Master-API/setting/ratio_setting"
)

func GetUserUsableGroups(userGroup string) map[string]string {
	groupsCopy := setting.GetUserUsableGroupsCopy()
	if userGroup != "" {
		specialSettings, b := ratio_setting.GetGroupRatioSetting().GroupSpecialUsableGroup.Get(userGroup)
		if b {
			// 处理特殊可用分组
			for specialGroup, desc := range specialSettings {
				if strings.HasPrefix(specialGroup, "-:") {
					// 移除分组
					groupToRemove := strings.TrimPrefix(specialGroup, "-:")
					delete(groupsCopy, groupToRemove)
				} else if strings.HasPrefix(specialGroup, "+:") {
					// 添加分组
					groupToAdd := strings.TrimPrefix(specialGroup, "+:")
					groupsCopy[groupToAdd] = desc
				} else {
					// 直接添加分组
					groupsCopy[specialGroup] = desc
				}
			}
		}
		// 如果userGroup不在UserUsableGroups中，返回UserUsableGroups + userGroup
		if _, ok := groupsCopy[userGroup]; !ok {
			groupsCopy[userGroup] = "用户分组"
		}
	}
	return groupsCopy
}

func GetUserUsableGroupsForUser(userId int, userGroup string) map[string]string {
	groups := GetUserUsableGroups(userGroup)
	if !userHasActiveGroupSubscription(userId) {
		return groups
	}
	for groupName := range ratio_setting.GetGroupRatioCopy() {
		if _, ok := groups[groupName]; !ok {
			groups[groupName] = setting.GetUsableGroupDescription(groupName)
		}
	}
	return groups
}

func GroupInUserUsableGroups(userGroup, groupName string) bool {
	_, ok := GetUserUsableGroups(userGroup)[groupName]
	return ok
}

func UserCanUseGroup(userId int, userGroup, groupName string) bool {
	_, ok := GetUserUsableGroupsForUser(userId, userGroup)[groupName]
	return ok
}

// GetUserAutoGroup 根据用户分组获取自动分组设置
func GetUserAutoGroup(userGroup string) []string {
	groups := GetUserUsableGroups(userGroup)
	autoGroups := make([]string, 0)
	for _, group := range setting.GetAutoGroups() {
		if _, ok := groups[group]; ok {
			autoGroups = append(autoGroups, group)
		}
	}
	return autoGroups
}

func GetUserAutoGroupForUser(userId int, userGroup string) []string {
	groups := GetUserUsableGroupsForUser(userId, userGroup)
	autoGroups := make([]string, 0)
	for _, group := range setting.GetAutoGroups() {
		if _, ok := groups[group]; ok {
			autoGroups = append(autoGroups, group)
		}
	}
	return autoGroups
}

// GetUserGroupRatio 获取用户使用某个分组的倍率
// userGroup 用户分组
// group 需要获取倍率的分组
func GetUserGroupRatio(userGroup, group string) float64 {
	ratio, ok := ratio_setting.GetGroupGroupRatio(userGroup, group)
	if ok {
		return ratio
	}
	return ratio_setting.GetGroupRatio(group)
}

func userHasActiveGroupSubscription(userId int) bool {
	if userId <= 0 || model.DB == nil {
		return false
	}
	hasSub, err := model.HasActiveUserSubscriptionUpgradeGroup(userId)
	return err == nil && hasSub
}
