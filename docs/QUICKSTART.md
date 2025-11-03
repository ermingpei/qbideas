# Quick Start Guide

Get qbidea marketplace running locally in 5 minutes.

## Prerequisites

- Node.js 20+
- Docker Desktop
- Git

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/yourusername/qbidea.git
cd qbidea
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and add:
```env
# Required
DATABASE_URL="postgresql://qbidea:dev_password@localhost:5432/qbidea"
JWT_SECRET="your-secret-key-change-in-production"
OPENAI_API_KEY="sk-..."

# Optional for MVP
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 3. Start Services

```bash
# Start PostgreSQL, Redis, etc.
npm run dev

# Wait for services to be ready (30 seconds)
```

### 4. Run Migrations

```bash
# Create database tables
npm run migrate

# Seed sample ideas
npx tsx services/api/src/scripts/seed-ideas.ts
```

### 5. Access the Platform

- **API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **Database**: postgresql://localhost:5432/qbidea

## Test the API

### Browse Ideas
```bash
curl http://localhost:3000/api/marketplace/ideas
```

### Get Idea Details
```bash
curl http://localhost:3000/api/marketplace/ideas/ai-powered-code-review-assistant
```

### Get Featured Ideas
```bash
curl http://localhost:3000/api/marketplace/ideas/featured
```

## Next Steps

1. **Build Frontend**: Start with `frontend/` directory
2. **Add Authentication**: Implement sign up/login UI
3. **Integrate Stripe**: Add payment flows
4. **Generate More Ideas**: Use OpenAI to create content

## Common Commands

```bash
# Start development
npm run dev

# View logs
npm run dev:logs

# Stop services
npm run dev:down

# Reset database
npm run db:reset

# Generate Prisma client
npm run generate

# Run tests
npm test
```

## Troubleshooting

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database Connection Error
```bash
# Restart Docker services
npm run dev:down
npm run dev
```

### Prisma Client Not Generated
```bash
cd services/api
npx prisma generate
```

## Project Structure

```
qbidea/
├── services/
│   └── api/              # Main API service
│       ├── src/
│       │   ├── routes/   # API endpoints
│       │   ├── middleware/
│       │   ├── utils/
│       │   └── scripts/  # Seed scripts
│       └── prisma/       # Database schema
├── frontend/             # Next.js app (to be built)
├── docs/                 # Documentation
└── docker-compose.yml    # Local development stack
```

## Development Workflow

1. Make changes to code
2. API auto-reloads (nodemon)
3. Test with curl or Postman
4. Commit changes
5. Push to GitHub

## Need Help?

- Check [marketplace-mvp.md](./marketplace-mvp.md) for detailed docs
- Review API routes in `services/api/src/routes/marketplace.ts`
- Inspect database schema in `services/api/prisma/schema.prisma`
- Open an issue on GitHub

Happy building! 🚀
