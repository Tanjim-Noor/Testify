# Apply all pending database migrations
# Usage: .\scripts\migrate.ps1

Write-Host "Applying pending migrations..." -ForegroundColor Green
Push-Location $PSScriptRoot\..
alembic upgrade head
Pop-Location
Write-Host "Migrations applied successfully!" -ForegroundColor Green
