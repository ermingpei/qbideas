### Quick Start
# 1. Start backend
npm run dev
npm run migrate
npm run seed:ideas

# 2. Start frontend (new terminal)
npm run dev:frontend

# 3. Open browser
# Frontend: http://localhost:3002
# API: http://localhost:3000

### Verify
# Check API
curl http://localhost:3000/health

# Check ideas
curl http://localhost:3000/api/marketplace/ideas

# Check frontend
curl http://localhost:3002
