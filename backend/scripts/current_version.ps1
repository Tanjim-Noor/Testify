# View current migration version
# Usage: .\scripts\current_version.ps1

Write-Host "Current Migration Version:" -ForegroundColor Cyan
Push-Location $PSScriptRoot\..
alembic current
Pop-Location
