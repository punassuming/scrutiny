# Agent instructions

This repository is a monorepo with three main parts:
- **collector**: Go-based SMART metrics collector (`collector/cmd/collector-metrics`).
- **web backend**: Go API server (`webapp/backend`).
- **frontend**: Angular SPA (`webapp/frontend`).

## Local setup
- Go **1.20+** is required.
- Node.js for the Angular frontend (Angular CLI v13 is used in the Makefile).
- Example configs are provided at `example.scrutiny.yaml` (web) and `example.collector.yaml` (collector).

## Build commands
- Go binaries: `make binary-collector` and `make binary-web` (runs `go mod vendor` and builds).
- Frontend production bundle: run `make binary-frontend` from the repo root; the `.ONESHELL` target `cd`'s into `webapp/frontend`, installs Angular CLI v13, runs `npm ci`, and builds to the repo-level `dist/` via `--output-path=$(CURDIR)/dist`.

## Running applications
- Backend with local config and built frontend bundle:
  ```bash
  go run webapp/backend/cmd/scrutiny/scrutiny.go start --config ./scrutiny.yaml
  ```
- Frontend dev server with mocked data:
  ```bash
  cd webapp/frontend
  npm install
  npm run start -- --serve-path="/web/" --port 4200
  ```
- Collector:
  ```bash
  go run collector/cmd/collector-metrics/collector-metrics.go run --debug
  ```

## Tests
- Go tests: `go test ./...`
  - Integration tests expect an InfluxDB 2.x instance reachable at `http://influxdb:8086`. Start one before running tests:
    ```bash
    docker run -p 8086:8086 -d --rm \
      -e DOCKER_INFLUXDB_INIT_MODE=setup \
      -e DOCKER_INFLUXDB_INIT_USERNAME=admin \
      -e DOCKER_INFLUXDB_INIT_PASSWORD=password12345 \
      -e DOCKER_INFLUXDB_INIT_ORG=scrutiny \
      -e DOCKER_INFLUXDB_INIT_BUCKET=metrics \
      -e DOCKER_INFLUXDB_INIT_ADMIN_TOKEN=my-super-secret-auth-token \
      --name influxdb \
      influxdb:2.2
    ```
  - The hostname defaults to `influxdb`; if running tests on the host, either add a local host entry pointing `influxdb` to `127.0.0.1` or override the URL to `http://localhost:8086`.
  - Tests have been exercised with InfluxDB 2.0+; the example above uses 2.2.
  - Without this service, tests such as `webapp/backend/pkg/web/server_test.go` fail while checking InfluxDB setup.
- Frontend unit tests: 
  ```bash
  cd webapp/frontend
  npm ci
  npx ng test --watch=false --browsers=ChromeHeadless --code-coverage
  ```

## Notes
- Build artifacts should not be committed; keep `dist/` out of version control.
- When running both backend and frontend together, point the backend config to the built frontend path (`./dist/`) as shown in `CONTRIBUTING.md`.
