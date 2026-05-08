param(
  [string]$JMeterExecutable = "",
  [string]$PlanPath = "performance/jmeter/incidentflow-smoke-test.jmx",
  [string]$ResultsPath = "performance/jmeter/results.jtl",
  [string]$ReportPath = "performance/jmeter/report",
  [string]$Protocol = "http",
  [string]$TargetHost = "127.0.0.1",
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

if ($env:JAVA_HOME) {
  $javaBin = Join-Path $env:JAVA_HOME "bin"
  if (Test-Path (Join-Path $javaBin "java.exe")) {
    $env:PATH = "$javaBin;$env:PATH"
  }
}

if (Test-Path $ReportPath) {
  Remove-Item -Path $ReportPath -Recurse -Force
}

if (Test-Path $ResultsPath) {
  Remove-Item -Path $ResultsPath -Force
}

Add-Type -AssemblyName System.Security

$escapedProtocol = [System.Security.SecurityElement]::Escape($Protocol)
$escapedTargetHost = [System.Security.SecurityElement]::Escape($TargetHost)
$escapedPort = [System.Security.SecurityElement]::Escape([string]$Port)
$escapedStudentEmail = [System.Security.SecurityElement]::Escape($StudentEmail)
$escapedStudentPassword = [System.Security.SecurityElement]::Escape($StudentPassword)
$renderedPlanPath = Join-Path ([System.IO.Path]::GetTempPath()) "incidentflow-jmeter-$PID.jmx"
$planContent = Get-Content -Path $PlanPath -Raw
$planContent = $planContent.Replace("__JMETER_PROTOCOL__", $escapedProtocol)
$planContent = $planContent.Replace("__JMETER_HOST__", $escapedTargetHost)
$planContent = $planContent.Replace("__JMETER_PORT__", $escapedPort)
$planContent = $planContent.Replace("__JMETER_STUDENT_EMAIL__", $escapedStudentEmail)
$planContent = $planContent.Replace("__JMETER_STUDENT_PASSWORD__", $escapedStudentPassword)
Set-Content -Path $renderedPlanPath -Value $planContent -Encoding UTF8

New-Item -ItemType Directory -Force -Path $ReportPath | Out-Null

try {
  & $JMeterExecutable `
    -n `
    -t $renderedPlanPath `
    -l $ResultsPath `
    -e `
    -o $ReportPath
}
finally {
  if (Test-Path $renderedPlanPath) {
    Remove-Item -Path $renderedPlanPath -Force
  }
}
