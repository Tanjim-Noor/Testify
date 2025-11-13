# Rollback the last database migration
# Usage: .\scripts\rollback.ps1

Write-Host "Rolling back last migration..." -ForegroundColor Yellow
Push-Location $PSScriptRoot\..
alembic downgrade -1
Pop-Location
Write-Host "Rollback completed!" -ForegroundColor Yellow
