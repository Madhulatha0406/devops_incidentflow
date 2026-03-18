Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -like '*src/server.js*' -or $_.CommandLine -like '*serve-dist.js*' } |
  ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
