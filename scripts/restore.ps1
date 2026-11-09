# ========================================================
# Script de Restauração do Banco de Dados PostgreSQL (Windows)
# Uso: .\scripts\restore.ps1 -Arquivo .\backups\backup_xxx.sql
# ========================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$Arquivo
)

if (-not (Test-Path $Arquivo)) {
    Write-Host "❌ Arquivo não encontrado: $Arquivo" -ForegroundColor Red
    exit 1
}

Write-Host "⚠️  ATENÇÃO: A restauração irá importar os dados para o banco de dados." -ForegroundColor Yellow
$confirm = Read-Host "Deseja continuar? (S/N)"
if ($confirm -ne "S" -and $confirm -ne "s") {
    Write-Host "Operação cancelada."
    exit 0
}

Write-Host "📥 Restaurando banco de dados..." -ForegroundColor Cyan
Get-Content -Path $Arquivo | docker exec -i mini_gestao_db psql -U app_user -d mini_gestao

Write-Host "✅ Restauração finalizada!" -ForegroundColor Green

