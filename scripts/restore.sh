#!/bin/bash
# ========================================================
# Script de Restauração do Banco de Dados PostgreSQL (Linux)
# Uso: ./scripts/restore.sh ./backups/backup_xxx.sql
# ========================================================

set -e

if [ -z "$1" ]; then
    echo "❌ Informe o arquivo de backup a ser restaurado."
    echo "Uso: $0 ./backups/backup_xxx.sql"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Arquivo não encontrado: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  ATENÇÃO: A restauração irá importar os dados para o banco de dados."
read -p "Deseja continuar? (s/n): " CONFIRM
if [ "$CONFIRM" != "s" ] && [ "$CONFIRM" != "S" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo "📥 Restaurando banco de dados a partir de $BACKUP_FILE..."
cat "$BACKUP_FILE" | docker exec -i mini_gestao_db psql -U app_user -d mini_gestao

echo "✅ Restauração finalizada com sucesso!"
