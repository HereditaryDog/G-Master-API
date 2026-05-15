package perf_metrics_setting

import "testing"

func TestDefaultPerfMetricsSettingIsEnabled(t *testing.T) {
	setting := GetSetting()
	if !setting.Enabled {
		t.Fatal("performance metrics should be enabled by default")
	}
	if setting.FlushInterval < 1 {
		t.Fatalf("flush interval = %d, want >= 1", setting.FlushInterval)
	}
	if GetBucketSeconds() <= 0 {
		t.Fatal("bucket seconds must be positive")
	}
}
