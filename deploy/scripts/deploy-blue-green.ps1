param(
  [string]$Color = ""
)

$deployEnvFile = "deploy/.env.deploy"

if (-not (Test-Path $deployEnvFile)) {
  @"
ACTIVE_COLOR=blue
ACTIVE_BACKEND_HOST=backend-blue
ACTIVE_FRONTEND_HOST=frontend-blue
"@ | Set-Content -Path $deployEnvFile
}

$envMap = @{}
Get-Content $deployEnvFile | ForEach-Object {
  $parts = $_ -split "=", 2
  if ($parts.Length -eq 2) {
    $envMap[$parts[0]] = $parts[1]
  }
}

$currentColor = $envMap["ACTIVE_COLOR"]
$targetColor = if ($Color) { $Color } elseif ($currentColor -eq "blue") { "green" } else { "blue" }

Write-Host "Deploying $targetColor stack"
docker compose --env-file .env --env-file $deployEnvFile up -d --build "backend-$targetColor" "frontend-$targetColor"

$containerName = "incidentflow-backend-$targetColor"
Write-Host "Waiting for $containerName health check"
do {
  Start-Sleep -Seconds 5
  $status = docker inspect --format '{{.State.Health.Status}}' $containerName
} while ($status -ne "healthy")

@"
ACTIVE_COLOR=$targetColor
ACTIVE_BACKEND_HOST=backend-$targetColor
ACTIVE_FRONTEND_HOST=frontend-$targetColor
"@ | Set-Content -Path $deployEnvFile

Write-Host "Switching proxy to $targetColor"
docker compose --env-file .env --env-file $deployEnvFile up -d proxy

Write-Host "Deployment complete. Active color: $targetColor"
