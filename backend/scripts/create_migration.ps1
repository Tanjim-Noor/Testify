# Create a new Alembic migration
# Usage: .\scripts\create_migration.ps1 "migration message"

param(
    [Parameter(Mandatory=$true)]
    [string]$Message
)

Write-Host "Creating new migration: $Message" -ForegroundColor Green
Push-Location $PSScriptRoot\..
alembic revision --autogenerate -m "$Message"
Pop-Location
