package measurements

import "time"

type SmartHealth struct {
	Date           time.Time `json:"date"`
	HealthEstimate float64   `json:"health_estimate"`
	WarnCount      int64     `json:"warn_count,omitempty"`
	FailCount      int64     `json:"fail_count,omitempty"`
	AttrCount      int64     `json:"attr_count,omitempty"`
}

func (sh *SmartHealth) Flatten() (tags map[string]string, fields map[string]interface{}) {
	tags = map[string]string{}
	fields = map[string]interface{}{
		"health_estimate":   sh.HealthEstimate,
		"attr_warn_count":   sh.WarnCount,
		"attr_failed_count": sh.FailCount,
		"attr_count":        sh.AttrCount,
	}
	return tags, fields
}

func (sh *SmartHealth) Inflate(key string, val interface{}) {
	switch key {
	case "health_estimate":
		sh.HealthEstimate = val.(float64)
	case "attr_warn_count":
		sh.WarnCount = val.(int64)
	case "attr_failed_count":
		sh.FailCount = val.(int64)
	case "attr_count":
		sh.AttrCount = val.(int64)
	}
}
