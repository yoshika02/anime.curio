# AnimeCurio - Fix Deployment Script
# Double-click this file to fix the Cloudflare deployment error

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AnimeCurio - Fixing Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

Set-Location "C:\Users\yoshi\Desktop\animecurio"

Write-Host "`n[1/4] Regenerating package-lock.json..." -ForegroundColor Yellow
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed!" -ForegroundColor Red
    Pause
    exit 1
}

Write-Host "`n[2/4] Creating public folder structure..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "public" | Out-Null
New-Item -ItemType Directory -Force -Path "public\products" | Out-Null
Write-Host "  public/ folder ready" -ForegroundColor Green

Write-Host "`n[3/4] Copying background images to public/..." -ForegroundColor Yellow
if (Test-Path "Website_landscape_old.png") {
    Copy-Item "Website_landscape_old.png" "public\Website_landscape_old.png" -Force
    Write-Host "  Copied Website_landscape_old.png" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Website_landscape_old.png not found in project root!" -ForegroundColor Red
}

if (Test-Path "Phone_portrait.png") {
    Copy-Item "Phone_portrait.png" "public\Phone_portrait.png" -Force
    Write-Host "  Copied Phone_portrait.png" -ForegroundColor Green
} else {
    Write-Host "  WARNING: Phone_portrait.png not found in project root!" -ForegroundColor Red
}

Write-Host "`n[4/4] Committing and pushing to git..." -ForegroundColor Yellow
git add .
git commit -m "fix: upgrade vite v6, regenerate lockfile, move assets to public"
git push

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERROR: git push failed. Make sure you're logged into GitHub." -ForegroundColor Red
} else {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ALL DONE! Redeploy on Cloudflare now." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
}

Pause
