# StreetBites Git Automation Script
# Használat: .\commit-and-push.ps1 "Commit üzenet itt"

param(
    [Parameter(Position=0, Mandatory=$true)]
    [string]$CommitMessage
)

$projectPath = Get-Location

Write-Host "📦 StreetBites - Commit & Push" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Git status
Write-Host "📋 Git Status:" -ForegroundColor Yellow
git status --short
Write-Host ""

# Stage all changes
Write-Host "📝 Staging changes..." -ForegroundColor Green
git add .

# Commit
Write-Host "💾 Committing: '$CommitMessage'" -ForegroundColor Green
git commit -m "$CommitMessage"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Commit failed!" -ForegroundColor Red
    exit 1
}

# Pull latest
Write-Host "⬇️  Pulling latest changes from GitHub..." -ForegroundColor Green
git pull origin main --rebase

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Pull failed!" -ForegroundColor Red
    exit 1
}

# Push
Write-Host "⬆️  Pushing to GitHub..." -ForegroundColor Green
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Success! Changes pushed to GitHub" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Latest commits:" -ForegroundColor Cyan
    git log --oneline -5
} else {
    Write-Host "❌ Push failed!" -ForegroundColor Red
    exit 1
}
