#!/bin/bash
# Database Restore Script for qbideas
# Usage: ./scripts/restore-database.sh <backup-file>

set -e

if [ -z "$1" ]; then
    echo "❌ Error: No backup file specified"
    echo "Usage: ./scripts/restore-database.sh <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/*.sql 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "🗄️  qbideas Database Restore"
echo "==========================="
echo ""
echo "⚠️  WARNING: This will replace all existing data!"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q qbideas-postgres; then
    echo "❌ Error: PostgreSQL container is not running"
    echo "   Start it with: npm run dev"
    exit 1
fi

echo "📦 Copying backup file to container..."
docker cp "$BACKUP_FILE" qbideas-postgres:/tmp/restore.sql

echo "🔄 Dropping existing database..."
docker exec qbideas-postgres psql -U qbideas -d postgres -c "DROP DATABASE IF EXISTS qbideas;"

echo "🆕 Creating fresh database..."
docker exec qbideas-postgres psql -U qbideas -d postgres -c "CREATE DATABASE qbideas;"

echo "📥 Restoring data..."
docker exec qbideas-postgres psql -U qbideas -d qbideas -f /tmp/restore.sql

echo "🧹 Cleaning up..."
docker exec qbideas-postgres rm /tmp/restore.sql

echo ""
echo "✅ Database restored successfully!"
echo ""
echo "🔄 You may need to restart the API service:"
echo "   docker restart qbideas-api"
