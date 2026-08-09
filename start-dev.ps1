# CapstoneHub -- Full Stack Dev Launcher
# Starts Java Backend + Python Matching Service + React Frontend in separate windows

$ROOT = $PSScriptRoot

# --- Write backend temp script ---
$backendScript = Join-Path $ROOT ".backend-run.ps1"
@'
$env:DB_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
$env:DB_USERNAME="postgres.iqkserylncujlyjtopsl"
$env:DB_PASSWORD="sivaprasanth"
$env:JWT_SECRET="CapstoneHubSuperSecretKeyForJWTTokenGeneration2024!!!"
$env:MATCHING_SERVICE_URL="http://localhost:8000"
$env:REDIS_URL="rediss://default:gQAAAAAAAosxAAIgcDE5NWYxMDdjYzU5NWU0ZTQ2YjM1NzgwOTQyZDVjM2E1Yg@trusty-tahr-166705.upstash.io:6379"
$env:CLOUDINARY_CLOUD_NAME="wc8fbkbj"
$env:CLOUDINARY_API_KEY="182754421256833"
$env:CLOUDINARY_API_SECRET="8-cAlhZkQnGYOmAxieNkZO0sBFg"
$env:MAIL_USERNAME="sivaprsanthpc@gmail.com"
$env:MAIL_PASSWORD="ximo lpsk oorl mmvp"

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Spring Boot Backend  -- localhost:8081 " -ForegroundColor Cyan
Write-Host "  Swagger: http://localhost:8081/swagger-ui.html" -ForegroundColor Gray
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""
'@ | Set-Content -Path $backendScript -Encoding UTF8

# Append the cd + run (uses $ROOT which is a variable, so use Add-Content with double-quotes)
Add-Content -Path $backendScript -Value "Set-Location -Path `"$ROOT\backend`""
Add-Content -Path $backendScript -Value "try { mvn spring-boot:run } catch { Write-Host `"ERROR: `$_`" -ForegroundColor Red }"
Add-Content -Path $backendScript -Value "Write-Host ''"
Add-Content -Path $backendScript -Value "Write-Host 'Backend stopped. Press Enter to close this window.' -ForegroundColor Yellow"
Add-Content -Path $backendScript -Value "Read-Host"

# --- Write frontend temp script ---
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

# --- Write Python matching service temp script ---
$matchingScript = Join-Path $ROOT ".matching-run.ps1"
@'
Write-Host ""
Write-Host "=========================================" -ForegroundColor Yellow
Write-Host "  Python Matching Service -- localhost:8000 " -ForegroundColor Yellow
Write-Host "  Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "========================================="  -ForegroundColor Yellow
Write-Host ""
Write-Host "Installing dependencies..." -ForegroundColor Gray
'@ | Set-Content -Path $matchingScript -Encoding UTF8

Add-Content -Path $matchingScript -Value "Set-Location -Path `"$ROOT\matching-service`""
Add-Content -Path $matchingScript -Value "try { python -m pip install -r requirements.txt -q } catch { Write-Host `"pip warning: `$_`" -ForegroundColor Yellow }"
Add-Content -Path $matchingScript -Value "Write-Host ''"
Add-Content -Path $matchingScript -Value "`$env:NVIDIA_API_KEY=`"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`""
Add-Content -Path $matchingScript -Value "Write-Host 'Starting uvicorn...' -ForegroundColor Yellow"
Add-Content -Path $matchingScript -Value "try { python -m uvicorn main:app --reload --port 8000 } catch { Write-Host `"ERROR: `$_`" -ForegroundColor Red }"
Add-Content -Path $matchingScript -Value "Write-Host ''"
Add-Content -Path $matchingScript -Value "Write-Host 'Python service stopped. Press Enter to close this window.' -ForegroundColor Yellow"
Add-Content -Path $matchingScript -Value "Read-Host"

# --- Launch both ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   CapstoneHub Dev Environment Starting    " -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "[1] Backend  -> http://localhost:8081"           -ForegroundColor Cyan
Write-Host "    Swagger  -> http://localhost:8081/swagger-ui.html" -ForegroundColor Gray
Write-Host "[2] Python   -> http://localhost:8000"           -ForegroundColor Yellow
Write-Host "    API Docs -> http://localhost:8000/docs"      -ForegroundColor Gray
Write-Host "[3] Frontend -> http://localhost:5173"           -ForegroundColor Magenta
Write-Host ""
Write-Host "Opening three terminal windows..." -ForegroundColor Yellow
Write-Host ""

Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$backendScript`""  -WindowStyle Normal
Start-Sleep -Seconds 2
Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$matchingScript`"" -WindowStyle Normal
Start-Sleep -Seconds 2
Start-Process cmd -ArgumentList "/K", "powershell -ExecutionPolicy Bypass -File `"$frontendScript`""  -WindowStyle Normal

Write-Host "Done! All 3 services are starting up." -ForegroundColor Green
Write-Host ""
Write-Host "  Backend  -> http://localhost:8081" -ForegroundColor Cyan
Write-Host "  Python   -> http://localhost:8000" -ForegroundColor Yellow
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Magenta
Write-Host ""
Write-Host "Close the opened windows to stop the servers." -ForegroundColor Yellow
Write-Host ""
