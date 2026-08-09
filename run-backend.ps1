# PowerShell launcher script for CapstoneHub Java Backend
$env:DB_URL="jdbc:postgresql://aws-1-ap-south-1.pooler.supabase.com:5432/postgres?sslmode=require"
$env:DB_USERNAME="postgres.iqkserylncujlyjtopsl"
$env:DB_PASSWORD="sivaprasanth"
$env:JWT_SECRET="CapstoneHubSuperSecretKeyForJWTTokenGeneration2024!!!"
$env:MATCHING_SERVICE_URL="https://capstone-project-smoky-six.vercel.app"
$env:REDIS_URL="rediss://default:gQAAAAAAAosxAAIgcDE5NWYxMDdjYzU5NWU0ZTQ2YjM1NzgwOTQyZDVjM2E1Yg@trusty-tahr-166705.upstash.io:6379"
$env:CLOUDINARY_CLOUD_NAME="wc8fbkbj"
$env:CLOUDINARY_API_KEY="182754421256833"
$env:CLOUDINARY_API_SECRET="8-cAlhZkQnGYOmAxieNkZO0sBFg"
$env:MAIL_USERNAME="sivaprsanthpc@gmail.com"
$env:MAIL_PASSWORD="ximo lpsk oorl mmvp"

Write-Host "🚀 Starting CapstoneHub Java Spring Boot Backend..." -ForegroundColor Green
Write-Host "Connecting to Supabase Database: aws-1-ap-south-1.pooler.supabase.com" -ForegroundColor Cyan

Set-Location -Path "$PSScriptRoot\backend"
mvn spring-boot:run
