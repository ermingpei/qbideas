# Migration Scripts

Helper scripts for migrating qbideas to a new Mac.

## Available Scripts

### 🚀 transfer-to-new-mac.sh
**Purpose**: Complete migration package creator (run on OLD Mac)

**Usage**:
```bash
./scripts/transfer-to-new-mac.sh
```

**What it does**:
- Exports PostgreSQL database
- Copies environment files (.env, frontend/.env.local)
- Creates migration archive (qbideas-migration.tar.gz)
- Generates setup script for new Mac
- Optionally starts HTTP server for network transfer

**Output**: `qbideas-migration.tar.gz` containing everything needed

---

### 💾 backup-database.sh
**Purpose**: Backup PostgreSQL database

**Usage**:
```bash
./scripts/backup-database.sh
```

**What it does**:
- Exports database to SQL file
- Saves to `backups/qbideas_backup_TIMESTAMP.sql`
- Shows file size and restore instructions

**Requirements**: PostgreSQL container must be running

---

### 📥 restore-database.sh
**Purpose**: Restore PostgreSQL database from backup

**Usage**:
```bash
./scripts/restore-database.sh <backup-file>
```

**Example**:
```bash
./scripts/restore-database.sh backups/qbideas_backup_20241105_143022.sql
```

**What it does**:
- Drops existing database
- Creates fresh database
- Restores data from backup file

**Warning**: This will delete all existing data!

---

### 📦 export-docker-volumes.sh
**Purpose**: Export all Docker volumes to tar.gz files

**Usage**:
```bash
./scripts/export-docker-volumes.sh
```

**What it does**:
- Exports PostgreSQL volume
- Exports Redis volume
- Exports MinIO volume
- Saves to `docker-volumes-backup/` directory

**Output**:
- `postgres_data_TIMESTAMP.tar.gz`
- `redis_data_TIMESTAMP.tar.gz`
- `minio_data_TIMESTAMP.tar.gz`

---

### 📥 import-docker-volumes.sh
**Purpose**: Import Docker volumes from backup files

**Usage**:
```bash
./scripts/import-docker-volumes.sh
```

**What it does**:
- Stops Docker services
- Imports PostgreSQL volume
- Imports Redis volume
- Imports MinIO volume
- Provides instructions to restart services

**Requirements**: Backup files must exist in `docker-volumes-backup/`

**Warning**: This will replace existing volumes!

---

## Migration Workflows

### Workflow 1: Complete Migration (Recommended)

**On OLD Mac**:
```bash
./scripts/transfer-to-new-mac.sh
# Follow prompts to start HTTP server
```

**On NEW Mac**:
```bash
# Download migration package
curl -O http://OLD_MAC_IP:8080/qbideas-migration.tar.gz

# Extract and setup
tar xzf qbideas-migration.tar.gz
cd qbideas-migration
./setup-on-new-mac.sh
```

---

### Workflow 2: Database Only

**On OLD Mac**:
```bash
./scripts/backup-database.sh
# Transfer backups/qbideas_backup_*.sql to new Mac
```

**On NEW Mac**:
```bash
# After setting up project
./scripts/restore-database.sh backups/qbideas_backup_*.sql
```

---

### Workflow 3: Full Volume Migration

**On OLD Mac**:
```bash
./scripts/export-docker-volumes.sh
# Transfer docker-volumes-backup/ directory to new Mac
```

**On NEW Mac**:
```bash
# After setting up project
./scripts/import-docker-volumes.sh
npm run dev
```

---

## Script Requirements

All scripts require:
- Docker Desktop installed and running
- Bash shell (default on macOS)
- Sufficient disk space for backups

Individual script requirements:
- **backup-database.sh**: PostgreSQL container running
- **restore-database.sh**: PostgreSQL container running
- **export-docker-volumes.sh**: Docker volumes exist
- **import-docker-volumes.sh**: Backup files in `docker-volumes-backup/`

---

## Troubleshooting

### "Container not running" error
```bash
# Start services
npm run dev

# Wait 30 seconds
sleep 30

# Try script again
```

### "Permission denied" error
```bash
# Make scripts executable
chmod +x scripts/*.sh
```

### "Volume not found" error
```bash
# Check volumes exist
docker volume ls | grep qbideas

# If not, start services first
npm run dev
```

### "Disk space" error
```bash
# Check available space
df -h

# Clean up Docker
docker system prune -a --volumes
```

---

## Backup Best Practices

1. **Regular Backups**: Run `backup-database.sh` regularly during development
2. **Before Major Changes**: Always backup before schema changes or major updates
3. **Keep Multiple Backups**: Don't delete old backups immediately
4. **Test Restores**: Periodically test that backups can be restored
5. **Secure Storage**: Keep backups in secure location (encrypted if sensitive data)

---

## File Locations

### Backups
- Database backups: `backups/qbideas_backup_*.sql`
- Volume backups: `docker-volumes-backup/*.tar.gz`
- Migration package: `qbideas-migration.tar.gz`

### Temporary Files
- Migration directory: `qbideas-migration/` (can be deleted after transfer)

---

## Script Maintenance

### Adding New Services

If you add new Docker services, update:
1. `export-docker-volumes.sh` - Add volume export
2. `import-docker-volumes.sh` - Add volume import
3. `transfer-to-new-mac.sh` - Update migration package

### Modifying Backup Format

If changing backup format:
1. Update `backup-database.sh` export command
2. Update `restore-database.sh` import command
3. Test with sample data

---

## Quick Reference

```bash
# Full migration
./scripts/transfer-to-new-mac.sh

# Database only
./scripts/backup-database.sh
./scripts/restore-database.sh <file>

# Volumes only
./scripts/export-docker-volumes.sh
./scripts/import-docker-volumes.sh

# Check what's backed up
ls -lh backups/
ls -lh docker-volumes-backup/
```

---

## Support

For issues with scripts:
1. Check script requirements above
2. Review error messages carefully
3. Check Docker logs: `docker logs <container-name>`
4. Verify services are running: `docker ps`
5. See main [MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)
