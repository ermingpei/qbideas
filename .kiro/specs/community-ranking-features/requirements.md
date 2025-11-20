# Requirements Document

## Introduction

This feature extends the qbideas platform to enable community-driven content creation and engagement through user-contributed ideas, revenue sharing, and intelligent ranking systems. The goal is to transform the platform from a one-way AI content generator into a vibrant two-way marketplace where users can both consume and create valuable ideas while earning revenue from their contributions.

## Glossary

- **Platform**: The qbideas web application
- **Contributor**: A registered user who submits ideas to the Platform
- **Community Idea**: An idea submitted by a Contributor rather than AI-generated
- **Ranking System**: The algorithmic system that scores and orders ideas based on multiple criteria
- **Revenue Share**: The percentage of earnings allocated to Contributors when their ideas generate revenue
- **Engagement Metrics**: Quantifiable user interactions including views, likes, comments, and unlocks

## Requirements

### Requirement 1: Community Idea Submission

**User Story:** As a registered user, I want to submit my own app/tool ideas to the platform, so that I can share my concepts with the community and potentially earn revenue.

#### Acceptance Criteria

1. WHEN a registered user accesses the submission page THEN the Platform SHALL display a guided idea submission form
2. WHEN the submission form is displayed THEN the Platform SHALL require the following fields: title, brief description, detailed description, problem statement, target audience, proposed solution, and category
3. WHEN a user submits an idea THEN the Platform SHALL validate that all required fields are completed
4. WHEN validation passes THEN the Platform SHALL save the idea with status "pending_review"
5. WHEN an idea is saved THEN the Platform SHALL display a confirmation message with expected review timeline
6. WHEN a user has submitted ideas THEN the Platform SHALL display them in the user's dashboard with current status

### Requirement 2: Idea Scoring and Evaluation

**User Story:** As a platform operator, I want community ideas to be automatically evaluated using the same criteria as AI-generated ideas, so that quality remains consistent across all content.

#### Acceptance Criteria

1. WHEN a community idea is submitted THEN the Platform SHALL evaluate it using the multi-criteria scoring system
2. WHEN evaluating ideas THEN the Platform SHALL score based on: market potential, technical feasibility, innovation level, clarity, and actionability
3. WHEN scoring is complete THEN the Platform SHALL assign an overall score between 0 and 1
4. WHEN the overall score is above 0.7 THEN the Platform SHALL approve the idea for publication
5. WHEN the overall score is below 0.7 THEN the Platform SHALL reject the idea and provide specific feedback to the Contributor
6. WHEN an idea is approved THEN the Platform SHALL classify it as Regular or Premium based on score (top 30% become Premium)
7. WHEN an idea is classified THEN the Platform SHALL publish it to the public feed with contributor attribution

### Requirement 3: Contributor Attribution and Profiles

**User Story:** As a contributor, I want my published ideas to be attributed to me with a visible profile, so that I can build reputation and credibility in the community.

#### Acceptance Criteria

1. WHEN a community idea is published THEN the Platform SHALL display a "Community Contributed" badge on the idea card
2. WHEN an idea card is displayed THEN the Platform SHALL show the contributor's username and profile image
3. WHEN a user clicks on a contributor's name THEN the Platform SHALL navigate to the contributor's profile page
4. WHEN viewing a contributor profile THEN the Platform SHALL display: username, bio, profile image, join date, total published ideas, total earnings, and reputation score
5. WHEN viewing a contributor profile THEN the Platform SHALL list all published ideas by that contributor
6. WHEN a contributor's idea receives engagement THEN the Platform SHALL update their reputation score based on likes, comments, and unlocks

### Requirement 4: Revenue Sharing System

**User Story:** As a contributor, I want to earn money when users unlock my premium ideas or purchase services for them, so that I am incentivized to contribute high-quality ideas.

#### Acceptance Criteria

1. WHEN a user unlocks a premium community idea THEN the Platform SHALL allocate 60% of the unlock fee to the Contributor and 40% to the Platform
2. WHEN a user purchases an auxiliary service for a community idea THEN the Platform SHALL allocate 30% of the service fee to the Contributor and 70% to the Platform
3. WHEN revenue is allocated THEN the Platform SHALL record the transaction in the Contributor's earnings dashboard
4. WHEN viewing the earnings dashboard THEN the Platform SHALL display: total earnings, available balance, pending balance, and transaction history
5. WHEN a Contributor's available balance reaches $50 THEN the Platform SHALL enable the withdrawal button
6. WHEN a Contributor requests withdrawal THEN the Platform SHALL initiate a payout to their connected payment account
7. WHEN a payout is processed THEN the Platform SHALL update the available balance and record the payout transaction

### Requirement 5: Idea Ranking and Sorting

**User Story:** As a visitor, I want to see ideas ranked by different criteria, so that I can discover the most relevant and valuable ideas for my needs.

#### Acceptance Criteria

1. WHEN viewing the idea feed THEN the Platform SHALL provide sorting options: Newest, Trending, Top Rated, and Most Popular
2. WHEN "Newest" is selected THEN the Platform SHALL sort ideas by publication date descending
3. WHEN "Trending" is selected THEN the Platform SHALL sort ideas by recent engagement velocity (views, likes, comments in last 7 days)
4. WHEN "Top Rated" is selected THEN the Platform SHALL sort ideas by overall score descending
5. WHEN "Most Popular" is selected THEN the Platform SHALL sort ideas by total engagement (all-time views, likes, unlocks)
6. WHEN displaying idea cards THEN the Platform SHALL show the overall score as a visual rating (e.g., 4.5/5 stars)
7. WHEN displaying idea cards THEN the Platform SHALL show engagement metrics: view count, like count, and comment count

### Requirement 6: Engagement Tracking

**User Story:** As a platform operator, I want to track all user engagement with ideas, so that the ranking system can accurately reflect idea quality and popularity.

#### Acceptance Criteria

1. WHEN a user views an idea detail page THEN the Platform SHALL increment the view count for that idea
2. WHEN a user likes an idea THEN the Platform SHALL increment the like count and record the user's like
3. WHEN a user unlikes an idea THEN the Platform SHALL decrement the like count and remove the user's like record
4. WHEN a user comments on an idea THEN the Platform SHALL increment the comment count
5. WHEN a user unlocks a premium idea THEN the Platform SHALL increment the unlock count
6. WHEN engagement metrics are updated THEN the Platform SHALL recalculate the idea's trending score
7. WHEN calculating trending score THEN the Platform SHALL weight recent engagement higher than older engagement

### Requirement 7: Contributor Reputation System

**User Story:** As a contributor, I want to build reputation based on the quality and popularity of my ideas, so that I can establish credibility and gain visibility.

#### Acceptance Criteria

1. WHEN a Contributor publishes their first idea THEN the Platform SHALL initialize their reputation score at 0
2. WHEN a Contributor's idea receives a like THEN the Platform SHALL increase their reputation score by 1 point
3. WHEN a Contributor's idea receives a comment THEN the Platform SHALL increase their reputation score by 2 points
4. WHEN a Contributor's idea is unlocked THEN the Platform SHALL increase their reputation score by 10 points
5. WHEN a Contributor's idea receives a service purchase THEN the Platform SHALL increase their reputation score by 25 points
6. WHEN a Contributor reaches reputation milestones THEN the Platform SHALL award badges: Bronze (100 points), Silver (500 points), Gold (2000 points), Platinum (10000 points)
7. WHEN displaying contributor profiles THEN the Platform SHALL show their current badge and reputation score
8. WHEN sorting contributors THEN the Platform SHALL provide a leaderboard sorted by reputation score

### Requirement 8: Idea Quality Feedback

**User Story:** As a contributor whose idea was rejected, I want to receive specific feedback on why it was rejected, so that I can improve and resubmit.

#### Acceptance Criteria

1. WHEN an idea is rejected THEN the Platform SHALL generate feedback based on the scoring criteria
2. WHEN feedback is generated THEN the Platform SHALL identify which criteria scored below threshold: market potential, technical feasibility, innovation, clarity, or actionability
3. WHEN feedback is provided THEN the Platform SHALL include specific suggestions for improvement for each low-scoring criterion
4. WHEN a Contributor views rejected ideas THEN the Platform SHALL display the feedback prominently
5. WHEN viewing feedback THEN the Platform SHALL provide an option to edit and resubmit the idea
6. WHEN an idea is resubmitted THEN the Platform SHALL re-evaluate it using the same scoring system

### Requirement 9: Contributor Dashboard

**User Story:** As a contributor, I want a comprehensive dashboard showing my ideas, earnings, and performance metrics, so that I can track my success on the platform.

#### Acceptance Criteria

1. WHEN a Contributor accesses their dashboard THEN the Platform SHALL display summary statistics: total ideas submitted, published ideas, pending ideas, rejected ideas, total earnings, and reputation score
2. WHEN viewing the dashboard THEN the Platform SHALL list all submitted ideas with their current status and engagement metrics
3. WHEN viewing the dashboard THEN the Platform SHALL display a revenue chart showing earnings over time
4. WHEN viewing the dashboard THEN the Platform SHALL show top-performing ideas ranked by engagement
5. WHEN viewing the dashboard THEN the Platform SHALL provide quick actions: submit new idea, view earnings, request payout

### Requirement 10: Trending Algorithm

**User Story:** As a visitor, I want to discover ideas that are currently gaining traction, so that I can see what the community finds most interesting right now.

#### Acceptance Criteria

1. WHEN calculating trending score THEN the Platform SHALL use a time-decay algorithm that weights recent engagement higher
2. WHEN calculating trending score THEN the Platform SHALL consider: views in last 7 days, likes in last 7 days, comments in last 7 days, and unlocks in last 7 days
3. WHEN calculating trending score THEN the Platform SHALL apply weights: views (1x), likes (3x), comments (5x), unlocks (10x)
4. WHEN calculating trending score THEN the Platform SHALL apply time decay: day 1 (1.0x), day 2 (0.9x), day 3 (0.8x), continuing to day 7 (0.4x)
5. WHEN trending scores are calculated THEN the Platform SHALL update them every hour
6. WHEN displaying trending ideas THEN the Platform SHALL show a "trending" indicator with upward arrow icon
