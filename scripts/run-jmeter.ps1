param(
  [string]$JMeterExecutable = "",
  [string]$PlanPath = "performance/jmeter/incidentflow-smoke-test.jmx",
  [string]$ResultsPath = "performance/jmeter/results.jtl",
  [string]$ReportPath = "performance/jmeter/report",
  [string]$Protocol = "http",
  [string]$Host = "127.0.0.1",
  [int]$Port = 5000,
  [string]$StudentEmail = "student@incidentflow.local",
  [string]$StudentPassword = "Password123!"
)

if (-not $JMeterExecutable) {
  if ($env:JMETER_HOME) {
    $candidate = Join-Path $env:JMETER_HOME "bin\jmeter.bat"
    if (Test-Path $candidate) {
      $JMeterExecutable = $candidate
    }
  }

  if (-not $JMeterExecutable) {
    $command = Get-Command jmeter.bat -ErrorAction SilentlyContinue
    if ($command) {
      $JMeterExecutable = $command.Source
    }
  }
}

if (-not $JMeterExecutable -or -not (Test-Path $JMeterExecutable)) {
  Write-Error "JMeter executable not found. Set JMETER_HOME or pass -JMeterExecutable."
  exit 1
}

New-Item -ItemType Directory -Force -Path $ReportPath | Out-Null

& $JMeterExecutable `
  -n `
  -t $PlanPath `
  -l $ResultsPath `
  -e `
  -o $ReportPath `
  -Jprotocol=$Protocol `
  -Jhost=$Host `
  -Jport=$Port `
  -JstudentEmail=$StudentEmail `
  -JstudentPassword=$StudentPassword
