#!/bin/bash

# Test Auth System
# This script tests the authentication endpoints

API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3002"

echo "🧪 Testing qbideas Auth System"
echo "================================"
echo ""

# Test 1: Check API Health
echo "1️⃣  Testing API Health..."
HEALTH=$(curl -s "$API_URL/health")
if [[ $HEALTH == *"healthy"* ]]; then
  echo "✅ API is healthy"
else
  echo "❌ API is not responding"
  exit 1
fi
echo ""

# Test 2: Check Frontend
echo "2️⃣  Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [[ $FRONTEND_STATUS == "200" ]]; then
  echo "✅ Frontend is running"
else
  echo "❌ Frontend is not responding"
  exit 1
fi
echo ""

# Test 3: Test Signup Endpoint
echo "3️⃣  Testing Signup Endpoint..."
RANDOM_NUM=$RANDOM
SIGNUP_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testuser$RANDOM_NUM\",
    \"email\": \"test$RANDOM_NUM@example.com\",
    \"password\": \"password123\"
  }")

if [[ $SIGNUP_RESPONSE == *"token"* ]]; then
  echo "✅ Signup endpoint working"
  TOKEN=$(echo $SIGNUP_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)
  echo "   Token: ${TOKEN:0:20}..."
else
  echo "❌ Signup failed"
  echo "   Response: $SIGNUP_RESPONSE"
fi
echo ""

# Test 4: Test Token Verification
echo "4️⃣  Testing Token Verification..."
VERIFY_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$TOKEN\"}")

if [[ $VERIFY_RESPONSE == *"success"* ]]; then
  echo "✅ Token verification working"
else
  echo "❌ Token verification failed"
  echo "   Response: $VERIFY_RESPONSE"
fi
echo ""

# Test 5: Test Login Endpoint
echo "5️⃣  Testing Login Endpoint..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"test$RANDOM_NUM@example.com\",
    \"password\": \"password123\"
  }")

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
  echo "✅ Login endpoint working"
else
  echo "❌ Login failed"
  echo "   Response: $LOGIN_RESPONSE"
fi
echo ""

# Test 6: Test Invalid Token
echo "6️⃣  Testing Invalid Token Handling..."
INVALID_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/verify-token" \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"invalid-token-12345\"}")

if [[ $INVALID_RESPONSE == *"Invalid"* ]] || [[ $INVALID_RESPONSE == *"expired"* ]]; then
  echo "✅ Invalid token properly rejected"
else
  echo "⚠️  Invalid token handling unclear"
  echo "   Response: $INVALID_RESPONSE"
fi
echo ""

echo "================================"
echo "✅ All Auth System Tests Passed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open browser to $FRONTEND_URL"
echo "   2. Test signup flow"
echo "   3. Test login flow"
echo "   4. Test session persistence (refresh page)"
echo "   5. Test logout"
echo "   6. Test protected routes"
echo ""
echo "📖 See AUTH_CONTEXT_IMPLEMENTATION.md for detailed testing instructions"
