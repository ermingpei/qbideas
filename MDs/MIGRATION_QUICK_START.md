# Quick Migration Guide

Choose your migration method:

## 🚀 Method 1: Automated Transfer (Recommended)

### On OLD Mac:
```bash
./scripts/transfer-to-new-mac.sh
# Follow prompts to start HTTP server
```

### On NEW Mac:
```bash
# Download migration package (replace IP with old Mac's IP)
curl -O http://OLD_MAC_IP:8080/qbideas-migration.tar.gz

# Extract and run setup
tar xzf qbideas-migration.tar.gz
cd qbideas-migration
./setup-on-new-mac.sh
```

---

## 🎯 Method 2: Fresh Setup (No Data Transfer)

### On NEW Mac:
```bash
# 1. Install prerequisites
# - Docker Desktop: https://www.docker.com/products/docker-desktop/
# - Node.js 20+: https://nodejs.org/

# 2. Clone repository
git clone <your-repo-url> qbideas
cd qbideas

# 3. Setup environment
cp .env.example .env
# Edit .env and add your API keys

# 4. Install and start
npm install
npm run dev
sleep 30
npm run migrate
npm run seed:ideas

# 5. Start frontend (new terminal)
npm run dev:frontend
```

---

## 📦 Method 3: Manual Backup/Restore

### On OLD Mac:
```bash
# Backup database
./scripts/backup-database.sh

# Export Docker volumes (optional)
./scripts/export-docker-volumes.sh

# Copy these files to new Mac:
# - .env
# - frontend/.env.local
# - backups/qbideas_backup_*.sql
# - docker-volumes-backup/*.tar.gz (if exported)
```

### On NEW Mac:
```bash
# Clone and setup
git clone <your-repo-url> qbideas
cd qbideas
npm install

# Copy environment files
# (copy .env and frontend/.env.local from old Mac)

# Start services
npm run dev
sleep 30

# Restore database
./scripts/restore-database.sh backups/qbideas_backup_*.sql

# Import volumes (optional)
./scripts/import-docker-volumes.sh

# Start frontend
npm run dev:frontend
```

---

## ✅ Verification

After migration, check:

```bash
# Services running
docker ps

# API health
curl http://localhost:3000/health

# Database
docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT COUNT(*) FROM ideas;"

# Frontend
open http://localhost:3002
```

---

## 🆘 Quick Troubleshooting

```bash
# Reset everything
npm run dev:clean
docker system prune -a --volumes
npm run dev

# Port conflicts
lsof -ti:3000 | xargs kill -9  # API
lsof -ti:3002 | xargs kill -9  # Frontend

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma
cd services/api
npx prisma generate
```

---

## 📚 Full Documentation

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) for complete details.

---

## 🎯 Service URLs

After successful migration:

- **Frontend**: http://localhost:3002
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Mailhog**: http://localhost:8025
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin123)
- **PostgreSQL**: localhost:5432 (qbideas/dev_password)
- **Redis**: localhost:6379 (password: dev_password)
