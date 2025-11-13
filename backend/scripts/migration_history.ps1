# View migration history
# Usage: .\scripts\migration_history.ps1

Write-Host "Migration History:" -ForegroundColor Cyan
Push-Location $PSScriptRoot\..
alembic history --verbose
Pop-Location
