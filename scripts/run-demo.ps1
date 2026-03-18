param(
  [int]$BackendPort = 5000,
  [int]$FrontendPort = 4173
)

$root = "C:\Users\madhu\OneDrive\Desktop\devops_project"
$nodeExe = "C:\Program Files\nodejs\node.exe"
$cmdExe = "C:\Windows\System32\cmd.exe"
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"

$backend = New-Object System.Diagnostics.Process
$backend.StartInfo = New-Object System.Diagnostics.ProcessStartInfo
$backend.StartInfo.FileName = $cmdExe
$backend.StartInfo.WorkingDirectory = $backendDir
$backend.StartInfo.Arguments = "/c set USE_IN_MEMORY_DB=true&& set PORT=$BackendPort&& set CLIENT_ORIGIN=http://127.0.0.1:$FrontendPort&& `"$nodeExe`" src/server.js"
$backend.StartInfo.UseShellExecute = $false
$backend.StartInfo.CreateNoWindow = $true
$backend.Start() | Out-Null

$frontend = New-Object System.Diagnostics.Process
$frontend.StartInfo = New-Object System.Diagnostics.ProcessStartInfo
$frontend.StartInfo.FileName = $cmdExe
$frontend.StartInfo.WorkingDirectory = $frontendDir
$frontend.StartInfo.Arguments = "/c set FRONTEND_PORT=$FrontendPort&& set FRONTEND_HOST=127.0.0.1&& `"$nodeExe`" serve-dist.js"
$frontend.StartInfo.UseShellExecute = $false
$frontend.StartInfo.CreateNoWindow = $true
$frontend.Start() | Out-Null

Write-Host "Backend PID: $($backend.Id)"
Write-Host "Frontend PID: $($frontend.Id)"
Write-Host "Backend URL: http://127.0.0.1:$BackendPort"
Write-Host "Frontend URL: http://127.0.0.1:$FrontendPort"
