$root = $PSScriptRoot
try { $null = Invoke-WebRequest 'http://127.0.0.1:8797/' -TimeoutSec 2 } catch { Start-Process node -ArgumentList @('server.mjs', '8797') -WorkingDirectory $root -WindowStyle Hidden; Start-Sleep -Seconds 2 }
Start-Process 'http://127.0.0.1:8797/'
