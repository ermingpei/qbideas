# Community Contribution & Ranking Features - Design Document

## Overview

This design document details the implementation of community-driven features for the qbideas platform, enabling users to contribute ideas, earn revenue, and discover content through intelligent ranking algorithms. The design leverages the existing database schema and API infrastructure while adding new endpoints and frontend components.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Idea Submit  │  │ Contributor  │  │  Rankings &  │      │
│  │    Form      │  │   Profile    │  │   Filters    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Submission   │  │  Scoring     │  │  Revenue     │      │
│  │  Endpoints   │  │  Service     │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │  Redis Cache │  │  Background  │      │
│  │   (Prisma)   │  │  (Rankings)  │  │    Jobs      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Idea Submission System

#### Frontend Component: IdeaSubmissionForm
**Location:** `frontend/components/IdeaSubmissionForm.tsx`

**Features:**
- Multi-step form with validation
- Real-time character counters
- Category selection dropdown
- Rich text editor for descriptions
- Auto-save to local storage
- Preview mode before submission

**Form Fields:**
```typescript
interface IdeaSubmissionData {
  title: string;                    // Max 100 chars
  teaserDescription: string;        // Max 200 chars
  fullDescription: string;          // Max 5000 chars
  problemStatement: string;         // Max 1000 chars
  targetAudience: string;           // Max 500 chars
  proposedSolution: string;         // Max 2000 chars
  category: IdeaCategory;
  tags: string[];                   // Max 5 tags
}
```

#### API Endpoint: POST /api/ideas/submit
**Request:**
```typescript
{
  title: string;
  teaserDescription: string;
  fullDescription: string;
  problemStatement: string;
  targetAudience: string;
  proposedSolution: string;
  category: IdeaCategory;
  tags: string[];
}
```

**Response:**
```typescript
{
  success: boolean;
  ideaId: string;
  status: 'pending_review' | 'approved' | 'rejected';
  message: string;
}
```

**Implementation Logic:**
1. Validate authentication (must be logged in)
2. Validate all required fields
3. Create idea record with `source: 'community'` and `isPublished: false`
4. Trigger async scoring job
5. Return submission confirmation

### 2. Idea Scoring Service

#### Scoring Algorithm
**Location:** `services/api/src/services/scoring.service.ts`

**Scoring Criteria:**

```typescript
interface ScoringCriteria {
  marketPotential: number;      // 0-1 (30% weight)
  technicalFeasibility: number; // 0-1 (25% weight)
  innovation: number;           // 0-1 (25% weight)
  clarity: number;              // 0-1 (10% weight)
  actionability: number;        // 0-1 (10% weight)
}

interface ScoringResult {
  scores: ScoringCriteria;
  overallScore: number;         // Weighted average
  tier: 'regular' | 'premium';  // Based on threshold
  feedback: string[];           // Improvement suggestions
  approved: boolean;            // overallScore >= 0.7
}
```

**Scoring Implementation:**

```typescript
class IdeaScoringService {
  async scoreIdea(idea: IdeaSubmissionData): Promise<ScoringResult> {
    // Use AI (GPT-4) to evaluate each criterion
    const scores = await this.evaluateWithAI(idea);
    
    // Calculate weighted overall score
    const overallScore = 
      scores.marketPotential * 0.30 +
      scores.technicalFeasibility * 0.25 +
      scores.innovation * 0.25 +
      scores.clarity * 0.10 +
      scores.actionability * 0.10;
    
    // Determine tier (top 30% = premium)
    const tier = overallScore >= 0.80 ? 'premium' : 'regular';
    
    // Generate feedback for low scores
    const feedback = this.generateFeedback(scores);
    
    return {
      scores,
      overallScore,
      tier,
      feedback,
      approved: overallScore >= 0.70
    };
  }
  
  private async evaluateWithAI(idea: IdeaSubmissionData) {
    // Call OpenAI API with structured prompt
    const prompt = this.buildScoringPrompt(idea);
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });
    
    return JSON.parse(response.choices[0].message.content);
  }
  
  private generateFeedback(scores: ScoringCriteria): string[] {
    const feedback: string[] = [];
    
    if (scores.marketPotential < 0.7) {
      feedback.push('Consider expanding on the target market size and revenue potential');
    }
    if (scores.technicalFeasibility < 0.7) {
      feedback.push('Clarify the technical approach and required technologies');
    }
    if (scores.innovation < 0.7) {
      feedback.push('Highlight what makes this idea unique compared to existing solutions');
    }
    if (scores.clarity < 0.7) {
      feedback.push('Make the problem statement and solution more specific and clear');
    }
    if (scores.actionability < 0.7) {
      feedback.push('Provide more concrete steps or features for implementation');
    }
    
    return feedback;
  }
}
```

#### Background Job: Process Submission
**Location:** `services/api/src/jobs/processIdeaSubmission.ts`

**Workflow:**
1. Fetch pending idea from database
2. Run scoring service
3. Update idea with scores
4. If approved:
   - Set `isPublished: true`
   - Set tier based on score
   - Send notification to contributor
5. If rejected:
   - Store feedback
   - Send notification with feedback
6. Update contributor reputation if approved

### 3. Ranking System

#### Ranking Service
**Location:** `services/api/src/services/ranking.service.ts`

**Ranking Algorithms:**

```typescript
interface RankingOptions {
  sortBy: 'newest' | 'trending' | 'top_rated' | 'most_popular';
  category?: IdeaCategory;
  tier?: 'regular' | 'premium' | 'all';
  page: number;
  limit: number;
}

class RankingService {
  async getRankedIdeas(options: RankingOptions) {
    switch (options.sortBy) {
      case 'newest':
        return this.getNewest(options);
      case 'trending':
        return this.getTrending(options);
      case 'top_rated':
        return this.getTopRated(options);
      case 'most_popular':
        return this.getMostPopular(options);
    }
  }
  
  private async getNewest(options: RankingOptions) {
    return prisma.ideas.findMany({
      where: this.buildWhereClause(options),
      orderBy: { publishedAt: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: this.getIncludeClause()
    });
  }
  
  private async getTrending(options: RankingOptions) {
    // Calculate trending score and cache in Redis
    const trendingScores = await this.calculateTrendingScores();
    
    // Fetch ideas and sort by trending score
    const ideas = await prisma.ideas.findMany({
      where: this.buildWhereClause(options),
      include: this.getIncludeClause()
    });
    
    return ideas
      .map(idea => ({
        ...idea,
        trendingScore: trendingScores[idea.id] || 0
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(
        (options.page - 1) * options.limit,
        options.page * options.limit
      );
  }
  
  private async calculateTrendingScores(): Promise<Record<string, number>> {
    // Check Redis cache first
    const cached = await redis.get('trending_scores');
    if (cached) return JSON.parse(cached);
    
    // Calculate fresh scores
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const ideas = await prisma.ideas.findMany({
      where: {
        publishedAt: { gte: sevenDaysAgo }
      },
      include: {
        likes: {
          where: { createdAt: { gte: sevenDaysAgo } }
        },
        comments: {
          where: { createdAt: { gte: sevenDaysAgo } }
        },
        unlocks: {
          where: { unlockedAt: { gte: sevenDaysAgo } }
        }
      }
    });
    
    const scores: Record<string, number> = {};
    
    for (const idea of ideas) {
      // Calculate engagement by day with time decay
      const dailyEngagement = this.calculateDailyEngagement(idea);
      
      // Apply weights and time decay
      let trendingScore = 0;
      for (let day = 0; day < 7; day++) {
        const decay = 1.0 - (day * 0.1); // 1.0, 0.9, 0.8, ..., 0.4
        const dayScore = 
          dailyEngagement[day].views * 1 +
          dailyEngagement[day].likes * 3 +
          dailyEngagement[day].comments * 5 +
          dailyEngagement[day].unlocks * 10;
        
        trendingScore += dayScore * decay;
      }
      
      scores[idea.id] = trendingScore;
    }
    
    // Cache for 1 hour
    await redis.setex('trending_scores', 3600, JSON.stringify(scores));
    
    return scores;
  }
  
  private async getTopRated(options: RankingOptions) {
    return prisma.ideas.findMany({
      where: this.buildWhereClause(options),
      orderBy: { overallScore: 'desc' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      include: this.getIncludeClause()
    });
  }
  
  private async getMostPopular(options: RankingOptions) {
    // Calculate popularity score: views + likes*2 + comments*3 + unlocks*5
    const ideas = await prisma.ideas.findMany({
      where: this.buildWhereClause(options),
      include: this.getIncludeClause()
    });
    
    return ideas
      .map(idea => ({
        ...idea,
        popularityScore: 
          idea.viewCount +
          idea.likeCount * 2 +
          idea.commentCount * 3 +
          idea.unlockCount * 5
      }))
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(
        (options.page - 1) * options.limit,
        options.page * options.limit
      );
  }
}
```

#### API Endpoint: GET /api/ideas
**Query Parameters:**
```typescript
{
  sortBy?: 'newest' | 'trending' | 'top_rated' | 'most_popular';
  category?: IdeaCategory;
  tier?: 'regular' | 'premium' | 'all';
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  ideas: Array<{
    id: string;
    title: string;
    teaserDescription: string;
    category: IdeaCategory;
    tier: IdeaTier;
    source: IdeaSource;
    overallScore: number;
    viewCount: number;
    likeCount: number;
    commentCount: number;
    unlockCount: number;
    publishedAt: string;
    contributor?: {
      id: string;
      username: string;
      profileImageUrl: string;
      reputationScore: number;
    };
    trendingScore?: number;  // Only for trending sort
    popularityScore?: number; // Only for popular sort
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 4. Revenue Sharing System

#### Revenue Service
**Location:** `services/api/src/services/revenue.service.ts`

```typescript
class RevenueService {
  async processIdeaUnlock(
    userId: string,
    ideaId: string,
    paymentAmount: number,
    stripePaymentIntentId: string
  ) {
    const idea = await prisma.ideas.findUnique({
      where: { id: ideaId },
      include: { contributor: true }
    });
    
    if (!idea) throw new Error('Idea not found');
    
    // Create unlock record
    await prisma.ideaUnlocks.create({
      data: {
        userId,
        ideaId,
        paymentAmount,
        stripePaymentIntentId
      }
    });
    
    // Update idea metrics
    await prisma.ideas.update({
      where: { id: ideaId },
      data: { unlockCount: { increment: 1 } }
    });
    
    // If community idea, allocate revenue
    if (idea.source === 'community' && idea.contributorId) {
      const contributorShare = paymentAmount * 0.60; // 60% to contributor
      const platformShare = paymentAmount * 0.40;    // 40% to platform
      
      // Update contributor balance
      await prisma.user.update({
        where: { id: idea.contributorId },
        data: {
          totalEarnings: { increment: contributorShare },
          availableBalance: { increment: contributorShare },
          reputationScore: { increment: 10 } // +10 for unlock
        }
      });
      
      // Record transaction
      await prisma.transactions.create({
        data: {
          userId: idea.contributorId,
          type: 'contributor_earning',
          amount: contributorShare,
          description: `Earned from idea unlock: ${idea.title}`,
          referenceId: ideaId,
          stripeTransactionId: stripePaymentIntentId
        }
      });
      
      // Send notification to contributor
      await this.notifyContributor(idea.contributorId, {
        type: 'earning_received',
        amount: contributorShare,
        ideaTitle: idea.title
      });
    }
  }
  
  async requestPayout(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!user) throw new Error('User not found');
    if (user.availableBalance < 50) {
      throw new Error('Minimum payout amount is $50');
    }
    if (!user.stripeAccountId) {
      throw new Error('Please connect your Stripe account first');
    }
    
    // Create payout record
    const payout = await prisma.payouts.create({
      data: {
        userId,
        amount: user.availableBalance,
        status: 'pending'
      }
    });
    
    // Process with Stripe
    try {
      const transfer = await stripe.transfers.create({
        amount: Math.round(user.availableBalance * 100), // Convert to cents
        currency: 'usd',
        destination: user.stripeAccountId,
        description: `Payout for contributor earnings`
      });
      
      // Update payout status
      await prisma.payouts.update({
        where: { id: payout.id },
        data: {
          status: 'completed',
          stripePayoutId: transfer.id,
          completedAt: new Date()
        }
      });
      
      // Update user balance
      await prisma.user.update({
        where: { id: userId },
        data: {
          availableBalance: 0
        }
      });
      
      // Record transaction
      await prisma.transactions.create({
        data: {
          userId,
          type: 'payout',
          amount: -user.availableBalance,
          description: 'Payout to Stripe account',
          stripeTransactionId: transfer.id
        }
      });
      
      return { success: true, payoutId: payout.id };
    } catch (error) {
      // Update payout status to failed
      await prisma.payouts.update({
        where: { id: payout.id },
        data: {
          status: 'failed',
          failureReason: error.message
        }
      });
      
      throw error;
    }
  }
}
```

#### API Endpoints

**POST /api/payouts/request**
```typescript
// Request body: none (uses authenticated user)
// Response:
{
  success: boolean;
  payoutId: string;
  amount: number;
  message: string;
}
```

**GET /api/contributors/:userId/earnings**
```typescript
// Response:
{
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  transactions: Array<{
    id: string;
    type: TransactionType;
    amount: number;
    description: string;
    createdAt: string;
  }>;
  payouts: Array<{
    id: string;
    amount: number;
    status: PayoutStatus;
    requestedAt: string;
    completedAt?: string;
  }>;
}
```

### 5. Contributor Profile System

#### API Endpoint: GET /api/contributors/:userId
```typescript
// Response:
{
  user: {
    id: string;
    username: string;
    profileImageUrl: string;
    bio: string;
    reputationScore: number;
    totalEarnings: number;
    createdAt: string;
    badges: Array<{
      name: 'bronze' | 'silver' | 'gold' | 'platinum';
      earnedAt: string;
    }>;
  };
  stats: {
    totalIdeas: number;
    publishedIdeas: number;
    totalViews: number;
    totalLikes: number;
    totalUnlocks: number;
  };
  ideas: Array<{
    id: string;
    title: string;
    teaserDescription: string;
    category: IdeaCategory;
    tier: IdeaTier;
    overallScore: number;
    viewCount: number;
    likeCount: number;
    unlockCount: number;
    publishedAt: string;
  }>;
}
```

#### Frontend Component: ContributorProfile
**Location:** `frontend/app/contributors/[userId]/page.tsx`

**Features:**
- User info card with avatar, bio, reputation
- Badge display with tooltips
- Stats dashboard (ideas, earnings, engagement)
- Published ideas grid
- Earnings chart (if viewing own profile)

### 6. Contributor Dashboard

#### API Endpoint: GET /api/dashboard/contributor
```typescript
// Response:
{
  summary: {
    totalIdeas: number;
    publishedIdeas: number;
    pendingIdeas: number;
    rejectedIdeas: number;
    totalEarnings: number;
    availableBalance: number;
    reputationScore: number;
  };
  ideas: Array<{
    id: string;
    title: string;
    status: 'pending_review' | 'published' | 'rejected';
    tier?: IdeaTier;
    overallScore?: number;
    viewCount: number;
    likeCount: number;
    unlockCount: number;
    earnings: number;
    feedback?: string[];
    submittedAt: string;
  }>;
  topPerformers: Array<{
    id: string;
    title: string;
    viewCount: number;
    likeCount: number;
    unlockCount: number;
    earnings: number;
  }>;
  recentEarnings: Array<{
    date: string;
    amount: number;
  }>;
}
```

#### Frontend Component: ContributorDashboard
**Location:** `frontend/app/dashboard/contributor/page.tsx`

**Features:**
- Summary cards (ideas, earnings, reputation)
- Ideas table with status and metrics
- Top performers section
- Earnings chart
- Quick actions (submit idea, request payout)
- Rejected ideas with feedback

### 7. Reputation System

#### Reputation Service
**Location:** `services/api/src/services/reputation.service.ts`

```typescript
class ReputationService {
  private readonly POINTS = {
    LIKE: 1,
    COMMENT: 2,
    UNLOCK: 10,
    SERVICE_PURCHASE: 25
  };
  
  private readonly BADGES = {
    BRONZE: 100,
    SILVER: 500,
    GOLD: 2000,
    PLATINUM: 10000
  };
  
  async updateReputation(
    userId: string,
    action: 'like' | 'comment' | 'unlock' | 'service_purchase'
  ) {
    const points = this.POINTS[action.toUpperCase()];
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        reputationScore: { increment: points }
      }
    });
    
    // Check for badge upgrades
    await this.checkBadgeUpgrades(user);
    
    return user.reputationScore;
  }
  
  private async checkBadgeUpgrades(user: User) {
    const currentBadge = this.getCurrentBadge(user.reputationScore);
    
    // Store badge info in user metadata or separate table
    // Send notification if new badge earned
  }
  
  private getCurrentBadge(score: number): string {
    if (score >= this.BADGES.PLATINUM) return 'platinum';
    if (score >= this.BADGES.GOLD) return 'gold';
    if (score >= this.BADGES.SILVER) return 'silver';
    if (score >= this.BADGES.BRONZE) return 'bronze';
    return 'none';
  }
}
```

## Data Models

The existing Prisma schema already supports most of our needs. We need to add a few fields:

### Database Migrations

```prisma
// Add to Ideas model
model Ideas {
  // ... existing fields ...
  
  // Add submission status for community ideas
  submissionStatus String? @default("approved") @map("submission_status") @db.VarChar(20)
  // Values: 'pending_review', 'approved', 'rejected'
  
  // Add feedback for rejected ideas
  rejectionFeedback Json? @map("rejection_feedback")
  
  // Add trending score cache
  trendingScore Decimal? @default(0) @map("trending_score") @db.Decimal(10, 2)
  trendingScoreUpdatedAt DateTime? @map("trending_score_updated_at")
}
```

## Frontend Components

### 1. IdeaCard Enhancement
**Location:** `frontend/components/IdeaCard.tsx`

**Add:**
- Contributor badge and avatar (for community ideas)
- Trending indicator (flame icon with animation)
- Star rating display (based on overallScore)
- Engagement metrics row

### 2. RankingFilters Component
**Location:** `frontend/components/RankingFilters.tsx`

```typescript
interface RankingFiltersProps {
  currentSort: string;
  currentCategory?: string;
  currentTier?: string;
  onSortChange: (sort: string) => void;
  onCategoryChange: (category: string) => void;
  onTierChange: (tier: string) => void;
}
```

**Features:**
- Sort dropdown (Newest, Trending, Top Rated, Most Popular)
- Category filter
- Tier filter (All, Regular, Premium)
- Active filter indicators
- Clear filters button

### 3. IdeaSubmissionWizard Component
**Location:** `frontend/components/IdeaSubmissionWizard.tsx`

**Steps:**
1. Basic Info (title, teaser, category)
2. Problem & Solution (problem statement, proposed solution)
3. Target Audience
4. Review & Submit

**Features:**
- Progress indicator
- Form validation
- Auto-save to localStorage
- Preview mode
- Character counters

### 4. ContributorBadge Component
**Location:** `frontend/components/ContributorBadge.tsx`

```typescript
interface ContributorBadgeProps {
  username: string;
  profileImageUrl: string;
  reputationScore: number;
  badge: 'bronze' | 'silver' | 'gold' | 'platinum' | 'none';
  size?: 'sm' | 'md' | 'lg';
}
```

**Features:**
- Avatar with badge overlay
- Reputation score display
- Hover tooltip with stats
- Link to profile

## Error Handling

### Submission Errors
```typescript
enum SubmissionError {
  VALIDATION_FAILED = 'SUBMISSION_001',
  DUPLICATE_TITLE = 'SUBMISSION_002',
  RATE_LIMIT_EXCEEDED = 'SUBMISSION_003',
  SCORING_FAILED = 'SUBMISSION_004'
}
```

### Payout Errors
```typescript
enum PayoutError {
  INSUFFICIENT_BALANCE = 'PAYOUT_001',
  NO_STRIPE_ACCOUNT = 'PAYOUT_002',
  STRIPE_TRANSFER_FAILED = 'PAYOUT_003',
  MINIMUM_NOT_MET = 'PAYOUT_004'
}
```

## Testing Strategy

### Unit Tests
- Scoring service logic
- Revenue calculation
- Trending score algorithm
- Reputation point calculation

### Integration Tests
- Idea submission flow
- Revenue sharing on unlock
- Payout request process
- Ranking API endpoints

### E2E Tests
- Submit idea and see it published
- Unlock premium community idea
- Request payout
- View contributor profile

## Performance Optimization

### Caching Strategy
- **Trending scores:** Redis cache, 1-hour TTL
- **Contributor profiles:** Redis cache, 15-minute TTL
- **Ranking results:** Redis cache, 5-minute TTL
- **Leaderboard:** Redis cache, 1-hour TTL

### Database Optimization
- Index on `submissionStatus` for filtering pending ideas
- Index on `trendingScore` for trending queries
- Composite index on `(source, isPublished, publishedAt)` for community ideas

### Background Jobs
- Calculate trending scores: Every hour
- Update reputation badges: On reputation change
- Process pending submissions: Every 5 minutes
- Clean up old trending data: Daily

## Security Considerations

### Submission Security
- Rate limiting: 5 submissions per day per user
- Content validation: Check for spam/inappropriate content
- Duplicate detection: Check title similarity

### Revenue Security
- Verify payment intent before allocating revenue
- Atomic transactions for balance updates
- Audit log for all financial transactions
- Minimum payout threshold ($50)

### Profile Security
- Private earnings data (only visible to owner)
- Public reputation and stats
- Rate limiting on profile views

## Monitoring

### Metrics to Track
- Submission rate (per day)
- Approval rate (approved/total)
- Average scoring time
- Revenue per contributor
- Trending score distribution
- Payout success rate

### Alerts
- Scoring service failures
- Payout failures
- Unusual submission patterns
- Low approval rates

## Migration Plan

### Phase 1: Database & Backend (Week 1)
1. Add new fields to Ideas model
2. Implement scoring service
3. Create submission endpoints
4. Implement revenue service
5. Add ranking endpoints

### Phase 2: Frontend Components (Week 2)
1. Build submission wizard
2. Create contributor profile pages
3. Add ranking filters
4. Build contributor dashboard
5. Enhance idea cards

### Phase 3: Testing & Polish (Week 3)
1. Write tests
2. Performance optimization
3. Security hardening
4. UI/UX polish
5. Documentation

## Success Metrics

### Technical Metrics
- Submission processing time < 30 seconds
- Ranking query time < 200ms
- Payout success rate > 95%
- Zero revenue calculation errors

### Business Metrics
- 20% of users become contributors
- 50+ community ideas per month
- $1000+ paid to contributors per month
- 4.0+ average idea score
