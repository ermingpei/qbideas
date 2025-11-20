# 🚀 Migration Documentation Index

Complete guide to migrating qbideas to a new Mac.

## 📖 Start Here

**New to migration?** Start with the Quick Start guide.  
**Want details?** Read the Complete Guide.  
**Need to track progress?** Use the Checklist.

## 📚 Documentation Files

### 1. 🎯 [MIGRATION_QUICK_START.md](MIGRATION_QUICK_START.md)
**Read this first** - Fast reference with 3 migration methods

**What's inside:**
- 3 migration methods with copy-paste commands
- Quick troubleshooting tips
- Service URLs reference
- 5-minute decision guide

**Best for:** Getting started quickly, choosing a method

---

### 2. 📘 [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
**Complete reference** - Detailed step-by-step instructions

**What's inside:**
- Method 1: Fresh Setup (cleanest)
- Method 2: With Data Migration (preserves data)
- Method 3: Git + Manual Config (simplest)
- Network transfer options
- Troubleshooting section
- Security considerations
- Performance tips

**Best for:** Understanding all options, detailed instructions

---

### 3. ✅ [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)
**Track your progress** - Comprehensive verification checklist

**What's inside:**
- Pre-migration checklist
- Installation steps
- Verification procedures
- Post-migration tasks
- Troubleshooting reference
- Success criteria

**Best for:** Ensuring nothing is missed, tracking progress

---

### 4. 📊 [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)
**Overview and navigation** - High-level summary

**What's inside:**
- Documentation overview
- Script descriptions
- Method comparison
- Quick commands
- Common issues
- Timeline estimates

**Best for:** Understanding the big picture, quick navigation

---

### 5. 🎨 [MIGRATION_VISUAL_GUIDE.md](MIGRATION_VISUAL_GUIDE.md)
**Visual reference** - Diagrams and flowcharts

**What's inside:**
- Migration process diagrams
- Architecture overview
- Method comparison charts
- Troubleshooting flowcharts
- Decision trees
- Timeline visualization

**Best for:** Visual learners, understanding the flow

---

### 6. 🛠️ [scripts/README.md](scripts/README.md)
**Script documentation** - Automation tools reference

**What's inside:**
- Script descriptions
- Usage examples
- Workflow guides
- Requirements
- Troubleshooting

**Best for:** Using automation scripts, understanding tools

---

### 7. 🔄 [MAC_TO_MAC_TRANSFER_GUIDE.md](MAC_TO_MAC_TRANSFER_GUIDE.md)
**File transfer methods** - Network transfer techniques

**What's inside:**
- 5 transfer methods compared
- Step-by-step instructions
- Speed comparisons
- Troubleshooting tips
- Security considerations
- Pro tips for large files

**Best for:** Understanding transfer options, same subnet transfers

---

## 🚀 Quick Start Paths

### Path 1: Fastest Migration (Same Network)
```bash
# 1. Read Quick Start
open MIGRATION_QUICK_START.md

# 2. On OLD Mac
./scripts/transfer-to-new-mac.sh

# 3. On NEW Mac
curl -O http://OLD_MAC_IP:8080/qbideas-migration.tar.gz
tar xzf qbideas-migration.tar.gz && cd qbideas-migration
./setup-on-new-mac.sh

# 4. Verify with Checklist
open MIGRATION_CHECKLIST.md
```

### Path 2: Fresh Start (No Data)
```bash
# 1. Read Quick Start - Method 2
open MIGRATION_QUICK_START.md

# 2. On NEW Mac
git clone <repo-url> qbideas && cd qbideas
cp .env.example .env
# Edit .env
npm install && npm run dev
sleep 30 && npm run migrate && npm run seed:ideas
npm run dev:frontend

# 3. Verify
curl http://localhost:3000/health
open http://localhost:3002
```

### Path 3: Manual Control (Full Data)
```bash
# 1. Read Complete Guide - Method 2
open MIGRATION_GUIDE.md

# 2. Follow detailed steps
# 3. Use Checklist to track
open MIGRATION_CHECKLIST.md
```

---

## 🎯 Choose Your Documentation

### I want to...

**Get started quickly**
→ [MIGRATION_QUICK_START.md](MIGRATION_QUICK_START.md)

**Understand all options**
→ [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)

**Track my progress**
→ [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)

**See the big picture**
→ [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

**Understand visually**
→ [MIGRATION_VISUAL_GUIDE.md](MIGRATION_VISUAL_GUIDE.md)

**Use automation scripts**
→ [scripts/README.md](scripts/README.md)

**Troubleshoot issues**
→ All docs have troubleshooting sections

---

## 🛠️ Available Scripts

Located in `scripts/` directory:

| Script | Purpose | Run On |
|--------|---------|--------|
| `transfer-to-new-mac.sh` | Complete migration package | OLD Mac |
| `backup-database.sh` | Backup PostgreSQL | OLD Mac |
| `restore-database.sh` | Restore database | NEW Mac |
| `export-docker-volumes.sh` | Export volumes | OLD Mac |
| `import-docker-volumes.sh` | Import volumes | NEW Mac |

**Documentation:** [scripts/README.md](scripts/README.md)

---

## 📊 Method Comparison

| Method | Time | Complexity | Data | Network |
|--------|------|------------|------|---------|
| **Automated** | 20-30 min | ⭐ Easy | ✅ Yes | Same subnet |
| **Fresh Setup** | 15-20 min | ⭐ Easy | ❌ No | Any |
| **Manual** | 30-45 min | ⭐⭐⭐ Advanced | ✅ Yes | Any |

**Details:** [MIGRATION_SUMMARY.md](MIGRATION_SUMMARY.md)

---

## ✅ Success Criteria

Your migration is successful when:

- [ ] All Docker containers running
- [ ] API health check passes
- [ ] Database accessible with data
- [ ] Frontend loads correctly
- [ ] All features work
- [ ] No errors in console

**Full checklist:** [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md)

---

## 🆘 Common Issues

### Services won't start
```bash
npm run dev:clean
docker system prune -a --volumes
npm run dev
```

### Port conflicts
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Database issues
```bash
docker restart qbideas-postgres
docker logs qbideas-postgres
```

**More solutions:** See troubleshooting sections in each guide

---

## 📅 Estimated Timeline

| Phase | Time | Description |
|-------|------|-------------|
| Preparation | 5-10 min | Backup and package |
| Transfer | 5-15 min | Move files |
| Setup | 10-20 min | Install and configure |
| Verification | 5-10 min | Test everything |
| **Total** | **25-55 min** | Complete migration |

---

## 🎓 Learning Path

### Beginner
1. Read [MIGRATION_QUICK_START.md](MIGRATION_QUICK_START.md)
2. Choose Method 1 (Automated) or Method 2 (Fresh)
3. Follow step-by-step
4. Use [MIGRATION_CHECKLIST.md](MIGRATION_CHECKLIST.md) to verify

### Intermediate
1. Read [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
2. Choose method based on needs
3. Understand each step
4. Customize as needed

### Advanced
1. Review all documentation
2. Choose Method 3 (Manual) for full control
3. Customize scripts
4. Optimize for your workflow

---

## 📞 Support Resources

### Documentation
- [README.md](README.md) - Project overview
- [SETUP.md](SETUP.md) - Initial setup guide
- [docker-compose.yml](docker-compose.yml) - Service configuration

### Logs and Debugging
```bash
# View all logs
npm run dev:logs

# View specific container
docker logs qbideas-postgres
docker logs qbideas-api

# Check container status
docker ps
docker ps -a
```

### Health Checks
```bash
# API
curl http://localhost:3000/health

# Database
docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT 1;"

# Redis
docker exec qbideas-redis redis-cli -a dev_password ping
```

---

## 🔄 Migration Workflow

```
1. PREPARE (Old Mac)
   ├── Read documentation
   ├── Choose method
   ├── Run backup scripts
   └── Note configuration

2. TRANSFER
   ├── Create package
   ├── Transfer files
   └── Verify transfer

3. SETUP (New Mac)
   ├── Install prerequisites
   ├── Clone repository
   ├── Restore configuration
   └── Start services

4. VERIFY
   ├── Check services
   ├── Test API
   ├── Test frontend
   └── Run tests

5. CLEANUP (Old Mac)
   ├── Verify new setup
   ├── Stop services
   └── Archive/delete
```

---

## 🎯 Quick Commands Reference

### On OLD Mac
```bash
# Complete migration package
./scripts/transfer-to-new-mac.sh

# Database backup only
./scripts/backup-database.sh

# Volume export
./scripts/export-docker-volumes.sh
```

### On NEW Mac
```bash
# Automated setup
cd qbideas-migration && ./setup-on-new-mac.sh

# Manual setup
git clone <repo> && cd qbideas
npm install && npm run dev
npm run migrate && npm run seed:ideas
npm run dev:frontend
```

### Verification
```bash
docker ps
curl http://localhost:3000/health
open http://localhost:3002
```

---

## 📝 Documentation Maintenance

### Updating Documentation
- Keep all guides in sync
- Update version numbers
- Test all commands
- Add new troubleshooting tips

### Contributing
- Document issues encountered
- Suggest improvements
- Update for new macOS versions
- Add new migration methods

---

## 🔗 External Resources

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Technologies
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [PostgreSQL](https://www.postgresql.org/)
- [Redis](https://redis.io/)

---

## 📊 Documentation Stats

- **Total Guides**: 6
- **Total Scripts**: 5
- **Migration Methods**: 3
- **Estimated Time**: 25-55 minutes
- **Success Rate**: High (with proper following)

---

## 🎉 After Migration

Once migration is complete:

1. ✅ Verify all services work
2. ✅ Test development workflow
3. ✅ Configure IDE/editor
4. ✅ Update git configuration
5. ✅ Clean up old Mac
6. ✅ Document any issues
7. ✅ Update team (if applicable)

---

## 📌 Quick Links

- [Quick Start](MIGRATION_QUICK_START.md) - Fast reference
- [Complete Guide](MIGRATION_GUIDE.md) - Detailed instructions
- [Checklist](MIGRATION_CHECKLIST.md) - Track progress
- [Summary](MIGRATION_SUMMARY.md) - Overview
- [Visual Guide](MIGRATION_VISUAL_GUIDE.md) - Diagrams
- [Scripts](scripts/README.md) - Automation tools
- [Main README](README.md) - Project overview
- [Setup Guide](SETUP.md) - Initial setup

---

**Last Updated**: November 5, 2025  
**Version**: 1.0  
**Tested On**: macOS (Apple Silicon & Intel)  
**Maintained By**: qbideas Team

---

## 🚀 Ready to Migrate?

1. Choose your path above
2. Open the relevant documentation
3. Follow the steps
4. Use the checklist to verify
5. Enjoy your new setup!

**Good luck with your migration!** 🎉
