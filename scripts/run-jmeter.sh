#!/usr/bin/env bash
set -euo pipefail

PLAN_PATH="${PLAN_PATH:-performance/jmeter/incidentflow-smoke-test.jmx}"
RESULTS_PATH="${RESULTS_PATH:-performance/jmeter/results.jtl}"
REPORT_PATH="${REPORT_PATH:-performance/jmeter/report}"
PROTOCOL="${PROTOCOL:-http}"
HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-5000}"
STUDENT_EMAIL="${STUDENT_EMAIL:-student@incidentflow.local}"
STUDENT_PASSWORD="${STUDENT_PASSWORD:-Password123!}"

if command -v jmeter >/dev/null 2>&1; then
  JMETER_BIN="$(command -v jmeter)"
elif [[ -n "${JMETER_HOME:-}" && -x "${JMETER_HOME}/bin/jmeter" ]]; then
  JMETER_BIN="${JMETER_HOME}/bin/jmeter"
else
  echo "JMeter executable not found. Set JMETER_HOME or add jmeter to PATH." >&2
  exit 1
fi

mkdir -p "${REPORT_PATH}"

"${JMETER_BIN}" \
  -n \
  -t "${PLAN_PATH}" \
  -l "${RESULTS_PATH}" \
  -e \
  -o "${REPORT_PATH}" \
  -Jprotocol="${PROTOCOL}" \
  -Jhost="${HOST}" \
  -Jport="${PORT}" \
  -JstudentEmail="${STUDENT_EMAIL}" \
  -JstudentPassword="${STUDENT_PASSWORD}"
