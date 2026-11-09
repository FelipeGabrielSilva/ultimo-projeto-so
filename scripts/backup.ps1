# ========================================================
# Script de Backup do Banco de Dados PostgreSQL (Windows)
# ========================================================

$backupDir = Join-Path $PSScriptRoot "..\backups"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$date = Get-Date -Format "yyyyMMdd_HHmmss"
$filename = "backup_mini_gestao_$date.sql"
$targetPath = Join-Path $backupDir $filename

Write-Host "📦 Gerando dump do banco PostgreSQL containerizado (mini_gestao_db)..." -ForegroundColor Cyan

docker exec -t mini_gestao_db pg_dump -U app_user -d mini_gestao | Out-File -FilePath $targetPath -Encoding utf8

if (Test-Path $targetPath) {
    $size = (Get-Item $targetPath).Length
    Write-Host "✅ Backup concluído com sucesso!" -ForegroundColor Green
    Write-Host "📁 Arquivo: $targetPath ($size bytes)" -ForegroundColor Gray
} else {
    Write-Host "❌ Falha ao criar o arquivo de backup." -ForegroundColor Red
}

