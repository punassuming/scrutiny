import {
    AfterViewInit,
    ChangeDetectionStrategy,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation
} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {ApexOptions} from 'ng-apexcharts';
import {DashboardService} from 'app/modules/dashboard/dashboard.service';
import {MatDialog} from '@angular/material/dialog';
import {DashboardSettingsComponent} from 'app/layout/common/dashboard-settings/dashboard-settings.component';
import {AppConfig} from 'app/core/config/app.config';
import {ScrutinyConfigService} from 'app/core/config/scrutiny-config.service';
import {Router} from '@angular/router';
import {TemperaturePipe} from 'app/shared/temperature.pipe';
import {DeviceTitlePipe} from 'app/shared/device-title.pipe';
import {DeviceSummaryModel} from 'app/core/models/device-summary-model';
import {downloadJson} from 'app/shared/download-json.util';

@Component({
    selector       : 'example',
    templateUrl    : './dashboard.component.html',
    styleUrls      : ['./dashboard.component.scss'],
    encapsulation  : ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy
{
    summaryData: { [key: string]: DeviceSummaryModel };
    hostGroups: { [hostId: string]: string[] } = {}
    temperatureOptionsByProtocol: { [protocol: string]: ApexOptions } = {};
    tempDurationKey = 'forever'
    config: AppConfig;
    showArchived: boolean;

    // Private
    private _unsubscribeAll: Subject<void>;

    /**
     * Constructor
     *
     * @param {DashboardService} _dashboardService
     * @param {ScrutinyConfigService} _configService
     * @param {MatDialog} dialog
     * @param {Router} router
     */
    constructor(
        private _dashboardService: DashboardService,
        private _configService: ScrutinyConfigService,
        public dialog: MatDialog,
        private router: Router,
    )
    {
        // Set the private defaults
        this._unsubscribeAll = new Subject();

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void
    {

        // Subscribe to config changes
        this._configService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AppConfig) => {

                // check if the old config and the new config do not match.
                const oldConfig = JSON.stringify(this.config)
                const newConfig = JSON.stringify(config)

                if(oldConfig !== newConfig){
                    console.log(`Configuration updated: ${newConfig} vs ${oldConfig}`)
                    // Store the config
                    this.config = config;

                    if(oldConfig){
                        console.log('reloading component...')
                        this.refreshComponent()
                    }
                }
            });

        // Get the data
        this._dashboardService.data$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((data) => {

                // Store the data
                this.summaryData = data;

                // generate group data.
                for (const wwn in this.summaryData) {
                    const hostid = this.summaryData[wwn].device.host_id
                    const hostDeviceList = this.hostGroups[hostid] || []
                    hostDeviceList.push(wwn)
                    this.hostGroups[hostid] = hostDeviceList
                }
                console.log(this.hostGroups)

                // Prepare the chart data
                this._prepareChartData();
            });
    }

    /**
     * After view init
     */
    ngAfterViewInit(): void
    {}

    /**
     * On destroy
     */
    ngOnDestroy(): void
    {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------
    private refreshComponent(): void {

        const currentUrl = this.router.url;
        this.router.routeReuseStrategy.shouldReuseRoute = () => false;
        this.router.onSameUrlNavigation = 'reload';
        this.router.navigate([currentUrl]);
    }

    private _deviceDataTemperatureSeriesByProtocol(): { [protocol: string]: any[] } {
        const temperatureSeriesByProtocol: { [protocol: string]: any[] } = {}

        console.log('DEVICE DATA SUMMARY', this.summaryData)

        for (const wwn in this.summaryData) {
            const deviceSummary = this.summaryData[wwn]
            if (!deviceSummary.temp_history) {
                continue
            }

            const deviceProtocol = deviceSummary.device.device_protocol || 'Unknown'
            
            if (!temperatureSeriesByProtocol[deviceProtocol]) {
                temperatureSeriesByProtocol[deviceProtocol] = []
            }

            const deviceName = DeviceTitlePipe.deviceTitleWithFallback(deviceSummary.device, this.config.dashboard_display)

            const deviceSeriesMetadata = {
                name: deviceName,
                data: []
            }

            for(const tempHistory of deviceSummary.temp_history){
                const newDate = new Date(tempHistory.date);
                let temperature;
                switch (this.config.temperature_unit) {
                    case 'celsius':
                        temperature = tempHistory.temp;
                        break
                    case 'fahrenheit':
                        temperature = TemperaturePipe.celsiusToFahrenheit(tempHistory.temp)
                        break
                }
                deviceSeriesMetadata.data.push({
                    x: newDate,
                    y: temperature
                })
            }
            temperatureSeriesByProtocol[deviceProtocol].push(deviceSeriesMetadata)
        }
        return temperatureSeriesByProtocol
    }
    /**
     * Prepare the chart data from the data
     *
     * @private
     */
    private _prepareChartData(): void
    {
        const seriesByProtocol = this._deviceDataTemperatureSeriesByProtocol()
        this.temperatureOptionsByProtocol = {}

        for (const protocol in seriesByProtocol) {
            // Account balance
            this.temperatureOptionsByProtocol[protocol] = {
                chart  : {
                    animations: {
                        speed           : 400,
                        animateGradually: {
                            enabled: false
                        }
                    },
                    fontFamily: 'inherit',
                    foreColor : 'inherit',
                    width     : '100%',
                    height    : '100%',
                    type      : 'area',
                    sparkline : {
                        enabled: true
                    }
                },
                colors : ['#667eea', '#9066ea', '#66c0ea', '#66ead2', '#d266ea', '#66ea90'],
                fill   : {
                    colors : ['#b2bef4', '#c7b2f4', '#b2dff4', '#b2f4e8', '#e8b2f4', '#b2f4c7'],
                    opacity: 0.5,
                    type   : 'gradient'
                },
                series : seriesByProtocol[protocol],
                stroke : {
                    curve: this.config.line_stroke,
                    width: 2
                },
                tooltip: {
                    theme: 'dark',
                    shared: true,
                    intersect: false,
                    x    : {
                        format: 'MMM dd, yyyy HH:mm:ss'
                    },
                    y    : {

                        formatter: (value) => {
                            return TemperaturePipe.formatTemperature(value, this.config.temperature_unit, true) as string;
                        }
                    }
                },
                xaxis: {
                    type: 'datetime'
                }
            };
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    getProtocolKeys(): string[] {
        return Object.keys(this.temperatureOptionsByProtocol).sort();
    }

    deviceSummariesForHostGroup(hostGroupWWNs: string[]): DeviceSummaryModel[] {
        const deviceSummaries: DeviceSummaryModel[] = []
        for (const wwn of hostGroupWWNs) {
            if (this.summaryData[wwn]) {
                deviceSummaries.push(this.summaryData[wwn])
            }
        }
        return deviceSummaries
    }

    openDialog(): void {
        const dialogRef = this.dialog.open(DashboardSettingsComponent, {width: '600px',});

        dialogRef.afterClosed().subscribe(result => {
            console.log(`Dialog result: ${result}`);
        });
    }

    onDeviceDeleted(wwn: string): void {
        delete this.summaryData[wwn] // remove the device from the summary list.
    }

    onDeviceArchived(wwn: string): void {
        this.summaryData[wwn].device.archived = true;
    }

    onDeviceUnarchived(wwn: string): void {
        this.summaryData[wwn].device.archived = false;
    }

    /*

    DURATION_KEY_WEEK    = "week"
	DURATION_KEY_MONTH   = "month"
	DURATION_KEY_YEAR    = "year"
	DURATION_KEY_FOREVER = "forever"
     */

    changeSummaryTempDuration(durationKey: string): void {
        this.tempDurationKey = durationKey

        this._dashboardService.getSummaryTempData(durationKey)
            .subscribe((tempHistoryData) => {

                // given a list of device temp history, override the data in the "summary" object.
                for (const wwn in this.summaryData) {
                    // console.log(`Updating ${wwn}, length: ${this.data.data.summary[wwn].temp_history.length}`)
                    this.summaryData[wwn].temp_history = tempHistoryData[wwn] || []
                }

                // Prepare the chart series data for all protocols
                this._prepareChartData()
            });
    }

    exportSummary(): void {
        if (!this.summaryData) {
            return;
        }

        downloadJson(this.summaryData, 'scrutiny-dashboard-summary.json');
    }

    /**
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any
    {
        return item.id || index;
    }

}
