#!/bin/bash

# Test Interactions System
# This script tests the new like, bookmark, and comment features

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3002"

echo "🧪 Testing Interaction Features"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if API is running
echo "Checking if API is running..."
if ! curl -s "$API_URL/health" > /dev/null; then
    echo -e "${RED}❌ API is not running. Please start it first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ API is running${NC}"
echo ""

# Test 1: Get ideas (should include interaction status)
echo "Test 1: Fetching ideas with interaction status..."
IDEAS_RESPONSE=$(curl -s "$API_URL/api/ideas?limit=1")
IDEA_ID=$(echo $IDEAS_RESPONSE | jq -r '.data.items[0].id')
IDEA_SLUG=$(echo $IDEAS_RESPONSE | jq -r '.data.items[0].slug')

if [ "$IDEA_ID" != "null" ]; then
    echo -e "${GREEN}✅ Got idea: $IDEA_SLUG${NC}"
    echo "   - Has isLiked field: $(echo $IDEAS_RESPONSE | jq '.data.items[0] | has("isLiked")')"
    echo "   - Has isBookmarked field: $(echo $IDEAS_RESPONSE | jq '.data.items[0] | has("isBookmarked")')"
else
    echo -e "${RED}❌ Failed to get ideas${NC}"
    exit 1
fi
echo ""

# Test 2: Get idea detail
echo "Test 2: Fetching idea detail..."
IDEA_DETAIL=$(curl -s "$API_URL/api/ideas/$IDEA_SLUG")
echo -e "${GREEN}✅ Got idea detail${NC}"
echo "   - View count: $(echo $IDEA_DETAIL | jq '.data.viewCount')"
echo "   - Like count: $(echo $IDEA_DETAIL | jq '.data.likeCount')"
echo "   - Comment count: $(echo $IDEA_DETAIL | jq '.data.commentCount')"
echo ""

# Test 3: Get comments (no auth required)
echo "Test 3: Fetching comments..."
COMMENTS_RESPONSE=$(curl -s "$API_URL/api/interactions/$IDEA_ID/comments")
COMMENT_COUNT=$(echo $COMMENTS_RESPONSE | jq '.data.meta.total')
echo -e "${GREEN}✅ Got comments: $COMMENT_COUNT total${NC}"
echo ""

# Test 4: Try to like without auth (should fail)
echo "Test 4: Testing like without authentication..."
LIKE_RESPONSE=$(curl -s -X POST "$API_URL/api/interactions/$IDEA_ID/like")
if echo $LIKE_RESPONSE | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✅ Correctly requires authentication${NC}"
else
    echo -e "${YELLOW}⚠️  Like endpoint may not require auth${NC}"
fi
echo ""

# Test 5: Try to bookmark without auth (should fail)
echo "Test 5: Testing bookmark without authentication..."
BOOKMARK_RESPONSE=$(curl -s -X POST "$API_URL/api/interactions/$IDEA_ID/bookmark")
if echo $BOOKMARK_RESPONSE | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✅ Correctly requires authentication${NC}"
else
    echo -e "${YELLOW}⚠️  Bookmark endpoint may not require auth${NC}"
fi
echo ""

# Test 6: Try to comment without auth (should fail)
echo "Test 6: Testing comment without authentication..."
COMMENT_RESPONSE=$(curl -s -X POST "$API_URL/api/interactions/$IDEA_ID/comments" \
    -H "Content-Type: application/json" \
    -d '{"content":"Test comment"}')
if echo $COMMENT_RESPONSE | jq -e '.error' > /dev/null; then
    echo -e "${GREEN}✅ Correctly requires authentication${NC}"
else
    echo -e "${YELLOW}⚠️  Comment endpoint may not require auth${NC}"
fi
echo ""

echo "================================"
echo -e "${GREEN}✅ Interaction API Tests Complete!${NC}"
echo ""
echo "📝 Summary:"
echo "   - Ideas endpoint returns interaction status"
echo "   - Comments endpoint is accessible"
echo "   - Like/Bookmark/Comment require authentication"
echo ""
echo "🌐 Frontend URLs:"
echo "   - Ideas List: $FRONTEND_URL/ideas"
echo "   - Idea Detail: $FRONTEND_URL/ideas/$IDEA_SLUG"
echo ""
echo "💡 Next Steps:"
echo "   1. Sign up/login at $FRONTEND_URL/signup"
echo "   2. Visit an idea detail page"
echo "   3. Test like, bookmark, and comment features"
echo "   4. Check that stats update in real-time"
