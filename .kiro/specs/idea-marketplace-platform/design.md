# qbideas Platform Design Document

## Overview

**qbideas** (qbideas.com) is an AI-powered platform that generates, curates, and publishes thoroughly researched app/tool ideas for the AI-enabled builder generation. The platform combines automated AI generation with community contributions, offering both free and premium ideas with auxiliary services to support execution.

**Platform Name:** qbideas  
**Domain:** qbideas.com  
**Tagline:** "AI-powered ideas, ready to build"  
**Target Deployment:** Google Cloud Platform (GCP)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │  Admin Panel │          │
│  │  (React/Next)│  │ (React Native│  │   (React)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│                    (Cloud Load Balancer)                         │
│                     + Cloud Armor (WAF)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer (GKE)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  API Service │  │ Auth Service │  │ Payment Svc  │          │
│  │  (Node.js)   │  │  (Node.js)   │  │  (Node.js)   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  AI Pipeline │  │ Notification │  │ Analytics    │          │
│  │  (Python)    │  │  Service     │  │  Service     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Cloud SQL   │  │  Firestore   │  │  Cloud       │          │
│  │  (PostgreSQL)│  │  (NoSQL)     │  │  Storage     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  Memorystore │  │  BigQuery    │  │  Pub/Sub     │          │
│  │  (Redis)     │  │  (Analytics) │  │  (Events)    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  OpenAI API  │  │  Anthropic   │  │  Stripe API  │          │
│  │  (GPT-4)     │  │  (Claude)    │  │  (Payments)  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  News APIs   │  │  Market Data │  │  SendGrid    │          │
│  │  (Trends)    │  │  APIs        │  │  (Email)     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### GCP Services Stack

**Compute:**
- **Google Kubernetes Engine (GKE):** Container orchestration for microservices
- **Cloud Run:** Serverless for AI pipeline jobs
- **Cloud Functions:** Event-driven functions for notifications, webhooks

**Storage:**
- **Cloud SQL (PostgreSQL):** Primary relational database for users, ideas, transactions
- **Firestore:** Real-time data for comments, likes, notifications
- **Cloud Storage:** Static assets, uploaded reports, generated documents
- **Memorystore (Redis):** Caching layer for API responses, session management

**Networking:**
- **Cloud Load Balancer:** Global load balancing with SSL termination
- **Cloud CDN:** Content delivery for static assets
- **Cloud Armor:** WAF and DDoS protection
- **VPC:** Private networking for services

**Data & Analytics:**
- **BigQuery:** Data warehouse for analytics and reporting
- **Pub/Sub:** Event streaming for async processing
- **Dataflow:** ETL pipelines for data processing

**AI/ML:**
- **Vertex AI:** Model hosting if we train custom models
- **Cloud Natural Language API:** Text analysis for idea quality
- **External:** OpenAI GPT-4, Anthropic Claude for idea generation

**Security & Identity:**
- **Cloud IAM:** Access control and service accounts
- **Secret Manager:** API keys and credentials management
- **Cloud KMS:** Encryption key management

**Monitoring:**
- **Cloud Monitoring:** Metrics and alerting
- **Cloud Logging:** Centralized logging
- **Cloud Trace:** Distributed tracing
- **Error Reporting:** Error tracking and alerting

## Components and Interfaces

### 1. Frontend Applications

#### Web Application (Next.js + React)
**Technology Stack:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- React Query (data fetching)
- Zustand (state management)

**Key Pages:**
- `/` - Homepage with hero and featured ideas
- `/ideas` - Idea feed with filters
- `/ideas/[id]` - Idea detail page
- `/ideas/submit` - Community contribution form
- `/dashboard` - User dashboard
- `/profile/[username]` - User profile
- `/admin` - Admin panel

**Deployment:** Cloud Run or Firebase Hosting with Cloud CDN

#### Mobile Application (React Native)
**Technology Stack:**
- React Native
- TypeScript
- React Navigation
- React Query
- Async Storage

**Deployment:** App Store + Google Play

### 2. Backend Services

#### API Service (Node.js + Express)
**Responsibilities:**
- RESTful API endpoints
- GraphQL API (optional)
- Request validation
- Rate limiting
- CORS handling

**Technology Stack:**
- Node.js 20
- Express.js
- TypeScript
- Prisma ORM
- Zod (validation)
- Express Rate Limit

**Key Endpoints:**
```
GET    /api/ideas                    # List ideas with filters
GET    /api/ideas/:id                # Get idea details
POST   /api/ideas                    # Submit community idea
POST   /api/ideas/:id/unlock         # Unlock premium idea
GET    /api/ideas/:id/comments       # Get comments
POST   /api/ideas/:id/comments       # Post comment
POST   /api/ideas/:id/like           # Like/unlike idea
GET    /api/services                 # List premium services
POST   /api/services/purchase        # Purchase service
GET    /api/user/dashboard           # User dashboard data
GET    /api/user/unlocked-ideas      # User's unlocked ideas
POST   /api/user/withdraw            # Request payout
GET    /api/admin/requests           # Service requests
POST   /api/admin/requests/:id/fulfill # Upload report
```

**Deployment:** GKE with horizontal pod autoscaling

#### Authentication Service (Node.js)
**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Email verification
- Password reset
- Session management

**Technology Stack:**
- Node.js 20
- Express.js
- Passport.js
- bcrypt
- jsonwebtoken
- SendGrid (email)

**Deployment:** GKE with Redis session store

#### AI Pipeline Service (Python)
**Responsibilities:**
- Daily idea generation orchestration
- Multi-model AI integration (GPT-4, Claude)
- Idea scoring and evaluation
- Research data aggregation
- Community idea evaluation

**Technology Stack:**
- Python 3.11
- FastAPI
- LangChain
- OpenAI SDK
- Anthropic SDK
- Celery (task queue)
- Redis (broker)

**Pipeline Workflow:**
```
1. Trigger (Cloud Scheduler) → Pub/Sub
2. Fetch inspiration data (trends, news, user feedback)
3. Generate 30-50 candidate ideas (parallel AI calls)
4. Conduct research for each candidate
   - Market size analysis
   - Competitive scan
   - Tech stack recommendations
   - Financial projections
5. Score ideas using multi-criteria system
6. Select top 10-15 ideas
7. Enrich with comprehensive packages
8. Classify into Regular/Premium tiers
9. Validate uniqueness
10. Publish to database
11. Trigger notifications
```

**Deployment:** Cloud Run (scheduled jobs) + GKE (API endpoints)

#### Payment Service (Node.js)
**Responsibilities:**
- Stripe integration
- Payment processing
- Revenue tracking
- Refund handling
- Payout management

**Technology Stack:**
- Node.js 20
- Express.js
- Stripe SDK
- Webhook handling

**Deployment:** GKE with PCI compliance considerations

#### Notification Service (Node.js)
**Responsibilities:**
- Email notifications (SendGrid)
- In-app notifications (Firestore)
- Push notifications (FCM)
- Notification preferences management

**Technology Stack:**
- Node.js 20
- SendGrid SDK
- Firebase Admin SDK
- Pub/Sub consumer

**Deployment:** Cloud Functions + GKE

#### Analytics Service (Node.js)
**Responsibilities:**
- Event tracking
- Metrics aggregation
- Dashboard data preparation
- BigQuery integration

**Technology Stack:**
- Node.js 20
- BigQuery client library
- Pub/Sub consumer

**Deployment:** GKE

### 3. Admin Panel (React)
**Responsibilities:**
- Service request management
- User management
- Content moderation
- Analytics dashboard
- Revenue tracking

**Technology Stack:**
- React 18
- TypeScript
- Tailwind CSS
- Recharts (visualizations)
- React Query

**Deployment:** Cloud Run with authentication

## Data Models

### PostgreSQL Schema (Cloud SQL)

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  profile_image_url TEXT,
  bio TEXT,
  reputation_score INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  available_balance DECIMAL(10, 2) DEFAULT 0,
  stripe_account_id VARCHAR(255),
  notification_preferences JSONB DEFAULT '{"email": true, "inApp": true, "push": false}'::jsonb
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Ideas Table
```sql
CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  teaser_description TEXT NOT NULL,
  full_description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  tier VARCHAR(20) NOT NULL CHECK (tier IN ('regular', 'premium')),
  source VARCHAR(20) NOT NULL CHECK (source IN ('ai', 'community')),
  contributor_id UUID REFERENCES users(id),
  
  -- Comprehensive data (JSON for flexibility)
  executive_summary JSONB,
  problem_statement JSONB,
  solution_overview JSONB,
  target_market JSONB,
  competitive_analysis JSONB,
  technical_architecture JSONB,
  go_to_market_strategy JSONB,
  financial_projections JSONB,
  risk_assessment JSONB,
  
  -- Scoring
  market_potential_score DECIMAL(3, 2),
  technical_feasibility_score DECIMAL(3, 2),
  innovation_score DECIMAL(3, 2),
  overall_score DECIMAL(3, 2),
  
  -- Engagement metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  unlock_count INTEGER DEFAULT 0,
  
  -- Metadata
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_validated BOOLEAN DEFAULT FALSE,
  
  -- Premium pricing
  unlock_price DECIMAL(10, 2) DEFAULT 9.99
);

CREATE INDEX idx_ideas_tier ON ideas(tier);
CREATE INDEX idx_ideas_category ON ideas(category);
CREATE INDEX idx_ideas_published_at ON ideas(published_at DESC);
CREATE INDEX idx_ideas_contributor ON ideas(contributor_id);
CREATE INDEX idx_ideas_overall_score ON ideas(overall_score DESC);
```

#### Idea Unlocks Table
```sql
CREATE TABLE idea_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  idea_id UUID NOT NULL REFERENCES ideas(id),
  unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  payment_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  
  UNIQUE(user_id, idea_id)
);

CREATE INDEX idx_unlocks_user ON idea_unlocks(user_id);
CREATE INDEX idx_unlocks_idea ON idea_unlocks(idea_id);
```

#### Premium Services Table
```sql
CREATE TABLE premium_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  delivery_time_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data
INSERT INTO premium_services (name, description, price, delivery_time_days) VALUES
('Feasibility Report', 'Comprehensive feasibility analysis with market validation', 99.00, 3),
('Technical Planning', 'Detailed technical architecture and implementation plan', 149.00, 5),
('Market Research', 'In-depth market research with competitor analysis', 199.00, 7),
('Implementation Roadmap', 'Step-by-step development roadmap with milestones', 129.00, 4),
('Competitive Analysis', 'Detailed competitive landscape and positioning strategy', 89.00, 3);
```

#### Service Requests Table
```sql
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  idea_id UUID NOT NULL REFERENCES ideas(id),
  service_id UUID NOT NULL REFERENCES premium_services(id),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  payment_amount DECIMAL(10, 2) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  report_url TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  deadline TIMESTAMP
);

CREATE INDEX idx_requests_user ON service_requests(user_id);
CREATE INDEX idx_requests_status ON service_requests(status);
CREATE INDEX idx_requests_deadline ON service_requests(deadline);
```

#### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('idea_unlock', 'service_purchase', 'contributor_earning', 'payout')),
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  reference_id UUID, -- idea_id or service_request_id
  stripe_transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);
```

#### Payouts Table
```sql
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  stripe_payout_id VARCHAR(255),
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT
);

CREATE INDEX idx_payouts_user ON payouts(user_id);
CREATE INDEX idx_payouts_status ON payouts(status);
```

### Firestore Collections (Real-time Data)

#### Comments Collection
```javascript
{
  id: string,
  ideaId: string,
  userId: string,
  username: string,
  userProfileImage: string,
  content: string,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  likeCount: number,
  replyCount: number,
  parentCommentId: string | null
}
```

#### Likes Collection
```javascript
{
  id: string,
  ideaId: string,
  userId: string,
  createdAt: Timestamp
}
```

#### Notifications Collection
```javascript
{
  id: string,
  userId: string,
  type: 'comment_reply' | 'idea_published' | 'service_completed' | 'earning_received',
  title: string,
  message: string,
  link: string,
  read: boolean,
  createdAt: Timestamp
}
```

### BigQuery Schema (Analytics)

#### Events Table
```sql
CREATE TABLE events (
  event_id STRING,
  user_id STRING,
  session_id STRING,
  event_type STRING,
  event_properties JSON,
  page_url STRING,
  referrer STRING,
  user_agent STRING,
  ip_address STRING,
  timestamp TIMESTAMP
);
```

#### Daily Metrics Table
```sql
CREATE TABLE daily_metrics (
  date DATE,
  total_users INT64,
  active_users INT64,
  new_users INT64,
  ideas_published INT64,
  ideas_unlocked INT64,
  services_purchased INT64,
  revenue NUMERIC,
  avg_session_duration FLOAT64
);
```

## Error Handling

### Error Response Format
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId: string;
  }
}
```

### Error Codes
- `AUTH_001`: Invalid credentials
- `AUTH_002`: Email not verified
- `AUTH_003`: Token expired
- `IDEA_001`: Idea not found
- `IDEA_002`: Already unlocked
- `IDEA_003`: Insufficient quality score
- `PAY_001`: Payment failed
- `PAY_002`: Insufficient funds
- `SVC_001`: Service unavailable
- `RATE_001`: Rate limit exceeded

### Error Handling Strategy
1. **Client Errors (4xx):** Return descriptive error messages with actionable guidance
2. **Server Errors (5xx):** Log to Cloud Logging, return generic message, trigger alerts
3. **External API Failures:** Implement retry logic with exponential backoff
4. **Database Errors:** Use connection pooling, implement circuit breakers
5. **AI Pipeline Failures:** Fallback to alternative models, queue for retry

## Testing Strategy

### Unit Testing
- **Backend:** Jest + Supertest for API endpoints
- **Frontend:** Jest + React Testing Library
- **AI Pipeline:** pytest for Python services
- **Coverage Target:** 80% code coverage

### Integration Testing
- **API Integration:** Test full request/response cycles
- **Database Integration:** Test with Cloud SQL proxy locally
- **External Services:** Use mocks/stubs for third-party APIs
- **Payment Flow:** Stripe test mode

### End-to-End Testing
- **Tool:** Playwright
- **Scenarios:**
  - User registration and login
  - Browse and unlock premium idea
  - Submit community idea
  - Purchase premium service
  - Admin fulfills service request

### Performance Testing
- **Tool:** k6
- **Targets:**
  - API response time: < 200ms (p95)
  - Idea feed load: < 1s
  - Concurrent users: 10,000+
  - AI pipeline: Generate 10 ideas in < 30 minutes

### Security Testing
- **OWASP Top 10:** Regular vulnerability scans
- **Penetration Testing:** Quarterly external audits
- **Dependency Scanning:** Snyk integration in CI/CD
- **Secret Scanning:** GitGuardian

## Deployment Architecture

### CI/CD Pipeline (Cloud Build)

```yaml
# cloudbuild.yaml
steps:
  # Run tests
  - name: 'node:20'
    entrypoint: npm
    args: ['test']
  
  # Build Docker images
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/api-service:$COMMIT_SHA', './services/api']
  
  # Push to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/api-service:$COMMIT_SHA']
  
  # Deploy to GKE
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=k8s/
      - --image=gcr.io/$PROJECT_ID/api-service:$COMMIT_SHA
      - --location=us-central1
      - --cluster=qbideas-prod
```

### Kubernetes Configuration

#### API Service Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
      - name: api
        image: gcr.io/PROJECT_ID/api-service:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  type: LoadBalancer
  selector:
    app: api-service
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Environment Configuration

#### Local Development (Docker Compose)
**Purpose:** Test and develop locally while mirroring GCP architecture

**Stack:**
- **Services:** Docker Compose orchestration
- **Database:** PostgreSQL 15 (Docker container)
- **Cache:** Redis 7 (Docker container)
- **Storage:** Local filesystem (minio for S3-compatible storage)
- **Queue:** Redis (Celery broker)
- **Email:** Mailhog (email testing)
- **Monitoring:** Prometheus + Grafana (optional)

**Docker Compose Configuration:**
```yaml
version: '3.8'

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: qbideas
      POSTGRES_USER: qbideas
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U qbideas"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis Cache & Queue
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MinIO (S3-compatible storage)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  # Mailhog (Email testing)
  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  # API Service
  api-service:
    build:
      context: ./services/api
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://qbideas:dev_password@postgres:5432/qbideas
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_jwt_secret_change_in_prod
      STRIPE_SECRET_KEY: sk_test_...
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ./services/api:/app
      - /app/node_modules
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: npm run dev

  # Auth Service
  auth-service:
    build:
      context: ./services/auth
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://qbideas:dev_password@postgres:5432/qbideas
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev_jwt_secret_change_in_prod
      SMTP_HOST: mailhog
      SMTP_PORT: 1025
    volumes:
      - ./services/auth:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      - mailhog
    command: npm run dev

  # AI Pipeline Service
  ai-pipeline:
    build:
      context: ./services/ai-pipeline
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      PYTHONUNBUFFERED: 1
      DATABASE_URL: postgresql://qbideas:dev_password@postgres:5432/qbideas
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ./services/ai-pipeline:/app
    depends_on:
      - postgres
      - redis
    command: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

  # Celery Worker (for async tasks)
  celery-worker:
    build:
      context: ./services/ai-pipeline
      dockerfile: Dockerfile.dev
    environment:
      PYTHONUNBUFFERED: 1
      DATABASE_URL: postgresql://qbideas:dev_password@postgres:5432/qbideas
      REDIS_URL: redis://redis:6379
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    volumes:
      - ./services/ai-pipeline:/app
    depends_on:
      - postgres
      - redis
    command: celery -A tasks worker --loglevel=info

  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3002:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3000
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_...
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

**Local Development Workflow:**
1. Clone repository
2. Copy `.env.example` to `.env` and add API keys
3. Run `docker-compose up -d`
4. Run migrations: `docker-compose exec api-service npm run migrate`
5. Seed data: `docker-compose exec api-service npm run seed`
6. Access services:
   - Frontend: http://localhost:3002
   - API: http://localhost:3000
   - Auth: http://localhost:3001
   - AI Pipeline: http://localhost:8000
   - Mailhog UI: http://localhost:8025
   - MinIO Console: http://localhost:9001

**Local Testing:**
- Unit tests: `docker-compose exec api-service npm test`
- Integration tests: `docker-compose exec api-service npm run test:integration`
- E2E tests: `npm run test:e2e` (runs Playwright against local stack)

**Benefits:**
- Mirrors GCP architecture
- No cloud costs during development
- Fast iteration cycles
- Offline development capability
- Easy onboarding for new developers

#### Staging (GCP)
- **GKE Cluster:** qbideas-staging (regional, 3 nodes)
- **Database:** Cloud SQL (db-n1-standard-1)
- **Redis:** Memorystore (5GB)
- **Domain:** staging.qbideas.com
- **Purpose:** Pre-production testing with real GCP services

#### Production (GCP)
- **GKE Cluster:** qbideas-prod (regional, multi-zone, 6+ nodes)
- **Database:** Cloud SQL (db-n1-standard-4, HA with read replicas)
- **Redis:** Memorystore (10GB, HA)
- **Domain:** qbideas.com
- **CDN:** Cloud CDN enabled
- **Backup:** Automated daily backups with 30-day retention

## Security Considerations

### Authentication & Authorization
- JWT tokens with 1-hour expiration
- Refresh tokens with 30-day expiration
- Role-based access control (user, contributor, admin)
- API key authentication for service-to-service

### Data Protection
- Encryption at rest (Cloud SQL, Cloud Storage)
- Encryption in transit (TLS 1.3)
- PII data encryption in database
- Secure credential storage (Secret Manager)

### API Security
- Rate limiting (100 req/min per IP)
- CORS configuration
- Input validation and sanitization
- SQL injection prevention (Prisma ORM)
- XSS protection

### Payment Security
- PCI DSS compliance via Stripe
- No credit card data storage
- Webhook signature verification
- Idempotency keys for payments

### Monitoring & Alerting
- Failed login attempts tracking
- Unusual payment patterns detection
- API abuse detection
- Security event logging

## Performance Optimization

### Caching Strategy
- **Redis Cache:**
  - Idea feed (5 minutes TTL)
  - User profiles (15 minutes TTL)
  - Premium service list (1 hour TTL)
  - API responses (varies by endpoint)

- **CDN Cache:**
  - Static assets (1 year)
  - Idea images (1 week)
  - User avatars (1 day)

### Database Optimization
- Connection pooling (max 20 connections per service)
- Read replicas for analytics queries
- Indexed columns for frequent queries
- Materialized views for complex aggregations

### Frontend Optimization
- Code splitting and lazy loading
- Image optimization (WebP, responsive images)
- Skeleton screens for perceived performance
- Service Worker for offline support
- Bundle size < 200KB (gzipped)

### AI Pipeline Optimization
- Parallel API calls to multiple AI models
- Result caching for similar prompts
- Batch processing for research tasks
- Async job processing with Celery

## Monitoring and Observability

### Metrics to Track
- **Application:**
  - Request rate, latency, error rate
  - API endpoint performance
  - Database query performance
  - Cache hit/miss ratio

- **Business:**
  - Daily active users
  - Ideas published/unlocked
  - Revenue (daily, weekly, monthly)
  - Conversion rates
  - User retention

- **Infrastructure:**
  - CPU/memory utilization
  - Pod count and autoscaling events
  - Database connections
  - Storage usage

### Logging Strategy
- Structured JSON logs
- Log levels: DEBUG, INFO, WARN, ERROR
- Correlation IDs for request tracing
- PII redaction in logs
- 30-day retention in Cloud Logging

### Alerting Rules
- API error rate > 5%
- Response time p95 > 1s
- Database connection pool > 80%
- Payment failure rate > 10%
- AI pipeline job failures
- Disk usage > 85%

## Scalability Considerations

### Horizontal Scaling
- Stateless services for easy scaling
- GKE autoscaling based on CPU/memory
- Load balancing across multiple zones
- Database read replicas for read-heavy workloads

### Vertical Scaling
- Right-size instance types based on metrics
- Upgrade database instances as needed
- Increase Redis memory for cache growth

### Data Scaling
- Partition BigQuery tables by date
- Archive old ideas to Cloud Storage
- Implement data retention policies
- Use Cloud Spanner if PostgreSQL limits reached

## Cost Optimization

### Estimated Monthly Costs (Production)

- **GKE Cluster:** $500-800 (6 n1-standard-2 nodes)
- **Cloud SQL:** $300-500 (db-n1-standard-4 + replicas)
- **Memorystore:** $100-150 (10GB Redis)
- **Cloud Storage:** $50-100 (1TB)
- **Load Balancer:** $20-30
- **Cloud CDN:** $50-100
- **BigQuery:** $100-200
- **External APIs:**
  - OpenAI: $500-1000 (idea generation)
  - Anthropic: $300-500
  - SendGrid: $50-100
  - Stripe: 2.9% + $0.30 per transaction

**Total Estimated:** $2,000-3,500/month (before revenue)

### Cost Optimization Strategies
- Use preemptible VMs for non-critical workloads
- Implement aggressive caching
- Optimize AI API calls (batch, cache)
- Use committed use discounts for GCP
- Monitor and right-size resources
- Implement data lifecycle policies

## Future Enhancements

### Phase 2 Features
- Mobile app launch
- AI-powered idea customization
- Collaborative idea refinement
- Idea marketplace (buy/sell validated ideas)
- Integration with AI coding tools (Cursor, GitHub Copilot)

### Phase 3 Features
- White-label platform for enterprises
- API for third-party integrations
- Idea validation service (pre-launch testing)
- Community voting and curation
- Idea implementation tracking

### Technical Improvements
- GraphQL API for flexible queries
- Real-time collaboration features
- Advanced ML models for idea scoring
- Blockchain for idea ownership/IP
- Multi-language support
