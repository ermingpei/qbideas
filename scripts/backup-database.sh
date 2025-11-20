#!/bin/bash
# Database Backup Script for qbideas
# Usage: ./scripts/backup-database.sh

set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/qbideas_backup_${TIMESTAMP}.sql"

echo "🗄️  qbideas Database Backup"
echo "=========================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if PostgreSQL container is running
if ! docker ps | grep -q qbideas-postgres; then
    echo "❌ Error: PostgreSQL container is not running"
    echo "   Start it with: npm run dev"
    exit 1
fi

# Export database
echo "📦 Exporting database..."
docker exec qbideas-postgres pg_dump -U qbideas qbideas > "$BACKUP_FILE"

# Check if backup was successful
if [ -f "$BACKUP_FILE" ]; then
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup successful!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $SIZE"
    echo ""
    echo "📋 To restore on another machine:"
    echo "   docker cp $BACKUP_FILE qbideas-postgres:/tmp/backup.sql"
    echo "   docker exec qbideas-postgres psql -U qbideas -d qbideas -f /tmp/backup.sql"
else
    echo "❌ Backup failed!"
    exit 1
fi
