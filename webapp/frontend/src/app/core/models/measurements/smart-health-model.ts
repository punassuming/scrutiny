export interface SmartHealthModel {
    date: string;
    health_estimate: number;
    attr_warn_count?: number;
    attr_failed_count?: number;
    attr_count?: number;
}
