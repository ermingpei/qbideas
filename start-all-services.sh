#!/bin/bash

# Start All Services Script
echo "🚀 Starting QB Ideas Platform"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if Docker is running
echo -e "${BLUE}1. Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo ""
    echo "Please start Docker Desktop first:"
    echo "  1. Open Docker Desktop application"
    echo "  2. Wait for it to fully start"
    echo "  3. Run this script again"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Start Docker services
echo -e "${BLUE}2. Starting Docker services...${NC}"
# Stop conflicting containers if running
docker stop qbideas-api >/dev/null 2>&1 || true
docker-compose up -d postgres redis minio mailhog
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to start Docker services${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker services started${NC}"
echo ""

# Wait for services to be healthy
echo -e "${BLUE}3. Waiting for services to be ready...${NC}"
echo "   This takes about 15 seconds..."
sleep 15
echo -e "${GREEN}✅ Services should be ready${NC}"
echo ""

# Check if services are running
echo -e "${BLUE}4. Verifying Docker containers...${NC}"
docker ps --format "table {{.Names}}\t{{.Status}}" | grep qbideas
echo ""

# Kill any existing processes on ports
echo -e "${BLUE}5. Cleaning up ports...${NC}"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "   Killed process on port 3000"
lsof -ti:3002 | xargs kill -9 2>/dev/null && echo "   Killed process on port 3002"
echo -e "${GREEN}✅ Ports cleaned${NC}"
echo ""

# Start API
echo -e "${BLUE}6. Starting API server...${NC}"
echo "   Starting in background..."
cd services/api
npm run dev > ../../api.log 2>&1 &
API_PID=$!
cd ../..
echo "   API PID: $API_PID"
echo "   Logs: tail -f api.log"
echo ""

# Wait for API to start
echo "   Waiting for API to start..."
sleep 10

# Check if API is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server is running${NC}"
else
    echo -e "${YELLOW}⚠️  API may still be starting...${NC}"
    echo "   Check logs: tail -f api.log"
fi
echo ""

# Start Frontend
echo -e "${BLUE}7. Starting Frontend server...${NC}"
echo "   Starting in background..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "   Frontend PID: $FRONTEND_PID"
echo "   Logs: tail -f frontend.log"
echo ""

# Wait for Frontend to start
echo "   Waiting for Frontend to start..."
sleep 10

# Check if Frontend is running
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend may still be starting...${NC}"
    echo "   Check logs: tail -f frontend.log"
fi
echo ""

# Summary
echo "=============================="
echo -e "${GREEN}🎉 All services started!${NC}"
echo "=============================="
echo ""
echo "📍 Access URLs:"
echo "   Frontend:  http://localhost:3002"
echo "   API:       http://localhost:3000"
echo "   API Docs:  http://localhost:3000/docs"
echo "   MailHog:   http://localhost:8025"
echo ""
echo "📊 Process IDs:"
echo "   API:       $API_PID"
echo "   Frontend:  $FRONTEND_PID"
echo ""
echo "📝 View Logs:"
echo "   API:       tail -f api.log"
echo "   Frontend:  tail -f frontend.log"
echo "   Docker:    docker-compose logs -f"
echo ""
echo "🧪 Test Features:"
echo "   ./test-interactions.sh"
echo "   ./test-idea-submission.sh"
echo ""
echo "🛑 Stop Services:"
echo "   kill $API_PID $FRONTEND_PID"
echo "   docker-compose down"
echo ""
echo "💡 Tip: Keep this terminal open to see the PIDs"
echo ""
