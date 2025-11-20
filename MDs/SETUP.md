# qbidea Setup Guide

Complete setup instructions to get qbidea running locally.

## Prerequisites

- **Node.js**: 20+ ([Download](https://nodejs.org/))
- **Docker Desktop**: Latest version ([Download](https://www.docker.com/products/docker-desktop/))
- **Git**: Latest version

## Quick Start (5 Minutes)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/qbidea.git
cd qbidea
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
# Database
DATABASE_URL="postgresql://qbidea:dev_password@localhost:5432/qbidea"

# JWT
JWT_SECRET="your-secret-key-change-in-production"

# OpenAI (for idea generation)
OPENAI_API_KEY="sk-..."

# Stripe (optional for MVP)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 4. Start Backend Services

```bash
# Start PostgreSQL, Redis, etc.
npm run dev

# Wait 30 seconds for services to initialize
```

### 5. Run Database Migrations

```bash
# Create tables
npm run migrate

# Seed sample ideas
npm run seed:ideas
```

### 6. Start Frontend

```bash
# In a new terminal
npm run dev:frontend
```

### 7. Access Application

- **Frontend**: http://localhost:3002
- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs

## Detailed Setup

### Backend Setup

#### 1. Database Migration

```bash
cd services/api
npx prisma migrate dev
npx prisma generate
```

#### 2. Seed Data

```bash
# Seed 10 sample ideas
npx tsx src/scripts/seed-ideas.ts
```

#### 3. Verify API

```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}

curl http://localhost:3000/api/marketplace/ideas
# Should return ideas list
```

### Frontend Setup

#### 1. Install Dependencies

```bash
cd frontend
npm install
```

#### 2. Environment Variables

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

#### 3. Start Development Server

```bash
npm run dev
```

#### 4. Verify Frontend

Open http://localhost:3002 - you should see the homepage.

## Development Workflow

### Daily Development

```bash
# Terminal 1: Backend services
npm run dev

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: View logs
npm run dev:logs
```

### Making Changes

#### Backend Changes

1. Edit files in `services/api/src/`
2. API auto-reloads (nodemon)
3. Test with curl or Postman

#### Frontend Changes

1. Edit files in `frontend/`
2. Next.js auto-reloads
3. View changes at http://localhost:3002

#### Database Changes

1. Edit `services/api/prisma/schema.prisma`
2. Run migration:
   ```bash
   cd services/api
   npx prisma migrate dev --name your_change_name
   ```
3. Regenerate client:
   ```bash
   npx prisma generate
   ```

## Common Commands

### Backend

```bash
# Start services
npm run dev

# View logs
npm run dev:logs

# Stop services
npm run dev:down

# Clean everything (removes data)
npm run dev:clean

# Database operations
npm run migrate          # Run migrations
npm run seed:ideas       # Seed ideas
npm run db:reset         # Reset database

# Prisma Studio (database GUI)
cd services/api
npx prisma studio
```

### Frontend

```bash
# Development
npm run dev:frontend

# Build for production
cd frontend
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (API)
lsof -ti:3000 | xargs kill -9

# Kill process on port 3002 (Frontend)
lsof -ti:3002 | xargs kill -9
```

### Database Connection Error

```bash
# Restart Docker services
npm run dev:down
npm run dev

# Check if PostgreSQL is running
docker ps
```

### Prisma Client Not Generated

```bash
cd services/api
npx prisma generate
```

### Frontend Can't Connect to API

1. Check API is running: `curl http://localhost:3000/health`
2. Check `.env.local` has correct API URL
3. Check CORS settings in `services/api/src/index.ts`

### Docker Issues

```bash
# Reset Docker
npm run dev:clean
docker system prune -a
npm run dev
```

## Project Structure

```
qbidea/
├── services/
│   └── api/              # Backend API
│       ├── src/
│       │   ├── routes/   # API endpoints
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── scripts/  # Seed scripts
│       └── prisma/       # Database schema
├── frontend/             # Next.js frontend
│   ├── app/             # Pages
│   ├── components/      # React components
│   └── lib/             # Utilities
├── docs/                # Documentation
├── docker-compose.yml   # Local services
└── package.json         # Root package
```

## Next Steps

### Week 1: Core Features
- [ ] Implement authentication
- [ ] Add Stripe payment integration
- [ ] Create idea detail page
- [ ] Build user dashboard

### Week 2: AI Integration
- [ ] Connect OpenAI API
- [ ] Generate 50-100 ideas
- [ ] Implement idea generation script
- [ ] Add quality scoring

### Week 3: Social Features
- [ ] Comments system
- [ ] Build tracking
- [ ] User profiles
- [ ] Success stories

### Week 4: Polish & Launch
- [ ] SEO optimization
- [ ] Email notifications
- [ ] Analytics integration
- [ ] Beta launch

## Getting Help

- **Documentation**: Check `docs/` folder
- **API Reference**: http://localhost:3000/docs
- **Database Schema**: `services/api/prisma/schema.prisma`
- **GitHub Issues**: [Create an issue](https://github.com/yourusername/qbidea/issues)

## Resources

- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest)

Happy building! 🚀
