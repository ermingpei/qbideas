#!/bin/bash

echo "🔧 QB Ideas - Quick Fix & Start"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check Docker
echo -e "${BLUE}Checking Docker...${NC}"
if ! docker ps > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is NOT running${NC}"
    echo ""
    echo "Please start Docker Desktop:"
    echo "  1. Open 'Docker Desktop' application"
    echo "  2. Wait for it to start (whale icon in menu bar)"
    echo "  3. Run this script again"
    echo ""
    echo "Or run manually:"
    echo "  open -a Docker"
    echo ""
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"
echo ""

# Start Docker services
echo -e "${BLUE}Starting database and services...${NC}"
docker-compose up -d
sleep 10
echo -e "${GREEN}✅ Database started${NC}"
echo ""

# Check if API is already running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3000 is in use, killing process...${NC}"
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Check if Frontend is already running
if lsof -Pi :3002 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port 3002 is in use, killing process...${NC}"
    lsof -ti:3002 | xargs kill -9 2>/dev/null
    sleep 2
fi

# Start API in background
echo -e "${BLUE}Starting API server...${NC}"
cd services/api
nohup npm run dev > ../../api.log 2>&1 &
API_PID=$!
cd ../..
echo "API PID: $API_PID"
echo ""

# Wait for API
echo "Waiting for API to start..."
for i in {1..30}; do
    if curl -s http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ API is running!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""
echo ""

# Start Frontend in background
echo -e "${BLUE}Starting Frontend...${NC}"
cd frontend
nohup npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo "Frontend PID: $FRONTEND_PID"
echo ""

# Wait for Frontend
echo "Waiting for Frontend to start..."
for i in {1..30}; do
    if curl -s http://localhost:3002 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is running!${NC}"
        break
    fi
    echo -n "."
    sleep 1
done
echo ""
echo ""

# Final check
echo "================================"
echo -e "${GREEN}🎉 Services Started!${NC}"
echo "================================"
echo ""

# Test API
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API:${NC} http://localhost:3000"
else
    echo -e "${RED}❌ API:${NC} Not responding"
    echo "   Check logs: tail -f api.log"
fi

# Test Frontend
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend:${NC} http://localhost:3002"
else
    echo -e "${RED}❌ Frontend:${NC} Not responding"
    echo "   Check logs: tail -f frontend.log"
fi

echo ""
echo "📝 View Logs:"
echo "   tail -f api.log"
echo "   tail -f frontend.log"
echo ""
echo "🛑 Stop Services:"
echo "   kill $API_PID $FRONTEND_PID"
echo "   docker-compose down"
echo ""
echo "🌐 Open Browser:"
echo "   http://localhost:3002"
echo ""
