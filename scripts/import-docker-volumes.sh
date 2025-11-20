#!/bin/bash
# Import Docker Volumes Script for qbideas
# Usage: ./scripts/import-docker-volumes.sh

set -e

BACKUP_DIR="docker-volumes-backup"

echo "🐳 qbideas Docker Volumes Import"
echo "================================="
echo ""

# Check if backup directory exists
if [ ! -d "$BACKUP_DIR" ]; then
    echo "❌ Backup directory not found: $BACKUP_DIR"
    echo "   Make sure you've copied the backup files to this location"
    exit 1
fi

# List available backups
echo "📁 Available backups:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || { echo "   No backup files found"; exit 1; }
echo ""

# Warning
echo "⚠️  WARNING: This will replace existing Docker volumes!"
read -p "Continue? (y/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

# Stop services
echo "🛑 Stopping Docker services..."
npm run dev:down 2>/dev/null || true

# Import PostgreSQL volume
POSTGRES_BACKUP=$(ls -t "$BACKUP_DIR"/postgres_data_*.tar.gz 2>/dev/null | head -1)
if [ -n "$POSTGRES_BACKUP" ]; then
    echo "📥 Importing PostgreSQL volume..."
    docker volume create qbideas_postgres_data >/dev/null 2>&1 || true
    docker run --rm \
        -v qbideas_postgres_data:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $POSTGRES_BACKUP) -C /data"
    echo "   ✅ PostgreSQL volume imported"
else
    echo "   ⚠️  No PostgreSQL backup found"
fi

# Import Redis volume
REDIS_BACKUP=$(ls -t "$BACKUP_DIR"/redis_data_*.tar.gz 2>/dev/null | head -1)
if [ -n "$REDIS_BACKUP" ]; then
    echo "📥 Importing Redis volume..."
    docker volume create qbideas_redis_data >/dev/null 2>&1 || true
    docker run --rm \
        -v qbideas_redis_data:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $REDIS_BACKUP) -C /data"
    echo "   ✅ Redis volume imported"
else
    echo "   ⚠️  No Redis backup found"
fi

# Import MinIO volume
MINIO_BACKUP=$(ls -t "$BACKUP_DIR"/minio_data_*.tar.gz 2>/dev/null | head -1)
if [ -n "$MINIO_BACKUP" ]; then
    echo "📥 Importing MinIO volume..."
    docker volume create qbideas_minio_data >/dev/null 2>&1 || true
    docker run --rm \
        -v qbideas_minio_data:/data \
        -v "$(pwd)/$BACKUP_DIR":/backup \
        alpine sh -c "rm -rf /data/* && tar xzf /backup/$(basename $MINIO_BACKUP) -C /data"
    echo "   ✅ MinIO volume imported"
else
    echo "   ⚠️  No MinIO backup found"
fi

echo ""
echo "✅ Volume import complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Start services: npm run dev"
echo "   2. Wait 30 seconds for initialization"
echo "   3. Verify: docker ps"
