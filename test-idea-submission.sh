#!/bin/bash

# Test Idea Submission Feature
echo "🧪 Testing Idea Submission Feature"
echo "===================================="
echo ""

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3002"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Submission Feature Status${NC}"
echo "-----------------------------------"
echo ""

# Check if API is running
echo "1. Checking API server..."
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ API is running${NC}"
else
    echo -e "   ${RED}❌ API is not running${NC}"
    echo "   Start it with: cd services/api && npm run dev"
    exit 1
fi

# Check if Frontend is running
echo "2. Checking Frontend server..."
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "   ${GREEN}✅ Frontend is running${NC}"
else
    echo -e "   ${RED}❌ Frontend is not running${NC}"
    echo "   Start it with: cd frontend && npm run dev"
    exit 1
fi

echo ""
echo -e "${BLUE}🎯 Submission Locations${NC}"
echo "-----------------------------------"
echo ""
echo "Users can submit ideas from:"
echo -e "  1. ${GREEN}Header Button${NC} - Always visible when logged in"
echo -e "  2. ${GREEN}Ideas Page Banner${NC} - $FRONTEND_URL/ideas"
echo -e "  3. ${GREEN}Homepage Button${NC} - $FRONTEND_URL"
echo -e "  4. ${GREEN}Direct URL${NC} - $FRONTEND_URL/ideas/submit"
echo ""

echo -e "${BLUE}💰 Pricing Options${NC}"
echo "-----------------------------------"
echo ""
echo "Regular (Free) Tier:"
echo "  • Free for all users"
echo "  • Maximum visibility"
echo "  • Build reputation"
echo ""
echo "Premium (Paid) Tier:"
echo "  • Set price: \$0.99 - \$99.99"
echo "  • Earn 70% per unlock"
echo "  • Example: \$9.99 → You earn \$6.99"
echo ""

echo -e "${BLUE}📝 Required Fields${NC}"
echo "-----------------------------------"
echo ""
echo "  ✓ Title (10-200 chars)"
echo "  ✓ Category (select one)"
echo "  ✓ Teaser Description (50-200 chars)"
echo "  ✓ Problem Statement (20+ chars)"
echo "  ✓ Target Audience (10+ chars)"
echo "  ✓ Proposed Solution (20+ chars)"
echo "  ✓ Pricing Model (Free or Paid)"
echo "  ✓ Unlock Price (if Premium)"
echo ""

echo -e "${BLUE}🧪 Manual Testing Steps${NC}"
echo "-----------------------------------"
echo ""
echo "1. Open browser: $FRONTEND_URL"
echo "2. Login or signup"
echo "3. Click 'Submit Idea' button in header"
echo "4. Fill out all required fields"
echo "5. Choose pricing model:"
echo "   - Free: Select 'Regular Tier'"
echo "   - Paid: Select 'Premium Tier' and set price"
echo "6. Review and submit"
echo "7. Check for success message"
echo ""

echo -e "${BLUE}✅ Expected Results${NC}"
echo "-----------------------------------"
echo ""
echo "Success Response:"
echo "  • Status: 201 Created"
echo "  • Message: 'Idea submitted successfully'"
echo "  • Redirect to submission status page"
echo "  • Idea status: 'pending_review'"
echo ""
echo "Error Responses:"
echo "  • 400: Validation error (check field requirements)"
echo "  • 401: Not authenticated (login required)"
echo "  • 429: Rate limit (max 5 per day)"
echo ""

echo -e "${BLUE}📊 Revenue Examples${NC}"
echo "-----------------------------------"
echo ""
echo "If you set price at \$9.99:"
echo "  • 10 unlocks = \$69.90"
echo "  • 50 unlocks = \$349.50"
echo "  • 100 unlocks = \$699.00"
echo ""
echo "If you set price at \$19.99:"
echo "  • 10 unlocks = \$139.90"
echo "  • 50 unlocks = \$699.50"
echo "  • 100 unlocks = \$1,399.00"
echo ""

echo -e "${GREEN}✅ All systems ready for testing!${NC}"
echo ""
echo "📚 Documentation:"
echo "  • Full guide: IDEA_SUBMISSION_FIXED.md"
echo "  • User guide: SUBMIT_IDEAS_GUIDE.md"
echo "  • Quick ref: WHERE_TO_SUBMIT_IDEAS.md"
echo ""
echo "🚀 Start testing at: $FRONTEND_URL/ideas/submit"
