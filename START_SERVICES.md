# 🚀 How to Start All Services

## Prerequisites

### 1. Start Docker Desktop
**IMPORTANT**: Docker must be running first!

1. Open **Docker Desktop** application
2. Wait for it to fully start (whale icon in menu bar)
3. Verify it's running: `docker ps` should work

## Quick Start (Automated)

```bash
# Run this single command to start everything
./start-all-services.sh
```

## Manual Start (Step by Step)

### Step 1: Start Docker Services
```bash
# Start database, Redis, etc.
docker-compose up -d

# Wait for services to be healthy (about 10-15 seconds)
sleep 15

# Verify containers are running
docker ps
```

You should see:
- `qbideas-postgres` (database)
- `qbideas-redis` (cache)
- `qbideas-mailhog` (email testing)
- `qbideas-minio` (file storage)

### Step 2: Start API Server
```bash
cd services/api
npm run dev
```

Wait for:
```
✅ Database connected successfully
✅ Redis connected successfully
🚀 API Server running on port 3000
```

### Step 3: Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
```

Wait for:
```
✓ Ready in X ms
○ Local: http://localhost:3002
```

## Verify Everything is Running

### Check Services
```bash
# Check API
curl http://localhost:3000/health

# Check Frontend
curl http://localhost:3002

# Check Docker containers
docker ps
```

### Test Features
```bash
# Test interactions
./test-interactions.sh

# Test idea submission
./test-idea-submission.sh
```

## Access URLs

- **Frontend**: http://localhost:3002
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **MailHog** (email testing): http://localhost:8025
- **MinIO** (file storage): http://localhost:9001

## Troubleshooting

### Docker Not Running
**Error**: `Cannot connect to the Docker daemon`
**Solution**: Start Docker Desktop application

### Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3000`
**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port in .env
```

### Database Connection Failed
**Error**: `Can't reach database server at localhost:5432`
**Solution**:
```bash
# Restart Docker containers
docker-compose down
docker-compose up -d
sleep 15

# Then restart API
```

### Frontend Won't Start
**Error**: Port 3002 in use
**Solution**:
```bash
# Kill process on port 3002
lsof -ti:3002 | xargs kill -9
```

## Stop All Services

### Stop Everything
```bash
# Stop API (Ctrl+C in terminal)
# Stop Frontend (Ctrl+C in terminal)

# Stop Docker containers
docker-compose down
```

### Stop and Clean
```bash
# Stop and remove all data
docker-compose down -v

# This will delete all database data!
```

## Common Commands

### Restart API
```bash
cd services/api
npm run dev
```

### Restart Frontend
```bash
cd frontend
npm run dev
```

### Restart Docker
```bash
docker-compose restart
```

### View Logs
```bash
# API logs (in API terminal)
# Frontend logs (in Frontend terminal)

# Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Database Commands
```bash
cd services/api

# Run migrations
npm run migrate

# Seed database
npm run seed:ideas

# Reset database
npm run migrate:reset
```

## Development Workflow

### Daily Startup
1. Start Docker Desktop
2. Run `docker-compose up -d`
3. Run `cd services/api && npm run dev`
4. Run `cd frontend && npm run dev` (new terminal)
5. Open http://localhost:3002

### Daily Shutdown
1. Ctrl+C in API terminal
2. Ctrl+C in Frontend terminal
3. Run `docker-compose down`
4. Close Docker Desktop (optional)

## Quick Reference

```bash
# Start everything
docker-compose up -d && sleep 15
cd services/api && npm run dev &
cd frontend && npm run dev &

# Stop everything
docker-compose down
killall node

# Check status
docker ps
lsof -i:3000
lsof -i:3002
```

## Need Help?

1. Check Docker Desktop is running
2. Check all ports are free (3000, 3002, 5432, 6379)
3. Check logs for errors
4. Try restarting services
5. Try `docker-compose down && docker-compose up -d`

---

**Ready to start?** Make sure Docker Desktop is running, then run:
```bash
./start-all-services.sh
```
