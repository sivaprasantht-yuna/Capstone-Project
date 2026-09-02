# CapstoneHub -- Unified Dev Launcher
# Starts Unified Python FastAPI Backend + React Frontend

$ROOT = $PSScriptRoot

# --- Write Unified Python Backend script ---
$backendScript = Join-Path $ROOT ".backend-run.ps1"
@'
$env:DB_URL="postgresql://postgres.iqkserylncujlyjtopsl:sivaprasanth@aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
$env:JWT_SECRET="CapstoneHubSuperSecretKeyForJWTTokenGeneration2024!!!"
$env:CLOUDINARY_CLOUD_NAME="wc8fbkbj"
$env:CLOUDINARY_API_KEY="182754421256833"
$env:CLOUDINARY_API_SECRET="8-cAlhZkQnGYOmAxieNkZO0sBFg"
$env:NVIDIA_API_KEY="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"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host "  Unified Python FastAPI Backend (8000)  " -ForegroundColor Green
Write-Host "  Interactive Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
'@ | Set-Content -Path $backendScript -Encoding UTF8

Add-Content -Path $backendScript -Value "Set-Location -Path `"$ROOT\backend`""
Add-Content -Path $backendScript -Value "try { python -m uvicorn main:app --reload --port 8000 } catch { Write-Host `"ERROR: `$_`" -ForegroundColor Red }"
Add-Content -Path $backendScript -Value "Write-Host ''"
Add-Content -Path $backendScript -Value "Write-Host 'Backend stopped. Press Enter to close this window.' -ForegroundColor Yellow"
Add-Content -Path $backendScript -Value "Read-Host"

# --- Write Frontend script ---
$frontendScript = Join-Path $ROOT ".frontend-run.ps1"
@'
Write-Host ""
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host "  React Frontend -- http://localhost:5173 " -ForegroundColor Magenta
Write-Host "=========================================" -ForegroundColor Magenta
Write-Host ""
'@ | Set-Content -Path $frontendScript -Encoding UTF8

Add-Content -Path $frontendScript -Value "Set-Location -Path `"$ROOT\frontend`""
Add-Content -Path $frontendScript -Value "try { npm run dev } catch { Write-Host `"ERROR: `$_`" -ForegroundColor Red }"
Add-Content -Path $frontendScript -Value "Write-Host ''"
Add-Content -Path $frontendScript -Value "Write-Host 'Frontend stopped. Press Enter to close this window.' -ForegroundColor Yellow"
Add-Content -Path $frontendScript -Value "Read-Host"

# --- Launch processes ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   CapstoneHub Unified Full-Stack Starting   " -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1] Unified Backend  -> http://localhost:8000 (Swagger: /docs)" -ForegroundColor Green
Write-Host "[2] React Frontend   -> http://localhost:5173"                 -ForegroundColor Magenta
Write-Host ""
Write-Host "Opening dev terminal windows..." -ForegroundColor Yellow
Write-Host ""

Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$backendScript`""  -WindowStyle Normal
Start-Sleep -Seconds 2
Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$frontendScript`""  -WindowStyle Normal

Write-Host "Done! Unified stack is running." -ForegroundColor Green
Write-Host ""
