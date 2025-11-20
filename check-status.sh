#!/bin/bash

echo "🔍 QB Ideas - System Status Check"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check Docker
echo "1. Docker Desktop:"
if docker ps > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Running${NC}"
    docker ps --format "   - {{.Names}}: {{.Status}}" | grep qbideas
else
    echo -e "   ${RED}❌ NOT RUNNING${NC}"
    echo ""
    echo "   👉 YOU NEED TO START DOCKER DESKTOP!"
    echo "   1. Open 'Docker Desktop' application"
    echo "   2. Wait for whale icon in menu bar"
    echo "   3. Then run this script again"
    echo ""
fi
echo ""

# Check API
echo "2. API Server (port 3000):"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Running and responding${NC}"
else
    echo -e "   ${RED}❌ Not responding${NC}"
    if ps aux | grep -v grep | grep "services/api" | grep "npm run dev" > /dev/null; then
        echo "   ⚠️  Process exists but not responding"
        echo "   Check: tail -f api.log"
    else
        echo "   ⚠️  Not started"
        echo "   Start: cd services/api && npm run dev"
    fi
fi
echo ""

# Check Frontend
echo "3. Frontend (port 3002):"
if curl -s http://localhost:3002 > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Running and responding${NC}"
else
    echo -e "   ${RED}❌ Not responding${NC}"
    if ps aux | grep -v grep | grep "frontend" | grep "npm run dev" > /dev/null; then
        echo "   ⚠️  Process exists but not responding"
    else
        echo "   ⚠️  Not started"
        echo "   Start: cd frontend && npm run dev"
    fi
fi
echo ""

# Summary
echo "=================================="
echo "Summary:"
echo ""

DOCKER_OK=false
API_OK=false
FRONTEND_OK=false

if docker ps > /dev/null 2>&1; then
    DOCKER_OK=true
fi

if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    API_OK=true
fi

if curl -s http://localhost:3002 > /dev/null 2>&1; then
    FRONTEND_OK=true
fi

if [ "$DOCKER_OK" = true ] && [ "$API_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ Everything is working!${NC}"
    echo ""
    echo "🌐 Open: http://localhost:3002"
else
    echo -e "${RED}❌ Some services are not working${NC}"
    echo ""
    echo "To fix:"
    echo ""
    
    if [ "$DOCKER_OK" = false ]; then
        echo "1. ${RED}START DOCKER DESKTOP${NC} (most important!)"
        echo "   - Open Docker Desktop app"
        echo "   - Wait for it to start"
        echo ""
    fi
    
    if [ "$DOCKER_OK" = true ] && [ "$API_OK" = false ]; then
        echo "2. Start database:"
        echo "   docker-compose up -d"
        echo "   sleep 10"
        echo ""
        echo "3. Start API:"
        echo "   cd services/api"
        echo "   npm run dev"
        echo ""
    fi
    
    if [ "$FRONTEND_OK" = false ]; then
        echo "4. Start Frontend:"
        echo "   cd frontend"
        echo "   npm run dev"
        echo ""
    fi
    
    echo "Or run: ./fix-and-start.sh"
fi
echo ""
