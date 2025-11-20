# 🔧 Troubleshooting Guide

## "Failed to fetch" Error When Signing In

This means the API server isn't running or can't be reached.

### Quick Fix

```bash
./fix-and-start.sh
```

This script will:
1. Check if Docker is running
2. Start database services
3. Start API server
4. Start Frontend
5. Verify everything works

### Manual Fix

#### Step 1: Start Docker Desktop
**This is the most common issue!**

1. Open the **Docker Desktop** application
2. Wait for it to fully start (whale icon appears in menu bar)
3. Verify: `docker ps` should work without errors

#### Step 2: Start Database
```bash
docker-compose up -d
sleep 10
```

#### Step 3: Start API
```bash
cd services/api
npm run dev
```

Wait for these messages:
```
✅ Database connected successfully
✅ Redis connected successfully
🚀 API Server running on port 3000
```

#### Step 4: Start Frontend (New Terminal)
```bash
cd frontend
npm run dev
```

Wait for:
```
✓ Ready
○ Local: http://localhost:3002
```

### Verify It's Working

```bash
# Test API
curl http://localhost:3000/health

# Should return: {"status":"ok",...}
```

If you see this, the API is working!

## Common Issues

### 1. Docker Not Running
**Error**: `Cannot connect to the Docker daemon`

**Solution**:
```bash
# Open Docker Desktop
open -a Docker

# Wait 30 seconds, then try again
```

### 2. Port Already in Use
**Error**: `EADDRINUSE: address already in use :::3000`

**Solution**:
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3002
lsof -ti:3002 | xargs kill -9

# Then restart services
```

### 3. Database Connection Failed
**Error**: `Can't reach database server at localhost:5432`

**Solution**:
```bash
# Restart Docker services
docker-compose down
docker-compose up -d
sleep 15

# Then restart API
cd services/api
npm run dev
```

### 4. API Crashes on Start
**Check logs**:
```bash
# If running in background
tail -f api.log

# Look for errors
```

**Common causes**:
- Database not ready (wait longer)
- Port in use (kill process)
- Missing dependencies (run `npm install`)

### 5. Frontend Can't Connect to API
**Error**: `Failed to fetch` in browser console

**Check**:
```bash
# Is API running?
curl http://localhost:3000/health

# Is Frontend using correct URL?
# Check: frontend/.env.local
# Should have: NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 6. CORS Errors
**Error**: `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution**:
- API should already have CORS configured
- Check `services/api/src/index.ts` has:
  ```typescript
  app.use(cors({
    origin: 'http://localhost:3002',
    credentials: true,
  }))
  ```

## Diagnostic Commands

### Check What's Running
```bash
# Check Docker containers
docker ps

# Check API port
lsof -i:3000

# Check Frontend port
lsof -i:3002

# Check all processes
ps aux | grep node
```

### View Logs
```bash
# API logs (if running in background)
tail -f api.log

# Frontend logs (if running in background)
tail -f frontend.log

# Docker logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

### Test Connections
```bash
# Test API health
curl http://localhost:3000/health

# Test API auth endpoint
curl http://localhost:3000/api/auth/verify-token

# Test Frontend
curl http://localhost:3002
```

## Complete Reset

If nothing works, do a complete reset:

```bash
# 1. Stop everything
killall node
docker-compose down

# 2. Clean up
rm -f api.log frontend.log

# 3. Start fresh
docker-compose up -d
sleep 15

# 4. Start API
cd services/api
npm run dev

# 5. Start Frontend (new terminal)
cd frontend
npm run dev
```

## Environment Variables

### API (.env in services/api)
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/qbideas
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
API_PORT=3000
```

### Frontend (.env.local in frontend)
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Still Not Working?

### Check These:
1. ✅ Docker Desktop is running
2. ✅ Docker containers are healthy: `docker ps`
3. ✅ Ports 3000 and 3002 are free
4. ✅ Database is accessible: `docker-compose logs postgres`
5. ✅ No errors in API logs
6. ✅ No errors in Frontend logs

### Get Help:
1. Check API logs: `tail -f api.log`
2. Check Frontend logs: `tail -f frontend.log`
3. Check Docker logs: `docker-compose logs`
4. Look for error messages
5. Try the complete reset above

## Quick Reference

### Start Everything
```bash
./fix-and-start.sh
```

### Stop Everything
```bash
# Stop processes (if you have PIDs)
kill <API_PID> <FRONTEND_PID>

# Or kill all node processes
killall node

# Stop Docker
docker-compose down
```

### Restart Everything
```bash
# Stop
killall node
docker-compose down

# Start
./fix-and-start.sh
```

---

**Most Common Solution**: Make sure Docker Desktop is running, then run `./fix-and-start.sh`
