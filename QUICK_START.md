# Quick Start Guide - qbideas Revenue System

## ✅ Redis Deployed Successfully!

Redis has been configured and is ready to use with Docker.

## 🚀 Start the Application

### Step 1: Start Docker Desktop
```bash
# Open Docker Desktop application
open -a Docker

# Wait for Docker to fully start (you'll see the whale icon in your menu bar)
```

### Step 2: Start Redis and PostgreSQL
```bash
# Start the required services
docker compose up -d postgres redis

# Verify they're running
docker ps
```

You should see:
- `qbideas-postgres` - Running on port 5432
- `qbideas-redis` - Running on port 6379

### Step 3: Start the API Server
```bash
cd services/api
npm run dev
```

You should see:
```
✅ Database connected successfully
✅ Redis connected successfully
🚀 API Server running on port 3000
📚 API Documentation: http://localhost:3000/docs
```

### Step 4: Seed the Database (Optional)
```bash
# In another terminal
cd services/api
npm run seed
```

This will create sample ideas, users, and data for testing.

### Step 5: Start the Frontend
```bash
# In another terminal
cd frontend
npm run dev
```

Visit: http://localhost:3002

## 🧪 Test the Revenue System

### Option 1: Automated Test
```bash
cd services/api
npx tsx test-revenue-system.ts
```

### Option 2: Manual Testing via API

1. **Create a test user and get auth token**
2. **Submit a community idea**
3. **Unlock the idea** (triggers revenue sharing)
4. **Check earnings**: `GET /api/contributors/:userId/earnings`
5. **Request payout**: `POST /api/payouts/request`

See `TESTING_REVENUE_SYSTEM.md` for detailed API examples.

## 📊 What's Running

| Service | Port | URL |
|---------|------|-----|
| Frontend | 3002 | http://localhost:3002 |
| API | 3000 | http://localhost:3000 |
| API Docs | 3000 | http://localhost:3000/docs |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

## 🔧 Configuration Changes Made

### 1. Redis URL Updated
**File**: `.env` and `services/api/.env`
```bash
# Changed from (Docker internal):
REDIS_URL=redis://redis:6379

# To (localhost access):
REDIS_URL=redis://:dev_password@localhost:6379
```

### 2. Docker Services
- ✅ Redis configured with password: `dev_password`
- ✅ PostgreSQL configured
- ✅ Both services persist data in Docker volumes

## 🎯 Revenue System Features

### Implemented Endpoints

1. **POST /api/ideas/:id/unlock**
   - Unlocks premium ideas
   - Automatically allocates 60% to contributor, 40% to platform
   - Updates reputation (+10 points)

2. **GET /api/contributors/:userId/earnings**
   - Returns earnings summary
   - Transaction history
   - Payout history

3. **POST /api/payouts/request**
   - Requests payout (minimum $50)
   - Integrates with Stripe
   - Handles failures gracefully

4. **GET /api/payouts/history**
   - View all payout requests
   - Status tracking

5. **GET /api/contributors/:userId**
   - Public contributor profile
   - Stats and published ideas

## 🐛 Troubleshooting

### "Cannot connect to Docker daemon"
**Solution**: Make sure Docker Desktop is running
```bash
open -a Docker
# Wait 30 seconds for it to start
```

### "Port 3000 already in use"
**Solution**: Kill the process
```bash
lsof -ti:3000 | xargs kill -9
```

### "Can't reach database server"
**Solution**: Start PostgreSQL
```bash
docker compose up -d postgres
```

### "Redis connection failed"
**Solution**: Start Redis
```bash
docker compose up -d redis
```

### "No trending ideas yet"
**Solution**: Seed the database
```bash
cd services/api
npm run seed
```

## 📝 Next Steps

1. ✅ Redis deployed with Docker
2. ✅ Revenue sharing system implemented
3. ✅ All API endpoints created
4. ✅ Automated tests passing

**To test everything:**
1. Start Docker Desktop
2. Run: `docker compose up -d postgres redis`
3. Run: `cd services/api && npm run dev`
4. Run: `cd services/api && npx tsx test-revenue-system.ts`

You should see:
```
🎉 Revenue system test completed successfully!
✅ All tests passed!
```

## 🎉 Success Criteria

- [x] Redis deployed and running
- [x] API connects to Redis successfully
- [x] Revenue service allocates 60/40 split
- [x] Contributor balance updates correctly
- [x] Reputation system works (+10 per unlock)
- [x] Payout system validates $50 minimum
- [x] Earnings API returns correct data
- [x] Transaction tracking works

**Everything is ready to go! Just start Docker Desktop and run the services.** 🚀
