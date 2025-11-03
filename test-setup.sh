#!/bin/bash

echo "🧪 qbidea Setup Test"
echo "===================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0

# Helper functions
pass() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASSED++))
}

fail() {
    echo -e "${RED}✗${NC} $1"
    ((FAILED++))
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Test 1: Check Node.js version
echo "1. Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -ge 20 ]; then
    pass "Node.js version: $(node -v)"
else
    fail "Node.js version too old: $(node -v). Need 20+"
fi
echo ""

# Test 2: Check if dependencies are installed
echo "2. Checking dependencies..."
if [ -d "node_modules" ]; then
    pass "Root dependencies installed"
else
    fail "Root dependencies not installed. Run: npm install"
fi

if [ -d "services/api/node_modules" ]; then
    pass "API dependencies installed"
else
    fail "API dependencies not installed"
fi

if [ -d "frontend/node_modules" ]; then
    pass "Frontend dependencies installed"
else
    warn "Frontend dependencies not installed. Run: cd frontend && npm install"
fi
echo ""

# Test 3: Check environment files
echo "3. Checking environment configuration..."
if [ -f ".env" ]; then
    pass ".env file exists"
    
    if grep -q "JWT_SECRET" .env; then
        pass "JWT_SECRET configured"
    else
        warn "JWT_SECRET not set in .env"
    fi
    
    if grep -q "OPENAI_API_KEY" .env; then
        pass "OPENAI_API_KEY configured"
    else
        warn "OPENAI_API_KEY not set (optional for testing)"
    fi
else
    fail ".env file missing. Run: cp .env.example .env"
fi

if [ -f "frontend/.env.local" ]; then
    pass "Frontend .env.local exists"
else
    warn "Frontend .env.local missing (will use defaults)"
fi
echo ""

# Test 4: Check Docker
echo "4. Checking Docker..."
if command -v docker &> /dev/null; then
    pass "Docker installed"
    
    if docker ps &> /dev/null; then
        pass "Docker daemon running"
        
        # Check if containers are running
        if docker ps | grep -q "qbidea"; then
            pass "qbidea containers running"
        else
            warn "qbidea containers not running. Run: npm run dev"
        fi
    else
        warn "Docker daemon not running. Start Docker Desktop"
    fi
else
    fail "Docker not installed"
fi
echo ""

# Test 5: Check file structure
echo "5. Checking project structure..."
REQUIRED_FILES=(
    "services/api/src/routes/marketplace.ts"
    "services/api/src/scripts/seed-ideas.ts"
    "services/api/prisma/schema.prisma"
    "frontend/app/page.tsx"
    "frontend/app/ideas/page.tsx"
    "frontend/components/IdeaCard.tsx"
    "frontend/lib/api.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        pass "$file exists"
    else
        fail "$file missing"
    fi
done
echo ""

# Test 6: Check Prisma
echo "6. Checking Prisma setup..."
if [ -d "services/api/node_modules/.prisma" ]; then
    pass "Prisma client generated"
else
    warn "Prisma client not generated. Run: cd services/api && npx prisma generate"
fi
echo ""

# Test 7: TypeScript compilation check
echo "7. Checking TypeScript..."
cd services/api
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    warn "TypeScript errors found in API"
else
    pass "API TypeScript compiles"
fi
cd ../..

cd frontend
if npx tsc --noEmit 2>&1 | grep -q "error TS"; then
    warn "TypeScript errors found in Frontend"
else
    pass "Frontend TypeScript compiles"
fi
cd ..
echo ""

# Summary
echo "===================="
echo "Test Summary"
echo "===================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All critical tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Start Docker Desktop"
    echo "2. Run: npm run dev"
    echo "3. Run: npm run migrate"
    echo "4. Run: npm run seed:ideas"
    echo "5. Run: npm run dev:frontend (in new terminal)"
    echo "6. Open: http://localhost:3002"
else
    echo -e "${RED}✗ Some tests failed. Fix the issues above.${NC}"
fi
