package models

import (
	"github.com/analogj/scrutiny/webapp/backend/pkg/models/measurements"
	"time"
)

type DeviceSummaryWrapper struct {
	Success bool    `json:"success"`
	Errors  []error `json:"errors"`
	Data    struct {
		Summary map[string]*DeviceSummary `json:"summary"`
	} `json:"data"`
}

type DeviceSummary struct {
	Device Device `json:"device"`

	SmartResults  *SmartSummary                   `json:"smart,omitempty"`
	TempHistory   []measurements.SmartTemperature `json:"temp_history,omitempty"`
	HealthHistory []measurements.SmartHealth      `json:"health_history,omitempty"`
}
type SmartSummary struct {
	// Collector Summary Data
	CollectorDate  time.Time `json:"collector_date,omitempty"`
	Temp           int64     `json:"temp,omitempty"`
	PowerOnHours   int64     `json:"power_on_hours,omitempty"`
	HealthEstimate float64   `json:"health_estimate,omitempty"`
	WarnCount      int64     `json:"warn_count,omitempty"`
	FailCount      int64     `json:"fail_count,omitempty"`
	AttrCount      int64     `json:"attr_count,omitempty"`
}
