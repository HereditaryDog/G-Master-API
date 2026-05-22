package operation_setting

import "github.com/yangjunyu/G-Master-API/setting/config"

type PaymentSetting struct {
	AmountOptions          []int           `json:"amount_options"`
	AmountDiscount         map[int]float64 `json:"amount_discount"` // 充值金额对应的折扣，例如 100 元 0.9 表示 100 元充值享受 9 折优惠
	ComplianceConfirmed    bool            `json:"compliance_confirmed"`
	ComplianceTermsVersion string          `json:"compliance_terms_version"`
	ComplianceConfirmedAt  int64           `json:"compliance_confirmed_at"`
	ComplianceConfirmedBy  int             `json:"compliance_confirmed_by"`
	ComplianceConfirmedIP  string          `json:"compliance_confirmed_ip"`
}

// 默认配置
var paymentSetting = PaymentSetting{
	AmountOptions:          []int{10, 20, 50, 100, 200, 500},
	AmountDiscount:         map[int]float64{},
	ComplianceConfirmed:    true,
	ComplianceTermsVersion: CurrentComplianceTermsVersion,
}

const CurrentComplianceTermsVersion = "gmaster-payment-compliance-v1"

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("payment_setting", &paymentSetting)
}

func GetPaymentSetting() *PaymentSetting {
	return &paymentSetting
}

func IsPaymentComplianceConfirmed() bool {
	return paymentSetting.ComplianceConfirmed
}
