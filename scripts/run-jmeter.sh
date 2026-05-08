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

if [[ -n "${JAVA_HOME:-}" && -x "${JAVA_HOME}/bin/java" ]]; then
  export PATH="${JAVA_HOME}/bin:${PATH}"
fi

rm -rf "${REPORT_PATH}"
rm -f "${RESULTS_PATH}"
mkdir -p "${REPORT_PATH}"

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

rendered_plan="$(mktemp "${TMPDIR:-/tmp}/incidentflow-jmeter.XXXXXX.jmx")"
trap 'rm -f "${rendered_plan}"' EXIT

sed \
  -e "s/__JMETER_PROTOCOL__/$(escape_sed "${PROTOCOL}")/g" \
  -e "s/__JMETER_HOST__/$(escape_sed "${HOST}")/g" \
  -e "s/__JMETER_PORT__/$(escape_sed "${PORT}")/g" \
  -e "s/__JMETER_STUDENT_EMAIL__/$(escape_sed "${STUDENT_EMAIL}")/g" \
  -e "s/__JMETER_STUDENT_PASSWORD__/$(escape_sed "${STUDENT_PASSWORD}")/g" \
  "${PLAN_PATH}" > "${rendered_plan}"

"${JMETER_BIN}" \
  -n \
  -t "${rendered_plan}" \
  -l "${RESULTS_PATH}" \
  -e \
  -o "${REPORT_PATH}"
