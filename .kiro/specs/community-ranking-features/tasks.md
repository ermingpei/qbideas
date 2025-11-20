# Implementation Tasks

- [x] 1. Database Schema Updates
  - Add `submissionStatus`, `rejectionFeedback`, `trendingScore`, and `trendingScoreUpdatedAt` fields to Ideas model
  - Create and run Prisma migration
  - Update Prisma client
  - _Requirements: 1.1, 2.4, 2.5_

- [ ] 2. Idea Scoring Service
  - [x] 2.1 Create scoring service module
    - Implement `IdeaScoringService` class with scoring criteria
    - Build AI evaluation prompt for GPT-4
    - Implement weighted score calculation
    - Add feedback generation logic
    - _Requirements: 2.1, 2.2, 2.3, 2.6_

  - [x] 2.2 Create background job for processing submissions
    - Set up job queue for async scoring
    - Implement submission processing workflow
    - Add error handling and retry logic
    - Update idea status based on score
    - _Requirements: 2.4, 2.5, 2.7_

- [ ] 3. Idea Submission API
  - [x] 3.1 Create submission endpoint
    - Implement POST /api/ideas/submit endpoint
    - Add request validation with Zod
    - Create idea record with pending status
    - Trigger scoring job
    - Return submission confirmation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 3.2 Create submission status endpoint
    - Implement GET /api/ideas/submissions/:id endpoint
    - Return submission status and feedback
    - Include scoring results if available
    - _Requirements: 1.6, 8.3, 8.4_

- [ ] 4. Ranking System
  - [x] 4.1 Create ranking service
    - Implement `RankingService` class
    - Add newest sorting logic
    - Add top rated sorting logic
    - Add most popular sorting logic
    - _Requirements: 5.1, 5.2, 5.4, 5.5_

  - [x] 4.2 Implement trending algorithm
    - Create trending score calculation function
    - Add time decay logic
    - Implement Redis caching for scores
    - Create hourly update job
    - _Requirements: 5.3, 6.6, 6.7, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 4.3 Create ranking API endpoint
    - Implement GET /api/ideas with sorting params
    - Add pagination support
    - Include contributor data in response
    - Add filtering by category and tier
    - _Requirements: 5.1, 5.6, 5.7_

- [x] 5. Revenue Sharing System
  - [x] 5.1 Create revenue service
    - Implement `RevenueService` class
    - Add revenue allocation logic (60/40 split)
    - Update contributor balance on unlock
    - Record transactions
    - Update reputation scores
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 5.2 Integrate with unlock flow
    - Modify existing unlock endpoint
    - Call revenue service for community ideas
    - Send notifications to contributors
    - _Requirements: 4.1, 4.2_

  - [x] 5.3 Create payout system
    - Implement POST /api/payouts/request endpoint
    - Add Stripe transfer integration
    - Validate minimum balance ($50)
    - Update payout status
    - Handle failures gracefully
    - _Requirements: 4.5, 4.6, 4.7_

  - [x] 5.4 Create earnings dashboard API
    - Implement GET /api/contributors/:userId/earnings
    - Return earnings summary
    - Include transaction history
    - Include payout history
    - _Requirements: 4.4, 9.3_

- [ ] 6. Contributor Profile System
  - [ ] 6.1 Create contributor profile API
    - Implement GET /api/contributors/:userId endpoint
    - Return user info with reputation
    - Calculate and return stats
    - Include published ideas list
    - Add badge calculation
    - _Requirements: 3.3, 3.4, 3.5, 3.6_

  - [ ] 6.2 Create reputation service
    - Implement `ReputationService` class
    - Add point calculation for each action
    - Implement badge threshold logic
    - Create reputation update function
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

- [ ] 7. Contributor Dashboard API
  - Implement GET /api/dashboard/contributor endpoint
  - Return summary statistics
  - Include all submitted ideas with status
  - Add top performers section
  - Include recent earnings chart data
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Frontend: Idea Submission Flow
  - [x] 8.1 Create submission form component
    - Build multi-step wizard component
    - Add form validation
    - Implement auto-save to localStorage
    - Add character counters
    - Create preview mode
    - _Requirements: 1.1, 1.2_

  - [x] 8.2 Create submission page
    - Build /ideas/submit page
    - Integrate submission form
    - Add submission confirmation UI
    - Handle loading and error states
    - _Requirements: 1.3, 1.4, 1.5_

  - [ ] 8.3 Create submission status view
    - Show pending/approved/rejected status
    - Display feedback for rejected ideas
    - Add edit and resubmit option
    - _Requirements: 1.6, 8.3, 8.4, 8.5, 8.6_

- [ ] 9. Frontend: Ranking and Filters
  - [x] 9.1 Create ranking filters component
    - Build sort dropdown (Newest, Trending, Top Rated, Most Popular)
    - Add category filter
    - Add tier filter
    - Implement filter state management
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 9.2 Enhance idea card component
    - Add contributor badge and avatar
    - Add trending indicator
    - Display star rating from overallScore
    - Show engagement metrics
    - _Requirements: 3.1, 3.2, 5.6, 5.7, 10.6_

  - [x] 9.3 Update ideas page with filters
    - Integrate ranking filters
    - Update API calls with sort params
    - Add loading states
    - Implement pagination
    - _Requirements: 5.1_

- [ ] 10. Frontend: Contributor Profile
  - [ ] 10.1 Create contributor profile page
    - Build /contributors/[userId] page
    - Display user info card with avatar and bio
    - Show reputation score and badges
    - Add stats dashboard
    - List published ideas
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 7.7, 7.8_

  - [ ] 10.2 Create contributor badge component
    - Build reusable badge component
    - Add badge icons and colors
    - Implement hover tooltips
    - Make clickable to profile
    - _Requirements: 3.1, 3.2, 7.6, 7.7_

- [ ] 11. Frontend: Contributor Dashboard
  - [ ] 11.1 Create dashboard page
    - Build /dashboard/contributor page
    - Display summary cards
    - Create ideas table with status
    - Add top performers section
    - Show earnings chart
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 11.2 Add earnings management
    - Display available balance
    - Show transaction history
    - Add payout request button
    - Handle payout flow
    - Show payout history
    - _Requirements: 4.4, 4.5, 4.6, 4.7, 9.5_

- [ ] 12. Engagement Tracking
  - Update view tracking on idea detail page
  - Update like/unlike to trigger reputation updates
  - Update comment creation to trigger reputation updates
  - Update unlock flow to trigger reputation updates
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.2, 7.3, 7.4, 7.5_

- [ ] 13. Background Jobs Setup
  - Create hourly job for trending score calculation
  - Create job for processing pending submissions
  - Add job monitoring and error handling
  - _Requirements: 10.5_

- [ ] 14. Testing and Polish
  - [ ]* 14.1 Write backend tests
    - Test scoring service logic
    - Test revenue calculation
    - Test trending algorithm
    - Test reputation updates
    - _Requirements: All_

  - [ ]* 14.2 Write frontend tests
    - Test submission form validation
    - Test ranking filters
    - Test contributor profile display
    - _Requirements: All_

  - [ ] 14.3 Performance optimization
    - Implement Redis caching for rankings
    - Add database indexes
    - Optimize trending score queries
    - _Requirements: All_

  - [ ] 14.4 Security hardening
    - Add rate limiting on submissions
    - Validate payment intents
    - Add content spam detection
    - Audit financial transactions
    - _Requirements: All_

- [ ] 15. Documentation
  - [ ]* 15.1 API documentation
    - Document all new endpoints
    - Add request/response examples
    - Document error codes
    - _Requirements: All_

  - [ ]* 15.2 User documentation
    - Write contributor guide
    - Document submission process
    - Explain revenue sharing
    - Create FAQ
    - _Requirements: All_
