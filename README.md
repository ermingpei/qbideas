# qbideas - The Idea Marketplace

> Discover, unlock, and build AI-generated startup ideas

qbideas is a **marketplace for discovering and building startup ideas**. Browse hundreds of AI-generated, thoroughly researched app and tool ideas, see what others are building, and get step-by-step execution playbooks to bring your chosen idea to life.

## 🚀 Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 20+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### 5-Minute Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/yourusername/qbideas.git
   cd qbideas
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Add your OPENAI_API_KEY and JWT_SECRET
   ```

3. **Start services**
   ```bash
   npm run dev              # Start backend services
   npm run migrate          # Create database tables
   npm run seed:ideas       # Add sample ideas
   ```

4. **Start frontend** (new terminal)
   ```bash
   npm run dev:frontend
   ```

5. **Access the application**
   - **Frontend**: http://localhost:3002
   - **API**: http://localhost:3000
   - **API Docs**: http://localhost:3000/docs

See [SETUP.md](SETUP.md) for detailed instructions.

## 🏗️ Architecture

### Services

- **API Service** (Node.js/Express) - Main REST API
- **Auth Service** (Node.js/Express) - Authentication and user management
- **AI Pipeline** (Python/FastAPI) - Idea generation and research
- **Frontend** (Next.js/React) - User-facing web application
- **Admin Panel** (React) - Administrative interface

### Infrastructure

- **Database**: PostgreSQL (Cloud SQL in production)
- **Cache**: Redis (Memorystore in production)
- **Storage**: MinIO locally, Cloud Storage in production
- **Queue**: Redis/Celery for async tasks
- **Email**: Mailhog locally, SendGrid in production

## 📁 Project Structure

```
qbideas/
├── services/
│   └── api/                 # Backend API (Node.js/Express)
│       ├── src/
│       │   ├── routes/      # API endpoints
│       │   ├── middleware/  # Auth, validation, etc.
│       │   ├── utils/       # Helper functions
│       │   └── scripts/     # Seed scripts
│       └── prisma/          # Database schema
├── frontend/                # Next.js 14 web app
│   ├── app/                 # Pages (App Router)
│   ├── components/          # React components
│   └── lib/                 # API client & utilities
├── docs/                    # Documentation
├── docker-compose.yml       # Local development stack
└── *.md                     # Project documentation
```

## 🛠️ Development Commands

```bash
# Backend
npm run dev              # Start backend services
npm run dev:logs         # View logs
npm run dev:down         # Stop services
npm run migrate          # Run database migrations
npm run seed:ideas       # Seed sample ideas

# Frontend
npm run dev:frontend     # Start Next.js dev server

# Database
npm run db:reset         # Reset database

# Code Quality
npm run lint             # Run linting
npm run format           # Format code
npm test                 # Run tests
```

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Stripe (use test keys for development)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_change_in_production

# Email (optional for local development)
SENDGRID_API_KEY=your_sendgrid_api_key

# External APIs (optional)
NEWS_API_KEY=your_news_api_key
MARKET_DATA_API_KEY=your_market_data_api_key
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests for specific service
npm test --workspace=services/api

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e
```

## 📊 Monitoring

### Local Development

- **Application Logs**: `npm run dev:logs`
- **Database**: Connect to `postgresql://qbideas:dev_password@localhost:5432/qbideas`
- **Redis**: Connect to `redis://localhost:6379`
- **Email Testing**: http://localhost:8025 (Mailhog UI)

### Health Checks

- API Health: http://localhost:3000/health
- Auth Health: http://localhost:3001/health
- AI Pipeline Health: http://localhost:8000/health

## 🚢 Deployment

### Staging/Production (GCP)

The application is designed to deploy on Google Cloud Platform using:

- **Google Kubernetes Engine (GKE)** for container orchestration
- **Cloud SQL** for PostgreSQL database
- **Memorystore** for Redis cache
- **Cloud Storage** for file storage
- **Cloud Build** for CI/CD

See the [deployment documentation](docs/deployment.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all JavaScript code
- Follow ESLint and Prettier configurations
- Write tests for new features
- Update documentation as needed

## 📝 API Documentation

API documentation is available at:
- Local: http://localhost:3000/docs
- Staging: https://staging-api.qbideas.com/docs
- Production: https://api.qbideas.com/docs

## 🔒 Security

- All API endpoints use HTTPS in production
- JWT tokens for authentication
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention with Prisma ORM
- XSS protection with proper escaping

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- Documentation: [docs/](docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/qbideas/issues)
- Discussions: [GitHub Discussions](https://github.com/yourusername/qbideas/discussions)

## ✨ Key Features

### 🔍 Browse & Discover
- **AI-Generated Ideas**: Fresh, researched ideas added weekly
- **Smart Filtering**: By category, difficulty, cost, and time to build
- **Trending & Featured**: See what's hot and what others are building
- **Search**: Find ideas matching your interests and skills

### 📊 Comprehensive Research
- **Market Analysis**: TAM, competition, growth potential
- **Technical Architecture**: Recommended tech stack and services
- **Financial Projections**: Revenue models and cost estimates
- **Execution Playbook**: Step-by-step guide to launch
- **Risk Assessment**: Potential challenges and mitigation strategies

### 💰 Flexible Pricing
- **Free Tier**: Browse all ideas, see teasers and scores
- **Pay Per Unlock**: $9.99 for regular ideas, $19.99 for premium
- **Pro Subscription**: $29/mo for unlimited unlocks
- **Affiliate Revenue**: Earn commissions from service recommendations

### 🤝 Social & Community
- **Like & Bookmark**: Save ideas you're interested in
- **"I'm Building This"**: Claim ideas and track your progress
- **Public Builds**: Share what you're working on
- **Comments**: Discuss ideas with the community
- **Success Stories**: See launched projects from the platform

## 🗺️ Roadmap

### Phase 1: MVP (Weeks 1-4) ✓
- [x] Core marketplace API
- [x] Idea browsing and filtering
- [x] Social features (likes, bookmarks, builds)
- [x] User authentication
- [x] Database schema

### Phase 2: Frontend (Weeks 5-6)
- [ ] Landing page and idea feed
- [ ] Idea detail pages
- [ ] User dashboard
- [ ] Payment integration (Stripe)
- [ ] Responsive design

### Phase 3: AI Generation (Weeks 7-8)
- [ ] OpenAI integration for idea generation
- [ ] Automated research compilation
- [ ] Batch idea generation
- [ ] Quality scoring system

### Phase 4: Community (Weeks 9-10)
- [ ] Comments and discussions
- [ ] Build progress tracking
- [ ] Success story showcase
- [ ] User profiles

### Phase 5: Launch (Weeks 11-12)
- [ ] SEO optimization
- [ ] Marketing site
- [ ] Beta user onboarding
- [ ] Analytics and monitoring
- [ ] Public launch 🚀

See the [marketplace documentation](docs/marketplace-mvp.md) for detailed implementation plan.