package database

import (
	"context"
	"fmt"
	"github.com/analogj/scrutiny/webapp/backend/pkg/models/measurements"
	"strings"
	"time"
)

func (sr *scrutinyRepository) GetSmartHealthHistory(ctx context.Context, durationKey string) (map[string][]measurements.SmartHealth, error) {
	deviceHealthHistory := map[string][]measurements.SmartHealth{}

	queryStr := sr.aggregateHealthQuery(durationKey)

	result, err := sr.influxQueryApi.Query(ctx, queryStr)
	if err == nil {
		for result.Next() {
			if deviceWWN, ok := result.Record().Values()["device_wwn"]; ok {
				if _, ok := deviceHealthHistory[deviceWWN.(string)]; !ok {
					deviceHealthHistory[deviceWWN.(string)] = []measurements.SmartHealth{}
				}

				currentHealthHistory := deviceHealthHistory[deviceWWN.(string)]
				smartHealth := measurements.SmartHealth{}

				for key, val := range result.Record().Values() {
					smartHealth.Inflate(key, val)
				}
				smartHealth.Date = result.Record().Values()["_time"].(time.Time)
				currentHealthHistory = append(currentHealthHistory, smartHealth)
				deviceHealthHistory[deviceWWN.(string)] = currentHealthHistory
			}
		}
		if result.Err() != nil {
			fmt.Printf("Query error: %s\n", result.Err().Error())
		}
	} else {
		return nil, err
	}

	return deviceHealthHistory, nil
}

func (sr *scrutinyRepository) aggregateHealthQuery(durationKey string) string {
	partialQueryStr := []string{
		`import "influxdata/influxdb/schema"`,
	}

	nestedDurationKeys := sr.lookupNestedDurationKeys(durationKey)

	subQueryNames := []string{}
	for _, nestedDurationKey := range nestedDurationKeys {
		bucketName := sr.lookupBucketName(nestedDurationKey)
		durationRange := sr.lookupDuration(nestedDurationKey)

		subQueryNames = append(subQueryNames, fmt.Sprintf(`%sData`, nestedDurationKey))
		partialQueryStr = append(partialQueryStr, []string{
			fmt.Sprintf(`%sData = from(bucket: "%s")`, nestedDurationKey, bucketName),
			fmt.Sprintf(`|> range(start: %s, stop: %s)`, durationRange[0], durationRange[1]),
			`|> filter(fn: (r) => r["_measurement"] == "smart" )`,
			`|> filter(fn: (r) => r["_field"] == "health_estimate" or r["_field"] == "attr_warn_count" or r["_field"] == "attr_failed_count" or r["_field"] == "attr_count")`,
			`|> aggregateWindow(every: 1d, fn: last, createEmpty: false)`,
			`|> group(columns: ["device_wwn"])`,
			`|> schema.fieldsAsCols()`,
		}...)
	}

	partialQueryStr = append(partialQueryStr, fmt.Sprintf("union(tables: [%s])", strings.Join(subQueryNames, ", ")))
	partialQueryStr = append(partialQueryStr, `|> group(columns: ["device_wwn"])`)
	partialQueryStr = append(partialQueryStr, `|> sort(columns: ["_time"], desc: false)`)
	partialQueryStr = append(partialQueryStr, `|> yield(name: "last")`)

	return strings.Join(partialQueryStr, "\n")
}
