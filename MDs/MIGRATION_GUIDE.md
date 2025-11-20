# Project Migration Guide

Complete guide to move the qbideas project to another Mac on the same subnet.

## Overview

This guide covers migrating your entire development environment including:
- Source code (via Git)
- Docker containers and volumes
- Environment configuration
- Database data
- Development dependencies

## Prerequisites on Target Mac

### Required Software
- **Docker Desktop**: [Download](https://www.docker.com/products/docker-desktop/)
- **Node.js 20+**: [Download](https://nodejs.org/)
- **Git**: Pre-installed on macOS
- **Homebrew** (optional but recommended): `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"`

## Migration Methods

### Method 1: Fresh Setup (Recommended - Cleanest)

This method gives you a clean environment on the new Mac.

#### On Target Mac

1. **Install Prerequisites**
   ```bash
   # Install Homebrew (if not installed)
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   
   # Install Node.js
   brew install node@20
   
   # Install Docker Desktop from website
   # https://www.docker.com/products/docker-desktop/
   ```

2. **Clone Repository**
   ```bash
   # Clone from your Git remote
   git clone <your-git-remote-url> qbideas
   cd qbideas
   
   # Or if using local network transfer (see Method 2)
   ```

3. **Copy Environment Files**
   ```bash
   # Copy .env from old Mac (via network, USB, or manually)
   # You can use scp if SSH is enabled on old Mac:
   scp user@old-mac-ip:/path/to/qbideas/.env .env
   
   # Also copy frontend env
   scp user@old-mac-ip:/path/to/qbideas/frontend/.env.local frontend/.env.local
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Services**
   ```bash
   # Start Docker services
   npm run dev
   
   # Wait 30 seconds for services to initialize
   ```

6. **Setup Database**
   ```bash
   # Run migrations
   npm run migrate
   
   # Seed sample data (or restore backup - see below)
   npm run seed:ideas
   ```

7. **Start Frontend**
   ```bash
   # In new terminal
   npm run dev:frontend
   ```

8. **Verify**
   - Frontend: http://localhost:3002
   - API: http://localhost:3000/health

---

### Method 2: With Data Migration

Use this if you want to preserve your database data and Docker volumes.

#### Step 1: Prepare on Old Mac

1. **Export Database**
   ```bash
   # Export PostgreSQL database
   docker exec qbideas-postgres pg_dump -U qbideas qbideas > qbideas_backup.sql
   
   # Or use the backup script
   ./scripts/backup-database.sh
   ```

2. **Export Docker Volumes (Optional)**
   ```bash
   # Backup PostgreSQL data
   docker run --rm -v qbideas_postgres_data:/data -v $(pwd):/backup \
     alpine tar czf /backup/postgres_data.tar.gz -C /data .
   
   # Backup Redis data
   docker run --rm -v qbideas_redis_data:/data -v $(pwd):/backup \
     alpine tar czf /backup/redis_data.tar.gz -C /data .
   
   # Backup MinIO data
   docker run --rm -v qbideas_minio_data:/data -v $(pwd):/backup \
     alpine tar czf /backup/minio_data.tar.gz -C /data .
   ```

3. **Create Transfer Package**
   ```bash
   # Create a directory with everything needed
   mkdir qbideas-migration
   cp .env qbideas-migration/
   cp frontend/.env.local qbideas-migration/
   cp qbideas_backup.sql qbideas-migration/
   cp *.tar.gz qbideas-migration/ 2>/dev/null || true
   
   # Create archive
   tar czf qbideas-migration.tar.gz qbideas-migration/
   ```

#### Step 2: Transfer to New Mac

**Option A: Network Transfer (Same Subnet)**
```bash
# On old Mac - start a simple HTTP server
cd /path/to/qbideas
python3 -m http.server 8080

# On new Mac - download
curl -O http://old-mac-ip:8080/qbideas-migration.tar.gz

# Or use scp if SSH enabled
scp user@old-mac-ip:/path/to/qbideas-migration.tar.gz .
```

**Option B: USB Drive**
```bash
# Copy qbideas-migration.tar.gz to USB drive
# Transfer physically to new Mac
```

**Option C: Cloud Storage**
```bash
# Upload to Dropbox, Google Drive, etc.
# Download on new Mac
```

#### Step 3: Setup on New Mac

1. **Extract Migration Package**
   ```bash
   tar xzf qbideas-migration.tar.gz
   cd qbideas-migration
   ```

2. **Clone Repository**
   ```bash
   cd ..
   git clone <your-git-remote-url> qbideas
   cd qbideas
   ```

3. **Restore Environment Files**
   ```bash
   cp ../qbideas-migration/.env .
   cp ../qbideas-migration/.env.local frontend/
   ```

4. **Install Dependencies**
   ```bash
   npm install
   ```

5. **Start Docker Services**
   ```bash
   npm run dev
   # Wait 30 seconds
   ```

6. **Restore Database**
   ```bash
   # Copy SQL backup into container and restore
   docker cp ../qbideas-migration/qbideas_backup.sql qbideas-postgres:/tmp/
   docker exec qbideas-postgres psql -U qbideas -d qbideas -f /tmp/qbideas_backup.sql
   
   # Or run migrations if starting fresh
   npm run migrate
   ```

7. **Restore Docker Volumes (Optional)**
   ```bash
   # Stop services first
   npm run dev:down
   
   # Restore PostgreSQL volume
   docker run --rm -v qbideas_postgres_data:/data -v $(pwd)/../qbideas-migration:/backup \
     alpine tar xzf /backup/postgres_data.tar.gz -C /data
   
   # Restore Redis volume
   docker run --rm -v qbideas_redis_data:/data -v $(pwd)/../qbideas-migration:/backup \
     alpine tar xzf /backup/redis_data.tar.gz -C /data
   
   # Restore MinIO volume
   docker run --rm -v qbideas_minio_data:/data -v $(pwd)/../qbideas-migration:/backup \
     alpine tar xzf /backup/minio_data.tar.gz -C /data
   
   # Restart services
   npm run dev
   ```

8. **Start Frontend**
   ```bash
   npm run dev:frontend
   ```

---

### Method 3: Git + Manual Config (Simplest)

Best for when you don't need to preserve data.

#### On New Mac

1. **Install Prerequisites**
   ```bash
   # Install Docker Desktop from website
   # Install Node.js from website or via Homebrew
   brew install node@20
   ```

2. **Clone Repository**
   ```bash
   git clone <your-git-remote-url> qbideas
   cd qbideas
   ```

3. **Create Environment Files**
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   
   # Edit .env and add your API keys
   nano .env
   # Add: OPENAI_API_KEY, JWT_SECRET, etc.
   
   # Create frontend env
   echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > frontend/.env.local
   ```

4. **Install and Start**
   ```bash
   npm install
   npm run dev
   # Wait 30 seconds
   npm run migrate
   npm run seed:ideas
   ```

5. **Start Frontend**
   ```bash
   npm run dev:frontend
   ```

---

## Verification Checklist

After migration, verify everything works:

- [ ] Docker containers running: `docker ps`
- [ ] API health check: `curl http://localhost:3000/health`
- [ ] Database accessible: `docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT COUNT(*) FROM ideas;"`
- [ ] Redis accessible: `docker exec qbideas-redis redis-cli -a dev_password ping`
- [ ] MinIO accessible: http://localhost:9001 (admin/minioadmin123)
- [ ] Frontend loads: http://localhost:3002
- [ ] API returns ideas: http://localhost:3000/api/marketplace/ideas
- [ ] Can create/read data through frontend

## Troubleshooting

### Docker Issues

```bash
# Reset Docker completely
npm run dev:clean
docker system prune -a --volumes
npm run dev
```

### Port Conflicts

```bash
# Check what's using ports
lsof -i :3000  # API
lsof -i :3002  # Frontend
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill processes if needed
lsof -ti:3000 | xargs kill -9
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check logs
docker logs qbideas-postgres

# Restart PostgreSQL
docker restart qbideas-postgres
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm install
```

### Prisma Issues

```bash
cd services/api
npx prisma generate
npx prisma migrate deploy
```

## Network Transfer Scripts

### Quick Transfer Script (Same Subnet)

Save as `transfer-to-new-mac.sh` on old Mac:

```bash
#!/bin/bash
# Run on OLD Mac

echo "🚀 Preparing qbideas for migration..."

# Export database
echo "📦 Exporting database..."
docker exec qbideas-postgres pg_dump -U qbideas qbideas > qbideas_backup.sql

# Create migration package
echo "📦 Creating migration package..."
mkdir -p qbideas-migration
cp .env qbideas-migration/ 2>/dev/null || echo "No .env file"
cp frontend/.env.local qbideas-migration/ 2>/dev/null || echo "No frontend .env.local"
cp qbideas_backup.sql qbideas-migration/

# Create archive
tar czf qbideas-migration.tar.gz qbideas-migration/

echo "✅ Migration package ready: qbideas-migration.tar.gz"
echo ""
echo "📡 Starting HTTP server on port 8080..."
echo "On new Mac, run: curl -O http://$(ipconfig getifaddr en0):8080/qbideas-migration.tar.gz"
echo ""
python3 -m http.server 8080
```

### Quick Setup Script (New Mac)

Save as `setup-from-migration.sh` on new Mac:

```bash
#!/bin/bash
# Run on NEW Mac

echo "🚀 Setting up qbideas from migration..."

# Check prerequisites
command -v docker >/dev/null 2>&1 || { echo "❌ Docker not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js not installed"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ Git not installed"; exit 1; }

# Extract migration package
if [ -f "qbideas-migration.tar.gz" ]; then
    echo "📦 Extracting migration package..."
    tar xzf qbideas-migration.tar.gz
else
    echo "❌ qbideas-migration.tar.gz not found"
    exit 1
fi

# Clone repository
echo "📥 Cloning repository..."
read -p "Enter Git repository URL: " REPO_URL
git clone "$REPO_URL" qbideas
cd qbideas

# Restore environment files
echo "⚙️  Restoring environment files..."
cp ../qbideas-migration/.env . 2>/dev/null || echo "No .env to restore"
cp ../qbideas-migration/.env.local frontend/ 2>/dev/null || echo "No frontend .env to restore"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start services
echo "🐳 Starting Docker services..."
npm run dev

echo "⏳ Waiting for services to start..."
sleep 30

# Restore database
if [ -f "../qbideas-migration/qbideas_backup.sql" ]; then
    echo "💾 Restoring database..."
    docker cp ../qbideas-migration/qbideas_backup.sql qbideas-postgres:/tmp/
    docker exec qbideas-postgres psql -U qbideas -d qbideas -f /tmp/qbideas_backup.sql
else
    echo "🌱 Running migrations and seeding..."
    npm run migrate
    npm run seed:ideas
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "🚀 To start frontend, run: npm run dev:frontend"
echo "🌐 Frontend: http://localhost:3002"
echo "🔌 API: http://localhost:3000"
```

## Important Notes

### What Gets Migrated

✅ **Included:**
- Source code (via Git)
- Environment configuration (.env files)
- Database schema (via migrations)
- Database data (if using Method 2)
- Docker configuration (docker-compose.yml)
- Dependencies (reinstalled via npm)

❌ **Not Included:**
- node_modules (reinstalled)
- .next build cache (rebuilt)
- Docker images (re-downloaded)
- Local git history (if using fresh clone)

### Security Considerations

- **Never commit .env files** to Git
- Transfer .env files securely (encrypted USB, secure network)
- Regenerate JWT_SECRET for production
- Use test API keys for development
- Change default Docker passwords in production

### Performance Tips

- Use SSD on new Mac for better Docker performance
- Allocate sufficient RAM to Docker Desktop (8GB+ recommended)
- Enable Docker BuildKit for faster builds
- Use npm ci instead of npm install for faster installs

## Post-Migration Tasks

1. **Update Git Remote** (if changed)
   ```bash
   git remote set-url origin <new-remote-url>
   ```

2. **Verify All Services**
   ```bash
   docker ps
   npm run dev:logs
   ```

3. **Test API Endpoints**
   ```bash
   curl http://localhost:3000/health
   curl http://localhost:3000/api/marketplace/ideas
   ```

4. **Test Frontend**
   - Browse to http://localhost:3002
   - Check all pages load
   - Test API integration

5. **Clean Up Old Mac** (after verification)
   ```bash
   # On old Mac
   npm run dev:down
   docker system prune -a --volumes
   ```

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Review logs: `npm run dev:logs`
3. Check Docker status: `docker ps`
4. Verify environment files are correct
5. Ensure all prerequisites are installed

## Quick Reference

```bash
# Start everything
npm run dev && npm run dev:frontend

# Stop everything
npm run dev:down

# Reset everything
npm run dev:clean && npm run dev

# View logs
npm run dev:logs

# Database operations
npm run migrate
npm run seed:ideas
npm run db:reset

# Health checks
curl http://localhost:3000/health
curl http://localhost:3000/api/marketplace/ideas
```

---

**Estimated Migration Time:**
- Method 1 (Fresh): 15-20 minutes
- Method 2 (With Data): 30-45 minutes
- Method 3 (Git Only): 10-15 minutes

Good luck with your migration! 🚀
