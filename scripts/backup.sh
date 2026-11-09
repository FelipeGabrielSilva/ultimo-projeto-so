#!/bin/bash
# ========================================================
# Script de Backup do Banco de Dados PostgreSQL (Linux / Coolify)
# ========================================================

set -e

BACKUP_DIR="$(dirname "$0")/../backups"
mkdir -p "$BACKUP_DIR"

DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="backup_mini_gestao_${DATE}.sql"
TARGET_PATH="${BACKUP_DIR}/${FILENAME}"

echo "📦 Gerando dump do banco de dados PostgreSQL..."
docker exec -t mini_gestao_db pg_dump -U app_user -d mini_gestao > "$TARGET_PATH"

echo "✅ Backup realizado com sucesso!"
echo "📁 Arquivo salvo em: $TARGET_PATH"
ls -lh "$TARGET_PATH"
