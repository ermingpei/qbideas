# Testing the Revenue Sharing System

## ✅ Automated Test Results

The revenue sharing system has been successfully tested with the automated test script. Here's what was verified:

### Test Results Summary:
- ✅ **Revenue Split**: 60% to contributor, 40% to platform
- ✅ **Balance Updates**: Contributor balance correctly updated on each unlock
- ✅ **Reputation System**: +10 points per unlock
- ✅ **Transaction Tracking**: All transactions recorded in database
- ✅ **Minimum Payout**: $50 threshold enforced
- ✅ **Earnings Retrieval**: API correctly returns earnings data

### Test Output:
```
🧪 Testing Revenue Sharing System

1️⃣  Creating test users...
   ✅ Contributor created
   ✅ Buyer created

2️⃣  Creating community idea...
   ✅ Idea created: "Test Community Idea for Revenue Sharing"
   💰 Unlock price: $9.99

3️⃣  Testing revenue allocation...
   ✅ Revenue allocated successfully!
   - Contributor share (60%): $5.99
   - Platform share (40%): $4.00

4️⃣  Verifying contributor balance...
   - Contributor balance: $5.99
   - Contributor total earnings: $5.99
   - Contributor reputation: 60 points (+10)

5️⃣  Testing earnings retrieval...
   ✅ Earnings data retrieved

8️⃣  After 10 unlocks:
   - Total earnings: $59.9
   - Available balance: $59.9
   - Reputation: 150 points
   ✅ Balance now meets minimum payout requirement!
```

## 🧪 Running the Automated Test

To run the automated test yourself:

```bash
cd services/api
npx tsx test-revenue-system.ts
```

This will:
1. Clean up any previous test data
2. Create test users (contributor and buyers)
3. Create a community idea
4. Simulate 10 idea unlocks
5. Verify revenue allocation, balance updates, and reputation changes
6. Test earnings retrieval API

## 🔧 Manual API Testing

### Prerequisites

1. **Start the API server** (requires Redis):
   ```bash
   # Install Redis first if not installed
   brew install redis  # macOS
   
   # Start Redis
   redis-server
   
   # In another terminal, start the API
   cd services/api
   npm run dev
   ```

2. **Or use Docker Compose** (recommended):
   ```bash
   docker-compose up -d postgres redis
   cd services/api
   npm run dev
   ```

### API Endpoints to Test

#### 1. Unlock a Premium Community Idea
```bash
POST http://localhost:3000/api/ideas/:ideaId/unlock
Authorization: Bearer <your-jwt-token>

Response:
{
  "success": true,
  "data": {
    "ideaId": "...",
    "title": "...",
    "unlockedAt": "2024-11-08T...",
    "paymentAmount": 9.99,
    "source": "community",
    "contributorShare": 5.99
  },
  "message": "Idea unlocked successfully"
}
```

#### 2. Get Contributor Earnings
```bash
GET http://localhost:3000/api/contributors/:userId/earnings
Authorization: Bearer <your-jwt-token>

Response:
{
  "success": true,
  "data": {
    "totalEarnings": 59.9,
    "availableBalance": 59.9,
    "pendingBalance": 0,
    "transactions": [...],
    "payouts": [...]
  }
}
```

#### 3. Request a Payout
```bash
POST http://localhost:3000/api/payouts/request
Authorization: Bearer <your-jwt-token>

Response (Success):
{
  "success": true,
  "data": {
    "payoutId": "...",
    "amount": 59.9,
    "status": "completed",
    "completedAt": "2024-11-08T..."
  },
  "message": "Payout of $59.90 has been processed successfully"
}

Response (Insufficient Balance):
{
  "success": false,
  "error": {
    "code": "PAY_004",
    "message": "Minimum payout amount is $50. Your available balance is $5.99"
  }
}
```

#### 4. Get Payout History
```bash
GET http://localhost:3000/api/payouts/history
Authorization: Bearer <your-jwt-token>

Response:
{
  "success": true,
  "data": [
    {
      "id": "...",
      "amount": 59.9,
      "status": "completed",
      "requestedAt": "2024-11-08T...",
      "completedAt": "2024-11-08T..."
    }
  ]
}
```

#### 5. Get Contributor Profile
```bash
GET http://localhost:3000/api/contributors/:userId

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "username": "contributor_name",
      "reputationScore": 150,
      "totalEarnings": 59.9,
      "badge": "bronze"
    },
    "stats": {
      "totalIdeas": 5,
      "publishedIdeas": 5,
      "totalViews": 1234,
      "totalLikes": 56,
      "totalUnlocks": 10
    },
    "ideas": [...]
  }
}
```

## 📊 Database Verification

You can verify the revenue system directly in the database:

```sql
-- Check contributor earnings
SELECT 
  u.username,
  u.total_earnings,
  u.available_balance,
  u.reputation_score
FROM users u
WHERE u.email = 'contributor@test.com';

-- Check transactions
SELECT 
  t.type,
  t.amount,
  t.description,
  t.created_at
FROM transactions t
JOIN users u ON t.user_id = u.id
WHERE u.email = 'contributor@test.com'
ORDER BY t.created_at DESC;

-- Check idea unlocks
SELECT 
  i.title,
  COUNT(iu.id) as unlock_count,
  SUM(iu.payment_amount) as total_revenue
FROM ideas i
LEFT JOIN idea_unlocks iu ON i.id = iu.idea_id
WHERE i.source = 'community'
GROUP BY i.id, i.title;
```

## 🎯 Key Features Implemented

### 1. Revenue Service (`services/api/src/services/revenue.service.ts`)
- ✅ 60/40 revenue split for idea unlocks
- ✅ 30/70 revenue split for service purchases (future)
- ✅ Automatic balance updates
- ✅ Transaction recording
- ✅ Reputation score updates (+10 per unlock)

### 2. Payout System (`services/api/src/routes/payouts.ts`)
- ✅ POST `/api/payouts/request` - Request payout
- ✅ GET `/api/payouts/history` - View payout history
- ✅ $50 minimum payout validation
- ✅ Stripe integration (with dev fallback)
- ✅ Graceful failure handling

### 3. Earnings Dashboard (`services/api/src/routes/contributors.ts`)
- ✅ GET `/api/contributors/:userId/earnings` - Earnings summary
- ✅ GET `/api/contributors/:userId` - Public profile
- ✅ GET `/api/contributors/:userId/stats` - Detailed stats
- ✅ Transaction history
- ✅ Payout history

### 4. Unlock Flow Integration
- ✅ Modified `/api/ideas/:id/unlock` endpoint
- ✅ Automatic revenue allocation for community ideas
- ✅ Differentiates AI vs community ideas
- ✅ Returns contributor share in response

## 🐛 Troubleshooting

### Issue: "No trending ideas yet"
**Solution**: The database needs to be seeded with ideas. Run:
```bash
cd services/api
npm run seed
```

### Issue: "404 This page could not be found"
**Solution**: The API server isn't running. Start it with:
```bash
cd services/api
npm run dev
```

### Issue: Redis connection errors
**Solution**: Install and start Redis:
```bash
# macOS
brew install redis
redis-server

# Or use Docker
docker run -d -p 6379:6379 redis:alpine
```

### Issue: "Stripe not configured"
**Solution**: This is expected in development. The system will simulate payouts. To use real Stripe:
1. Add `STRIPE_SECRET_KEY` to `.env`
2. Restart the API server

## 📝 Next Steps

To fully test the system in the UI:
1. Start Redis: `redis-server`
2. Start API: `cd services/api && npm run dev`
3. Seed database: `cd services/api && npm run seed`
4. Start frontend: `cd frontend && npm run dev`
5. Navigate to http://localhost:3002

Then you can:
- Submit a community idea
- View trending ideas
- Unlock premium ideas
- Check earnings dashboard
- Request payouts
