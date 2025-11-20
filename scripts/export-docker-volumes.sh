#!/bin/bash
# Export Docker Volumes Script for qbideas
# Usage: ./scripts/export-docker-volumes.sh

set -e

BACKUP_DIR="docker-volumes-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🐳 qbideas Docker Volumes Export"
echo "================================="
echo ""

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if volumes exist
echo "🔍 Checking Docker volumes..."
VOLUMES=$(docker volume ls -q | grep qbideas || true)

if [ -z "$VOLUMES" ]; then
    echo "❌ No qbideas volumes found"
    echo "   Make sure Docker services are running: npm run dev"
    exit 1
fi

echo "Found volumes:"
echo "$VOLUMES" | sed 's/^/   - /'
echo ""

# Export PostgreSQL volume
if docker volume ls -q | grep -q qbideas_postgres_data; then
    echo "📦 Exporting PostgreSQL volume..."
    docker run --rm \
        -v qbideas_postgres_data:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/postgres_data_${TIMESTAMP}.tar.gz" -C /data .
    echo "   ✅ Exported to $BACKUP_DIR/postgres_data_${TIMESTAMP}.tar.gz"
else
    echo "   ⚠️  PostgreSQL volume not found"
fi

# Export Redis volume
if docker volume ls -q | grep -q qbideas_redis_data; then
    echo "📦 Exporting Redis volume..."
    docker run --rm \
        -v qbideas_redis_data:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/redis_data_${TIMESTAMP}.tar.gz" -C /data .
    echo "   ✅ Exported to $BACKUP_DIR/redis_data_${TIMESTAMP}.tar.gz"
else
    echo "   ⚠️  Redis volume not found"
fi

# Export MinIO volume
if docker volume ls -q | grep -q qbideas_minio_data; then
    echo "📦 Exporting MinIO volume..."
    docker run --rm \
        -v qbideas_minio_data:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine tar czf "/backup/minio_data_${TIMESTAMP}.tar.gz" -C /data .
    echo "   ✅ Exported to $BACKUP_DIR/minio_data_${TIMESTAMP}.tar.gz"
else
    echo "   ⚠️  MinIO volume not found"
fi

echo ""
echo "✅ Volume export complete!"
echo ""
echo "📁 Backup location: $BACKUP_DIR/"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || true
echo ""
echo "📋 To restore on new Mac:"
echo "   1. Copy $BACKUP_DIR/ to new Mac"
echo "   2. Run: ./scripts/import-docker-volumes.sh"
