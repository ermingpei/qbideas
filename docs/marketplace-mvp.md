# qbidea Marketplace MVP

## Vision

**"Product Hunt for Startup Ideas"** - A browsable marketplace where users discover AI-generated, thoroughly researched startup ideas, see what others are building, and get execution playbooks to launch their own projects.

## Why This Approach?

### The Gap in the Market
- **Lovable/Bolt.new**: Input-only (you describe, AI builds)
- **Nugget**: Browse-only, manual curation, no community
- **Indie Hackers**: Community ideas, no AI, no execution support
- **qbidea**: Browse AI-generated ideas + community + execution playbooks

### Competitive Advantages
1. **Discovery-First**: Browse ideas like products on Product Hunt
2. **AI-Generated**: Constant fresh content without manual work
3. **Social Proof**: See who's building what
4. **Execution-Focused**: Not just ideas, but how to build them
5. **Community-Driven**: Network effects from builders sharing progress

## Core User Flows

### 1. Visitor → Browser
```
1. Land on homepage
2. See featured ideas
3. Browse by category/filter
4. Click on interesting idea
5. Read teaser + see scores
6. Sign up to like/bookmark
```

### 2. Browser → Buyer
```
1. Find compelling idea
2. See "Unlock for $9.99"
3. Purchase unlock
4. Access full research + playbook
5. Download/save for later
```

### 3. Buyer → Builder
```
1. Unlock idea
2. Click "I'm Building This"
3. Track progress
4. Share updates
5. Launch and showcase
```

### 4. Builder → Contributor
```
1. Successfully launch project
2. Share success story
3. Contribute own ideas
4. Earn from unlocks
```

## MVP Features (12 Weeks)

### Week 1-2: Backend Foundation
- [x] Prisma schema for marketplace
- [x] API routes for browsing/filtering
- [x] Social features (likes, bookmarks, builds)
- [x] Authentication system
- [ ] Stripe payment integration

### Week 3-4: Idea Generation
- [ ] OpenAI integration
- [ ] Idea generation prompts
- [ ] Research compilation
- [ ] Scoring algorithm
- [ ] Batch generate 50-100 ideas

### Week 5-6: Frontend Core
- [ ] Landing page
- [ ] Idea feed (grid/list view)
- [ ] Filtering and search
- [ ] Idea detail page
- [ ] User authentication UI

### Week 7-8: Monetization
- [ ] Stripe checkout flow
- [ ] Unlock mechanism
- [ ] Pro subscription
- [ ] User dashboard
- [ ] Purchase history

### Week 9-10: Social Features
- [ ] Like/bookmark UI
- [ ] "I'm Building This" flow
- [ ] Build progress tracking
- [ ] Public build showcase
- [ ] Basic comments

### Week 11-12: Polish & Launch
- [ ] SEO optimization
- [ ] Email notifications
- [ ] Analytics integration
- [ ] Marketing site
- [ ] Beta launch

## Data Models

### Ideas
```typescript
{
  id: uuid
  title: string
  slug: string
  teaserDescription: string  // Free preview
  fullDescription: string    // Unlocked content
  category: enum
  tags: string[]
  tier: 'regular' | 'premium'
  
  // Scores (visible to all)
  marketPotentialScore: decimal
  technicalFeasibilityScore: decimal
  innovationScore: decimal
  overallScore: decimal
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'
  
  // Metadata (visible to all)
  estimatedCost: decimal
  estimatedLaunchTime: int  // days
  
  // Engagement (visible to all)
  viewCount: int
  likeCount: int
  bookmarkCount: int
  buildCount: int
  commentCount: int
  
  // Premium content (unlocked only)
  executiveSummary: json
  problemStatement: json
  solutionOverview: json
  targetMarket: json
  competitiveAnalysis: json
  technicalArchitecture: json
  goToMarketStrategy: json
  financialProjections: json
  riskAssessment: json
  executionPlaybook: json
  recommendedServices: json
}
```

### User Interactions
```typescript
IdeaLikes { userId, ideaId }
IdeaBookmarks { userId, ideaId }
IdeaUnlocks { userId, ideaId, paymentAmount }
IdeaBuilds { userId, ideaId, status, progressPercent, liveUrl }
IdeaComments { userId, ideaId, content, parentId }
```

## API Endpoints

### Public Endpoints
```
GET  /api/marketplace/ideas
  ?category=saas
  &difficulty=beginner
  &sort=trending|newest|popular|top_rated
  &search=analytics
  &page=1&limit=20

GET  /api/marketplace/ideas/featured

GET  /api/marketplace/ideas/:slug
  Returns teaser for all, full content if unlocked

GET  /api/marketplace/ideas/:ideaId/builds
  Public builds for this idea
```

### Authenticated Endpoints
```
POST /api/marketplace/ideas/:ideaId/like
POST /api/marketplace/ideas/:ideaId/bookmark
POST /api/marketplace/ideas/:ideaId/build
POST /api/marketplace/ideas/:ideaId/unlock
POST /api/marketplace/ideas/:ideaId/comments

GET  /api/marketplace/my/bookmarks
GET  /api/marketplace/my/unlocks
GET  /api/marketplace/my/builds
```

## Pricing Strategy

### Free Tier
- Browse all ideas
- See teasers and scores
- View engagement metrics
- Like and bookmark (requires account)
- See public builds

### Pay-Per-Unlock
- **Regular Ideas**: $9.99
  - Full research report
  - Execution playbook
  - Service recommendations
  - Lifetime access

- **Premium Ideas**: $19.99
  - Everything in regular
  - More detailed research
  - Advanced technical architecture
  - Financial modeling

### Pro Subscription: $29/month
- Unlimited idea unlocks
- Early access to new ideas
- Priority support
- Exclusive community access
- Download all content as PDF

### Revenue Projections

**Conservative (Year 1)**
- 1,000 users
- 10% conversion to paid
- 100 paying users
- Avg $50/user/year
- **$5,000 MRR**

**Moderate (Year 2)**
- 10,000 users
- 15% conversion
- 1,500 paying users
- Avg $75/user/year
- **$9,375 MRR**

**Optimistic (Year 3)**
- 50,000 users
- 20% conversion
- 10,000 paying users
- Avg $100/user/year
- **$83,333 MRR**

## Growth Strategy

### SEO (Primary Channel)
- Each idea = landing page
- Target long-tail keywords
- "startup ideas for [category]"
- "how to build [specific app]"
- 100+ indexed pages from day 1

### Social Sharing
- Twitter cards for each idea
- "I'm building this" social posts
- Success story highlights
- Weekly "trending ideas" thread

### Content Marketing
- Blog: "10 SaaS Ideas You Can Build This Weekend"
- Newsletter: Weekly curated ideas
- YouTube: "Building [Idea] in 48 Hours"
- Podcast: Interview successful builders

### Community
- Discord/Slack for builders
- Monthly showcase events
- Collaboration opportunities
- Referral program

### Partnerships
- No-code tool integrations
- Accelerator programs
- Developer communities
- Indie hacker groups

## Technical Stack

### Backend
- **API**: Node.js + Express + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma
- **Auth**: JWT + bcrypt
- **Payments**: Stripe
- **Email**: Resend
- **AI**: OpenAI GPT-4

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State**: React Query
- **Forms**: React Hook Form + Zod

### Infrastructure
- **Hosting**: Vercel (frontend) + Railway (backend)
- **Database**: Supabase
- **Storage**: Cloudinary (images)
- **Analytics**: Plausible
- **Monitoring**: Sentry

### Development
- **Version Control**: Git + GitHub
- **CI/CD**: GitHub Actions
- **Testing**: Jest + Playwright
- **Linting**: ESLint + Prettier

## Success Metrics

### Engagement
- Daily active users
- Ideas viewed per session
- Like/bookmark rate
- Time on site

### Conversion
- Sign-up rate
- Unlock conversion rate
- Pro subscription rate
- Churn rate

### Community
- "I'm Building This" rate
- Build completion rate
- Success stories published
- Comments per idea

### Revenue
- MRR growth
- Average revenue per user
- Customer acquisition cost
- Lifetime value

## Risk Mitigation

### Technical Risks
- **AI Quality**: Manual review + feedback loop
- **Scaling**: Start with static generation
- **Downtime**: Use reliable providers

### Business Risks
- **Low Adoption**: Beta test with target users
- **No Willingness to Pay**: Start with free tier, prove value
- **Competition**: Focus on community + execution
- **Idea Quality**: Curate and validate before publishing

### Operational Risks
- **Solo Founder**: Keep scope minimal
- **Burnout**: Set realistic timeline
- **Support Load**: Self-service + docs first

## Launch Plan

### Pre-Launch (Weeks 1-10)
- Build MVP
- Generate 100 ideas
- Beta test with 20 users
- Iterate based on feedback

### Soft Launch (Week 11)
- Launch to email list
- Post on Indie Hackers
- Share in relevant communities
- Gather initial users

### Public Launch (Week 12)
- Product Hunt launch
- Twitter announcement
- Reddit posts (r/SideProject, r/startups)
- Hacker News submission
- Press outreach

### Post-Launch (Weeks 13+)
- Daily engagement
- Weekly new ideas
- Monthly feature updates
- Quarterly major releases

## Next Steps

### This Week
1. ✅ Finalize database schema
2. ✅ Build marketplace API
3. ✅ Create seed scripts
4. [ ] Set up Stripe integration
5. [ ] Start frontend development

### Next Week
1. [ ] Build landing page
2. [ ] Implement idea feed
3. [ ] Create detail pages
4. [ ] Add authentication UI
5. [ ] Test user flows

### Following Weeks
- Continue per roadmap
- Weekly progress updates
- Adjust based on learnings
- Stay focused on MVP scope

## Budget

### Development (Solo)
- Time: 12 weeks @ 40 hrs/week
- Cost: $0 (sweat equity)

### Infrastructure (Monthly)
- Vercel: $0 (hobby tier)
- Railway: $5
- Supabase: $0 (free tier)
- OpenAI API: $50-200
- Domain: $1
- **Total: ~$60-210/month**

### Marketing (One-time)
- Product Hunt: $0
- Social media: $0
- Content creation: $0 (DIY)
- **Total: $0**

### Total to Launch: $200-700

## Conclusion

This MVP is:
- ✅ Achievable solo in 12 weeks
- ✅ Low cost to launch ($200-700)
- ✅ Clear monetization path
- ✅ Unique market position
- ✅ Scalable architecture
- ✅ Community-driven growth

Focus on shipping fast, getting users, and iterating based on real feedback. The orchestration features can come later if there's demand and revenue to support development.
