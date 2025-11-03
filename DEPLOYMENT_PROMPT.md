# Complete Deployment Prompt for qbideas Platform

## Context

I have a Node.js/TypeScript project called **qbideas** - an AI-powered idea marketplace platform. The project structure is already created with all necessary files, but I need help completing the deployment to an AlmaLinux server.

## Current Situation

**What's Done:**
- ✅ Complete project structure created locally
- ✅ All source code files written (API service, shared utilities, database schema)
- ✅ Docker Compose configuration ready
- ✅ Deployment scripts created
- ✅ Project files copied to AlmaLinux server at `/home/almalinux/qbideas`
- ✅ Docker and Node.js installed on the server
- ✅ Shared package built successfully
- ✅ Infrastructure services (PostgreSQL, Redis, MinIO, Mailhog) are running

**Current Issue:**
- ❌ Prisma migrations failing because DATABASE_URL environment variable is not being found
- ❌ Need to complete database setup and start application services

## Server Details

- **Host:** 206.12.95.60
- **User:** almalinux
- **Project Directory:** /home/almalinux/qbideas
- **Docker Compose Command:** `docker compose` (not `docker-compose`)
- **OS:** AlmaLinux

## What Needs to Be Done

1. **Fix Prisma Environment Variable Issue:**
   - The .env file exists at `/home/almalinux/qbideas/.env`
   - Contains: `DATABASE_URL=postgresql://qbideas:dev_password@postgres:5432/qbideas`
   - But Prisma commands in `/home/almalinux/qbideas/services/api` can't find it
   - Need to run: `npx prisma generate`, `npx prisma migrate dev --name init`, and seed script

2. **Complete Database Setup:**
   - PostgreSQL is running in Docker (accessible at localhost:5432)
   - Database name: qbideas
   - Username: qbideas
   - Password: dev_password
   - Need to run migrations and seed data

3. **Start Application Services:**
   - Start api-service and auth-service containers
   - Verify they're running and healthy
   - Test API endpoints

4. **Configure Firewall:**
   - Open ports: 3000-3003, 8000, 8025, 9001

## Project Structure

```
/home/almalinux/qbideas/
├── services/
│   ├── api/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── routes/
│   │   │   ├── middleware/
│   │   │   └── scripts/
│   │   │       └── seed.ts
│   │   └── package.json
│   └── shared/
│       ├── dist/ (built)
│       └── src/
├── docker-compose.yml
├── .env
└── scripts/
    └── direct-prisma-setup.sh
```

## Key Commands to Run

**SSH to server:**
```bash
ssh almalinux@206.12.95.60
cd /home/almalinux/qbideas
```

**Check running services:**
```bash
docker compose ps
```

**Run Prisma commands with explicit DATABASE_URL:**
```bash
cd services/api
DATABASE_URL='postgresql://qbideas:dev_password@localhost:5432/qbideas' npx prisma generate
DATABASE_URL='postgresql://qbideas:dev_password@localhost:5432/qbideas' npx prisma migrate dev --name init
DATABASE_URL='postgresql://qbideas:dev_password@localhost:5432/qbideas' npx tsx src/scripts/seed.ts
```

**Start application services:**
```bash
cd /home/almalinux/qbideas
docker compose up -d api-service auth-service
```

**Test API:**
```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/ideas
```

## Expected Outcome

When complete, the following should be accessible:
- API: http://206.12.95.60:3000
- API Health: http://206.12.95.60:3000/health
- API Docs: http://206.12.95.60:3000/docs
- Ideas Endpoint: http://206.12.95.60:3000/api/ideas
- Mailhog: http://206.12.95.60:8025

Test accounts should be created:
- admin@qbideas.com / admin123
- john@example.com / password123
- sarah@example.com / password123

## Files Available

There's a deployment script at `/home/almalinux/qbideas/scripts/direct-prisma-setup.sh` that attempts to do this, but you can run commands manually if needed.

## Your Task

Please help me:
1. SSH to the AlmaLinux server (206.12.95.60 as user almalinux)
2. Navigate to /home/almalinux/qbideas
3. Fix the Prisma environment variable issue and run migrations
4. Seed the database with test data
5. Start the application services
6. Verify everything is working
7. Configure the firewall
8. Provide me with the final status and URLs to access the application

## Additional Notes

- The project uses TypeScript, Node.js 20, PostgreSQL 15, Redis 7
- Docker Compose v2 syntax (use `docker compose` not `docker-compose`)
- All dependencies are already installed
- The shared package is already built
- Infrastructure services (postgres, redis, minio, mailhog) are already running

## Troubleshooting Tips

If Prisma can't find DATABASE_URL:
- Try running commands with explicit DATABASE_URL: `DATABASE_URL='postgresql://...' npx prisma ...`
- Check if .env file exists: `cat /home/almalinux/qbideas/.env`
- Verify PostgreSQL is accessible: `docker compose exec postgres psql -U qbideas -d qbideas -c 'SELECT 1;'`

If services won't start:
- Check logs: `docker compose logs api-service`
- Verify .env file is in the right location
- Ensure all dependencies are installed: `cd services/api && npm install`

---

**Start by SSHing to the server and running the commands step by step. Let me know the output of each command so we can troubleshoot if needed.**