# qbideas Quick Reference

## 🚀 Start Everything

```bash
# Terminal 1: Start backend services
npm run dev

# Terminal 2: Start frontend
npm run dev:frontend
```

## 🔧 Common Commands

### Backend
```bash
# Generate Prisma client
cd services/api && npx prisma generate

# Run migrations
npm run migrate

# Seed ideas (from root)
cd services/api && npx tsx src/scripts/seed-ideas.ts

# Reset database
npm run db:reset

# View logs
npm run dev:logs

# Stop services
npm run dev:down
```

### Frontend
```bash
# Start dev server
npm run dev:frontend

# Build for production
cd frontend && npm run build

# Lint
cd frontend && npm run lint
```

### Database
```bash
# Connect to PostgreSQL
docker exec -it qbideas-postgres psql -U qbideas -d qbideas

# View tables
docker exec qbideas-postgres psql -U qbideas -d qbideas -c "\dt"

# Count ideas
docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT COUNT(*) FROM ideas;"
```

## 🌐 URLs

- **Frontend**: http://localhost:3002
- **API**: http://localhost:3000
- **Health Check**: http://localhost:3000/health
- **Mailhog**: http://localhost:8025
- **MinIO Console**: http://localhost:9001

## 🧪 Test Endpoints

```bash
# Health check
curl http://localhost:3000/health

# Get all ideas
curl http://localhost:3000/api/marketplace/ideas

# Get featured ideas
curl http://localhost:3000/api/marketplace/ideas/featured

# Get specific idea
curl http://localhost:3000/api/marketplace/ideas/ai-powered-code-review-assistant
```

## 🐛 Troubleshooting

### Prisma Client Error
```bash
cd services/api
npx prisma generate
```

### Database Connection Error
```bash
docker restart qbideas-postgres
sleep 5
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3002
lsof -ti:3002 | xargs kill -9
```

### Docker Issues
```bash
# Restart all services
npm run dev:down
npm run dev
```

### Frontend Not Loading
```bash
# Check if API is running
curl http://localhost:3000/health

# Restart frontend
# Stop the process (Ctrl+C) and run:
npm run dev:frontend
```

## 📊 Check Status

```bash
# Check Docker containers
docker ps

# Check API health
curl http://localhost:3000/health | jq

# Check database
docker exec qbideas-postgres psql -U qbideas -d qbideas -c "SELECT COUNT(*) FROM ideas;"

# Check frontend
curl -I http://localhost:3002
```

## 🔑 Environment Variables

### Required in `.env`
```env
DATABASE_URL=postgresql://qbideas:dev_password@postgres:5432/qbideas
JWT_SECRET=your-secret-key
OPENAI_API_KEY=sk-...
```

### Required in `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## 📝 Development Workflow

1. **Start services**: `npm run dev`
2. **Start frontend**: `npm run dev:frontend` (new terminal)
3. **Make changes**: Edit files (auto-reload)
4. **Test**: Use curl or browser
5. **Commit**: Git commit changes

## 🎯 Next Steps

### Week 3-4: Authentication
- [ ] Create auth routes
- [ ] Build login/signup pages
- [ ] Add JWT middleware
- [ ] Protect routes

### Week 5-6: Payments
- [ ] Stripe integration
- [ ] Checkout flow
- [ ] Unlock mechanism
- [ ] Payment history

## 📞 Help

- **Docs**: Check `docs/` folder
- **Setup**: See `SETUP.md`
- **Tests**: See `TEST_REPORT.md`
- **Status**: See `FINAL_STATUS.md`

---

**Quick Start**: `npm run dev` + `npm run dev:frontend` → http://localhost:3002
