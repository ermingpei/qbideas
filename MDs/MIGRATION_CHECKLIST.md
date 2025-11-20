# Migration Checklist

Use this checklist to ensure a smooth migration to your new Mac.

## Pre-Migration (Old Mac)

### Prerequisites Check
- [ ] Docker Desktop is running
- [ ] All services are up: `docker ps`
- [ ] Database has data: `docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT COUNT(*) FROM ideas;"`
- [ ] Git repository is up to date: `git status`
- [ ] All changes are committed or stashed

### Backup Creation
- [ ] Run backup script: `./scripts/transfer-to-new-mac.sh`
- [ ] Verify migration package created: `ls -lh qbideas-migration.tar.gz`
- [ ] Note your Git repository URL
- [ ] Save API keys from `.env` file (backup separately if needed)

### Optional: Export Docker Volumes
- [ ] Run: `./scripts/export-docker-volumes.sh`
- [ ] Verify exports in `docker-volumes-backup/` directory

---

## New Mac Setup

### Install Prerequisites
- [ ] Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- [ ] Install Node.js 20+ from https://nodejs.org/
- [ ] Verify installations:
  ```bash
  docker --version
  node --version
  npm --version
  git --version
  ```

### Transfer Files
Choose one method:

#### Option A: Network Transfer
- [ ] Old Mac: Start HTTP server with migration script
- [ ] New Mac: Download package: `curl -O http://OLD_MAC_IP:8080/qbideas-migration.tar.gz`
- [ ] Extract: `tar xzf qbideas-migration.tar.gz`

#### Option B: USB Drive
- [ ] Copy `qbideas-migration.tar.gz` to USB
- [ ] Transfer to new Mac
- [ ] Extract: `tar xzf qbideas-migration.tar.gz`

#### Option C: Cloud Storage
- [ ] Upload to Dropbox/Google Drive
- [ ] Download on new Mac
- [ ] Extract: `tar xzf qbideas-migration.tar.gz`

---

## Installation (New Mac)

### Automated Setup
- [ ] Run: `cd qbideas-migration && ./setup-on-new-mac.sh`
- [ ] Follow prompts
- [ ] Wait for completion

### OR Manual Setup

#### Clone Repository
- [ ] Clone: `git clone <repo-url> qbideas`
- [ ] Enter directory: `cd qbideas`

#### Restore Configuration
- [ ] Copy `.env` file to project root
- [ ] Copy `env.local.frontend` to `frontend/.env.local`
- [ ] Verify API keys are present in `.env`

#### Install Dependencies
- [ ] Run: `npm install`
- [ ] Wait for completion (may take 5-10 minutes)

#### Start Services
- [ ] Run: `npm run dev`
- [ ] Wait 30 seconds for services to initialize
- [ ] Verify: `docker ps` shows all containers running

#### Setup Database
Choose one:

**Option A: Restore from Backup**
- [ ] Copy backup SQL file to project
- [ ] Run: `./scripts/restore-database.sh backups/qbideas_backup_*.sql`

**Option B: Fresh Database**
- [ ] Run migrations: `npm run migrate`
- [ ] Seed data: `npm run seed:ideas`

#### Import Docker Volumes (Optional)
- [ ] Copy `docker-volumes-backup/` to project
- [ ] Run: `./scripts/import-docker-volumes.sh`
- [ ] Restart services: `npm run dev:down && npm run dev`

#### Start Frontend
- [ ] Open new terminal
- [ ] Run: `npm run dev:frontend`
- [ ] Wait for "Ready on http://localhost:3002"

---

## Verification

### Docker Services
- [ ] Check running containers: `docker ps`
- [ ] Should see:
  - qbideas-postgres
  - qbideas-redis
  - qbideas-minio
  - qbideas-mailhog
  - qbideas-api

### API Health
- [ ] Test health endpoint: `curl http://localhost:3000/health`
- [ ] Should return: `{"status":"ok"}`
- [ ] Test ideas endpoint: `curl http://localhost:3000/api/marketplace/ideas`
- [ ] Should return JSON array of ideas

### Database
- [ ] Connect to database:
  ```bash
  docker exec -it qbideas-postgres psql -U qbideas -d qbideas
  ```
- [ ] Check tables: `\dt`
- [ ] Check ideas count: `SELECT COUNT(*) FROM ideas;`
- [ ] Exit: `\q`

### Redis
- [ ] Test Redis: `docker exec qbideas-redis redis-cli -a dev_password ping`
- [ ] Should return: `PONG`

### MinIO
- [ ] Open: http://localhost:9001
- [ ] Login: minioadmin / minioadmin123
- [ ] Verify buckets exist

### Frontend
- [ ] Open: http://localhost:3002
- [ ] Homepage loads correctly
- [ ] Navigate to ideas page
- [ ] Ideas display correctly
- [ ] Filters work
- [ ] Search works

### API Documentation
- [ ] Open: http://localhost:3000/docs
- [ ] Swagger UI loads
- [ ] Can test endpoints

### Email Testing
- [ ] Open: http://localhost:8025
- [ ] Mailhog UI loads

---

## Functional Testing

### Browse Ideas
- [ ] Visit http://localhost:3002/ideas
- [ ] Ideas load and display
- [ ] Pagination works
- [ ] Filters work (category, difficulty, etc.)
- [ ] Search functionality works

### Idea Details
- [ ] Click on an idea
- [ ] Detail page loads
- [ ] All sections display correctly
- [ ] Like button works (if implemented)
- [ ] Bookmark button works (if implemented)

### User Features (if implemented)
- [ ] Registration works
- [ ] Login works
- [ ] Dashboard accessible
- [ ] Profile page works

### API Endpoints
Test key endpoints:
- [ ] GET /api/marketplace/ideas
- [ ] GET /api/marketplace/ideas/:id
- [ ] GET /api/marketplace/categories
- [ ] GET /api/marketplace/trending
- [ ] POST /api/marketplace/ideas/:id/like (if auth implemented)

---

## Performance Check

### Response Times
- [ ] Homepage loads in < 2 seconds
- [ ] Ideas page loads in < 2 seconds
- [ ] API responds in < 500ms
- [ ] Database queries are fast

### Resource Usage
- [ ] Check Docker Desktop resource usage
- [ ] CPU usage reasonable (< 50% idle)
- [ ] Memory usage reasonable (< 4GB)
- [ ] Disk space sufficient

---

## Configuration Verification

### Environment Variables
- [ ] `.env` file exists in root
- [ ] `frontend/.env.local` exists
- [ ] All required keys present:
  - DATABASE_URL
  - REDIS_URL
  - JWT_SECRET
  - OPENAI_API_KEY (if using AI features)
  - STRIPE_SECRET_KEY (if using payments)

### Git Configuration
- [ ] Git remote is correct: `git remote -v`
- [ ] Can pull latest changes: `git pull`
- [ ] Can push changes: `git push` (test with dummy commit)

### Docker Configuration
- [ ] Docker Desktop has sufficient resources allocated
  - Memory: 8GB+ recommended
  - CPUs: 4+ recommended
  - Disk: 20GB+ available
- [ ] Docker is set to start on login (optional)

---

## Post-Migration Tasks

### Development Setup
- [ ] Configure IDE/editor
- [ ] Install any editor extensions
- [ ] Set up debugging configuration
- [ ] Configure git hooks (if using)

### Documentation
- [ ] Update any local documentation with new paths
- [ ] Note any differences from old setup
- [ ] Document any issues encountered

### Team Communication (if applicable)
- [ ] Notify team of new development machine
- [ ] Update any shared documentation
- [ ] Update IP addresses in team docs (if relevant)

---

## Cleanup (Old Mac)

⚠️ **Only after verifying everything works on new Mac!**

### Stop Services
- [ ] Stop Docker services: `npm run dev:down`
- [ ] Verify containers stopped: `docker ps`

### Optional: Remove Data
- [ ] Remove Docker volumes: `docker volume rm $(docker volume ls -q | grep qbideas)`
- [ ] Remove Docker images: `docker rmi $(docker images -q | grep qbideas)`
- [ ] Clean Docker system: `docker system prune -a --volumes`

### Archive or Delete
- [ ] Archive project directory (if keeping backup)
- [ ] Or delete project directory (if confident in migration)
- [ ] Keep migration package as backup (optional)

---

## Troubleshooting Reference

### If Services Won't Start
```bash
npm run dev:clean
docker system prune -a --volumes
npm run dev
```

### If Database Connection Fails
```bash
docker restart qbideas-postgres
docker logs qbideas-postgres
```

### If Frontend Can't Connect to API
1. Check API is running: `curl http://localhost:3000/health`
2. Check CORS settings in `services/api/src/index.ts`
3. Verify `NEXT_PUBLIC_API_URL` in `frontend/.env.local`

### If Ports Are In Use
```bash
lsof -ti:3000 | xargs kill -9  # API
lsof -ti:3002 | xargs kill -9  # Frontend
lsof -ti:5432 | xargs kill -9  # PostgreSQL
lsof -ti:6379 | xargs kill -9  # Redis
```

### If Node Modules Issues
```bash
rm -rf node_modules package-lock.json
rm -rf frontend/node_modules frontend/package-lock.json
npm install
```

### If Prisma Issues
```bash
cd services/api
npx prisma generate
npx prisma migrate deploy
```

---

## Success Criteria

Migration is successful when:

✅ All Docker containers are running
✅ API health check returns OK
✅ Database is accessible and has data
✅ Frontend loads and displays correctly
✅ Can browse and view ideas
✅ All features work as expected
✅ No console errors
✅ Performance is acceptable

---

## Support

If you encounter issues:

1. Check this checklist for missed steps
2. Review [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
3. Check [MIGRATION_QUICK_START.md](MIGRATION_QUICK_START.md)
4. Review Docker logs: `npm run dev:logs`
5. Check individual service logs: `docker logs <container-name>`

---

## Estimated Time

- **Fresh Setup**: 15-20 minutes
- **With Data Migration**: 30-45 minutes
- **With Volume Migration**: 45-60 minutes

---

**Migration Date**: _______________

**Completed By**: _______________

**Notes**: 
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
