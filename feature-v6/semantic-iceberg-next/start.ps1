$demoRoot=$PSScriptRoot
try {$null=Invoke-WebRequest 'http://127.0.0.1:8799/' -TimeoutSec 2} catch {Start-Process node -ArgumentList @('server.mjs','8799') -WorkingDirectory $demoRoot -WindowStyle Hidden; Start-Sleep -Seconds 2}
Start-Process 'http://127.0.0.1:8799/'
