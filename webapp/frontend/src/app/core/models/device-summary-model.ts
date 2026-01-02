import {DeviceModel} from 'app/core/models/device-model';
import {SmartTemperatureModel} from 'app/core/models/measurements/smart-temperature-model';
import {SmartHealthModel} from 'app/core/models/measurements/smart-health-model';

// maps to webapp/backend/pkg/models/device_summary.go
export interface DeviceSummaryModel {
    device: DeviceModel;
    smart?: SmartSummary;
    temp_history?: SmartTemperatureModel[];
    health_history?: SmartHealthModel[];
}

export interface SmartSummary {
    collector_date?: string,
    temp?: number
    power_on_hours?: number
    health_estimate?: number
    warn_count?: number
    fail_count?: number
    attr_count?: number
}
