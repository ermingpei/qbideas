#!/bin/bash

echo "🧪 Testing qbidea Frontend"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Test API
echo "1. Testing API Connection..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health)
if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} API is responding (200 OK)"
else
    echo -e "${RED}✗${NC} API is not responding (Status: $API_STATUS)"
fi

# Test Ideas Endpoint
echo ""
echo "2. Testing Ideas Endpoint..."
IDEAS_COUNT=$(curl -s http://localhost:3000/api/marketplace/ideas | jq -r '.data.pagination.total' 2>/dev/null)
if [ ! -z "$IDEAS_COUNT" ] && [ "$IDEAS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Ideas endpoint working ($IDEAS_COUNT ideas)"
else
    echo -e "${RED}✗${NC} Ideas endpoint not working"
fi

# Test Frontend
echo ""
echo "3. Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Frontend is responding (200 OK)"
else
    echo -e "${RED}✗${NC} Frontend is not responding (Status: $FRONTEND_STATUS)"
fi

# Test CORS
echo ""
echo "4. Testing CORS..."
CORS_HEADER=$(curl -s -H "Origin: http://localhost:3002" -I http://localhost:3000/api/marketplace/ideas | grep -i "access-control-allow-origin")
if [ ! -z "$CORS_HEADER" ]; then
    echo -e "${GREEN}✓${NC} CORS is configured"
else
    echo -e "${YELLOW}⚠${NC} CORS header not found (might be okay)"
fi

# Test Ideas Page
echo ""
echo "5. Testing Ideas Page..."
IDEAS_PAGE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ideas)
if [ "$IDEAS_PAGE_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Ideas page is responding (200 OK)"
else
    echo -e "${RED}✗${NC} Ideas page is not responding (Status: $IDEAS_PAGE_STATUS)"
fi

# Test Trending Page
echo ""
echo "6. Testing Trending Page..."
TRENDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/trending)
if [ "$TRENDING_STATUS" = "200" ]; then
    echo -e "${GREEN}✓${NC} Trending page is responding (200 OK)"
else
    echo -e "${RED}✗${NC} Trending page is not responding (Status: $TRENDING_STATUS)"
fi

# Sample API Response
echo ""
echo "7. Sample Idea Data..."
SAMPLE_IDEA=$(curl -s http://localhost:3000/api/marketplace/ideas | jq -r '.data.ideas[0] | {title, category, slug}' 2>/dev/null)
if [ ! -z "$SAMPLE_IDEA" ]; then
    echo -e "${GREEN}✓${NC} Sample idea:"
    echo "$SAMPLE_IDEA"
else
    echo -e "${RED}✗${NC} Could not fetch sample idea"
fi

echo ""
echo "=========================="
echo "Test Complete!"
echo ""
echo "URLs to test in browser:"
echo "  Homepage:  http://localhost:3002"
echo "  Ideas:     http://localhost:3002/ideas"
echo "  Trending:  http://localhost:3002/trending"
echo "  API:       http://localhost:3000/health"
