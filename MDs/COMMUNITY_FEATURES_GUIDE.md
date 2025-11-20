# Community Contribution & Ranking Features - Testing Guide

## What's Been Implemented

### ✅ Backend Features

1. **AI-Powered Idea Scoring**
   - Evaluates ideas on 5 criteria using GPT-4
   - Approval threshold: 70% (0.70)
   - Premium threshold: 80% (0.80)
   - Automatic feedback generation

2. **Submission System**
   - Rate limiting: 5 submissions per day per user
   - Background processing every 5 minutes
   - Status tracking: pending_review → approved/rejected

3. **Ranking Algorithms**
   - **Newest**: Sort by publication date
   - **Trending**: 7-day engagement with time decay
   - **Top Rated**: Sort by overall score
   - **Most Popular**: Weighted engagement (views + likes×2 + comments×3 + unlocks×5)

4. **Revenue Sharing**
   - 60% to contributor, 40% to platform on premium unlocks
   - Automatic balance updates
   - Transaction tracking

### ✅ Frontend Features

1. **Enhanced Idea Cards**
   - Star ratings (0-5 based on overall score)
   - Contributor badges for community ideas
   - Trending indicators
   - Engagement metrics

2. **Ranking Filters**
   - Visual sort tabs with icons
   - Category and tier filters
   - Search functionality
   - Active filter indicators

3. **Idea Submission Wizard**
   - 4-step guided form
   - Auto-save to localStorage
   - Real-time validation
   - Character counters

## Testing the Features

### 1. View Ideas with Ranking

```bash
# Start the API server
cd services/api
npm run dev

# Start the frontend
cd frontend
npm run dev
```

Visit: http://localhost:3002/ideas

**Test:**
- Switch between sorting options (Newest, Trending, Top Rated, Most Popular)
- Filter by category
- Filter by tier (All, Free, Premium)
- Search for ideas
- Notice star ratings and engagement metrics

### 2. Submit a Community Idea

Visit: http://localhost:3002/ideas/submit

**Test:**
- Fill out the 4-step form
- Notice auto-save (refresh page to see it persist)
- Submit the idea
- Check submission status

**Sample Data:**
```
Title: Smart Grocery List with Price Tracking
Category: Mobile App
Teaser: Track grocery prices across stores and get alerts when items go on sale
Problem: People overspend on groceries because they don't know which store has the best prices
Solution: App that tracks prices across multiple stores and suggests the best time and place to buy
Target Audience: Budget-conscious shoppers and families
```

### 3. Check Submission Status

The idea will be processed within 5 minutes. Check:
- Background job logs in API console
- Submission status endpoint: `GET /api/ideas/submissions/{ideaId}`

### 4. View Approved Ideas

Once approved (score ≥ 0.70):
- Idea appears in the main feed
- Shows contributor badge
- Displays star rating
- Can be filtered and sorted

### 5. Test Revenue Sharing

When a premium community idea is unlocked:
1. User pays unlock fee
2. 60% goes to contributor's balance
3. 40% goes to platform
4. Transaction is recorded
5. Contributor reputation increases by 10 points

## API Endpoints

### Submission
```bash
# Submit idea (requires auth)
POST /api/ideas
{
  "title": "string",
  "description": "string",
  "category": "string",
  "problemStatement": "string",
  "targetAudience": "string",
  "proposedSolution": "string"
}

# Check status
GET /api/ideas/submissions/:id
```

### Ranking
```bash
# Get ranked ideas
GET /api/ideas?sortBy=trending&category=saas&tier=premium&page=1&limit=12
```

## Database Updates

The migration added these fields to the `ideas` table:
- `submission_status`: 'pending_review' | 'approved' | 'rejected' | 'failed'
- `rejection_feedback`: JSON with feedback and scores
- `trending_score`: Cached trending calculation
- `trending_score_updated_at`: Last update timestamp

## Background Jobs

1. **Submission Processor** (every 5 minutes)
   - Finds pending submissions
   - Calls AI scoring service
   - Updates status and publishes/rejects
   - Updates contributor reputation

2. **Trending Score Updater** (every hour)
   - Calculates trending scores for last 7 days
   - Applies time decay
   - Caches in Redis for 1 hour

## Scoring Criteria

Ideas are evaluated on:
1. **Market Potential (30%)**: Market size, revenue potential, demand
2. **Technical Feasibility (25%)**: Buildability, complexity, tech requirements
3. **Innovation (25%)**: Uniqueness, differentiation, IP potential
4. **Clarity (10%)**: Problem/solution clarity, specificity
5. **Actionability (10%)**: Concrete features, implementation steps

## Troubleshooting

### No ideas showing up?
```bash
# Update existing ideas to have approved status
cd services/api
npx prisma db execute --stdin <<< "UPDATE ideas SET submission_status = 'approved' WHERE submission_status IS NULL;"

# Re-seed ideas
npx tsx src/scripts/seed-ideas.ts
```

### Submission not processing?
- Check API logs for background job activity
- Verify OpenAI API key is set in `.env`
- Check Redis connection

### Trending not working?
- Trending requires ideas published in last 7 days
- Check Redis cache: `redis-cli GET trending_scores`
- Manually trigger: restart API server

## Next Steps

Optional features to implement:
1. Contributor profile pages
2. Contributor dashboard with earnings
3. Payout system UI
4. Reputation badges display
5. Leaderboard
6. Email notifications

## Configuration

Required environment variables:
```env
# API
OPENAI_API_KEY=sk-...
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Rate Limits

- Idea submissions: 5 per day per user
- API requests: 100 per 15 minutes per IP

## Revenue Split

- Premium idea unlock: 60% contributor / 40% platform
- Service purchase: 30% contributor / 70% platform
- Minimum payout: $50
