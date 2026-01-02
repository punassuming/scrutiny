import {SmartHealthModel} from './measurements/smart-health-model';

export interface DeviceSummaryHealthResponseWrapper {
    success: boolean;
    errors: any[];
    data: {
        health_history: { [key: string]: SmartHealthModel[]; }
    }
}
