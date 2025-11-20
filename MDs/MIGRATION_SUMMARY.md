# Migration Documentation Summary

Complete migration solution for moving qbideas to a new Mac.

## 📚 Documentation Files

### 1. [MIGRATION_QUICK_START.md](MIGRATION_QUICK_START.md)
**Best for**: Quick reference, choosing a method
- 3 migration methods with commands
- Quick troubleshooting
- Service URLs reference
- **Start here** if you want to get moving fast

### 2. [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
**Best for**: Detailed instructions, understanding options
- Complete step-by-step guide
- 3 detailed migration methods
- Network transfer options
- Troubleshooting section
- Best practices
- **Read this** for comprehensive understanding

### 3. [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)
**Best for**: Ensuring nothing is missed
- Pre-migration checklist
- Installation checklist
- Verification checklist
- Post-migration tasks
- **Use this** to track your progress

### 4. [scripts/README.md](scripts/README.md)
**Best for**: Understanding automation scripts
- Script descriptions
- Usage examples
- Workflow guides
- Troubleshooting
- **Reference this** when using scripts

## 🛠️ Migration Scripts

All scripts are in the `scripts/` directory and are executable.

### Main Scripts

| Script | Purpose | Run On |
|--------|---------|--------|
| `transfer-to-new-mac.sh` | Complete migration package creator | OLD Mac |
| `backup-database.sh` | Backup PostgreSQL database | OLD Mac |
| `restore-database.sh` | Restore database from backup | NEW Mac |
| `export-docker-volumes.sh` | Export all Docker volumes | OLD Mac |
| `import-docker-volumes.sh` | Import Docker volumes | NEW Mac |

### Quick Commands

```bash
# On OLD Mac - Create migration package
./scripts/transfer-to-new-mac.sh

# On OLD Mac - Backup database only
./scripts/backup-database.sh

# On OLD Mac - Export volumes
./scripts/export-docker-volumes.sh

# On NEW Mac - Restore database
./scripts/restore-database.sh backups/qbideas_backup_*.sql

# On NEW Mac - Import volumes
./scripts/import-docker-volumes.sh
```

## 🎯 Choose Your Method

### Method 1: Automated Transfer (Recommended)
**Time**: 20-30 minutes  
**Complexity**: Low  
**Data Preserved**: Yes  

**When to use**: Same subnet, want easiest option

```bash
# OLD Mac
./scripts/transfer-to-new-mac.sh

# NEW Mac
curl -O http://OLD_MAC_IP:8080/qbideas-migration.tar.gz
tar xzf qbideas-migration.tar.gz && cd qbideas-migration
./setup-on-new-mac.sh
```

### Method 2: Fresh Setup
**Time**: 15-20 minutes  
**Complexity**: Low  
**Data Preserved**: No (uses seed data)  

**When to use**: Don't need existing data, want clean start

```bash
# NEW Mac only
git clone <repo-url> qbideas && cd qbideas
cp .env.example .env
# Edit .env with your keys
npm install && npm run dev
sleep 30 && npm run migrate && npm run seed:ideas
npm run dev:frontend
```

### Method 3: Manual Migration
**Time**: 30-45 minutes  
**Complexity**: Medium  
**Data Preserved**: Yes (full control)  

**When to use**: Want full control, different network, USB transfer

See [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md) Method 2 for details.

## 📋 Migration Workflow

### Phase 1: Preparation (Old Mac)
1. ✅ Verify current setup works
2. ✅ Commit/push all code changes
3. ✅ Run migration script or backup manually
4. ✅ Note API keys and configuration

### Phase 2: Transfer
1. ✅ Choose transfer method (network/USB/cloud)
2. ✅ Transfer migration package
3. ✅ Verify files transferred correctly

### Phase 3: Setup (New Mac)
1. ✅ Install prerequisites (Docker, Node.js)
2. ✅ Clone repository
3. ✅ Restore configuration
4. ✅ Install dependencies
5. ✅ Start services

### Phase 4: Verification
1. ✅ Check Docker containers
2. ✅ Test API endpoints
3. ✅ Verify database
4. ✅ Test frontend
5. ✅ Run functional tests

### Phase 5: Cleanup (Old Mac)
1. ✅ Verify new setup works completely
2. ✅ Stop old services
3. ✅ Archive or delete old setup

## ✅ Success Criteria

Your migration is successful when:

- [ ] All Docker containers running (`docker ps`)
- [ ] API health check passes (`curl http://localhost:3000/health`)
- [ ] Database accessible with data
- [ ] Frontend loads at http://localhost:3002
- [ ] Can browse and view ideas
- [ ] All features work as expected
- [ ] No console errors
- [ ] Performance is good

## 🆘 Common Issues

### Issue: Port already in use
```bash
lsof -ti:3000 | xargs kill -9  # API
lsof -ti:3002 | xargs kill -9  # Frontend
```

### Issue: Docker containers won't start
```bash
npm run dev:clean
docker system prune -a --volumes
npm run dev
```

### Issue: Database connection fails
```bash
docker restart qbideas-postgres
docker logs qbideas-postgres
```

### Issue: Frontend can't connect to API
1. Check API: `curl http://localhost:3000/health`
2. Check `frontend/.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:3000`
3. Check CORS in `services/api/src/index.ts`

### Issue: Prisma errors
```bash
cd services/api
npx prisma generate
npx prisma migrate deploy
```

## 📊 What Gets Migrated

### ✅ Included
- Source code (via Git)
- Database schema (via migrations)
- Database data (if using backup/restore)
- Docker volumes (if exported)
- Environment configuration
- Dependencies (reinstalled)

### ❌ Not Included
- node_modules (reinstalled fresh)
- .next build cache (rebuilt)
- Docker images (re-downloaded)
- IDE configuration (manual)
- Git history (if using fresh clone)

## 🔒 Security Notes

- Never commit `.env` files to Git
- Transfer `.env` securely (encrypted USB or secure network)
- Regenerate `JWT_SECRET` for production
- Use test API keys for development
- Change default Docker passwords in production
- Review and update API keys on new machine

## 📈 Performance Tips

- Use SSD on new Mac for better Docker performance
- Allocate 8GB+ RAM to Docker Desktop
- Allocate 4+ CPUs to Docker Desktop
- Enable Docker BuildKit for faster builds
- Use `npm ci` instead of `npm install` for faster installs
- Close unnecessary applications during migration

## 🎓 Learning Resources

### Docker
- [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- [Docker Compose](https://docs.docker.com/compose/)

### Node.js
- [Node.js Downloads](https://nodejs.org/)
- [npm Documentation](https://docs.npmjs.com/)

### Project Specific
- [SETUP.md](SETUP.md) - Initial setup guide
- [README.md](README.md) - Project overview
- [docker-compose.yml](docker-compose.yml) - Service configuration

## 📞 Support

If you encounter issues:

1. **Check Documentation**
   - Review relevant migration guide
   - Check troubleshooting sections
   - Review checklist for missed steps

2. **Check Logs**
   ```bash
   npm run dev:logs
   docker logs <container-name>
   ```

3. **Verify Prerequisites**
   ```bash
   docker --version
   node --version
   npm --version
   ```

4. **Reset and Retry**
   ```bash
   npm run dev:clean
   docker system prune -a --volumes
   npm run dev
   ```

## 🚀 Quick Start Commands

### On OLD Mac
```bash
# Create complete migration package
./scripts/transfer-to-new-mac.sh

# Or just backup database
./scripts/backup-database.sh
```

### On NEW Mac
```bash
# Automated setup (if using transfer script)
cd qbideas-migration && ./setup-on-new-mac.sh

# Or manual setup
git clone <repo-url> qbideas && cd qbideas
npm install && npm run dev
sleep 30 && npm run migrate && npm run seed:ideas
npm run dev:frontend
```

### Verification
```bash
# Check services
docker ps
curl http://localhost:3000/health
open http://localhost:3002

# Check database
docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT COUNT(*) FROM ideas;"
```

## 📅 Estimated Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Preparation | 5-10 min | Backup and package creation |
| Transfer | 5-15 min | Depends on method and file size |
| Setup | 10-20 min | Install and configure |
| Verification | 5-10 min | Test everything works |
| **Total** | **25-55 min** | Complete migration |

## 🎯 Next Steps After Migration

1. **Update Git Configuration**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your@email.com"
   ```

2. **Configure IDE**
   - Install extensions
   - Set up debugging
   - Configure linting

3. **Test Development Workflow**
   - Make a small change
   - Test hot reload
   - Commit and push

4. **Update Documentation**
   - Note any differences
   - Document any issues
   - Update team docs if applicable

5. **Clean Up Old Mac**
   - Stop services
   - Archive or delete
   - Keep backups temporarily

## 📝 Feedback

If you find issues with the migration process or documentation:
- Note what was unclear
- Document any missing steps
- Suggest improvements
- Update documentation for next time

---

**Last Updated**: November 5, 2025  
**Version**: 1.0  
**Tested On**: macOS (Apple Silicon & Intel)

---

## Quick Navigation

- [Quick Start Guide](MIGRATION_QUICK_START.md)
- [Complete Guide](MIGRATION_GUIDE.md)
- [Checklist](MIGRATION_CHECKLIST.md)
- [Scripts Documentation](scripts/README.md)
- [Main README](README.md)
- [Setup Guide](SETUP.md)
