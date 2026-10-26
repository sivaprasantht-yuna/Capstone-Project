# CapstoneHub -- Unified Dev Launcher
# Starts Unified Python FastAPI Backend + React Frontend

$ROOT = $PSScriptRoot
$backendScript  = Join-Path $ROOT ".backend-run.ps1"
$frontendScript = Join-Path $ROOT ".frontend-run.ps1"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CapstoneHub Unified Full-Stack Starting  " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Unified Backend  -> http://localhost:8000 (Swagger: /docs)" -ForegroundColor Green
Write-Host "[2] React Frontend   -> http://localhost:5173"                   -ForegroundColor Magenta
Write-Host ""
Write-Host "Opening dev terminal windows..." -ForegroundColor Yellow
Write-Host ""

# Use WorkingDirectory "C:\" to avoid PowerShell wildcard errors caused by
# brackets [[ D ]] in the project path when resolving the default CWD.
Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$backendScript`"" `
    -WorkingDirectory "C:\" -WindowStyle Normal

Start-Sleep -Seconds 2

Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$frontendScript`"" `
    -WorkingDirectory "C:\" -WindowStyle Normal

Write-Host "Done! Unified stack is running." -ForegroundColor Green
Write-Host ""
