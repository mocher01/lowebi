#!/bin/bash

# ==============================================
# Logen Regression Test Suite
# ==============================================
# Tests core user journeys to prevent regressions
# ==============================================

set -e

echo "🧪 Logen Regression Test Suite"
echo "=============================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

FAILURES=0

# Function to test API endpoint with payload
test_api() {
    local method=$1
    local url=$2
    local description=$3
    local expected_code=$4
    local payload=$5
    
    echo -n "Testing $description... "
    
    if [ -n "$payload" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            -X "$method" \
            -H "Content-Type: application/json" \
            -d "$payload" \
            --connect-timeout 10 \
            --max-time 30 \
            "$url" 2>/dev/null)
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" \
            -X "$method" \
            --connect-timeout 10 \
            --max-time 30 \
            "$url" 2>/dev/null)
    fi
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✅ OK (${response})${NC}"
    else
        echo -e "${RED}❌ FAILED (Expected: ${expected_code}, Got: ${response})${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

# ==============================================
# 1. Test Customer Registration Flow
# ==============================================
echo -e "\n${YELLOW}👤 Testing Customer Registration Flow${NC}"
echo "--------------------------------------"

# Test customer registration endpoint exists and validates input
test_api "POST" "http://localhost:7600/customer/auth/register" \
    "Customer registration (invalid data)" 400 \
    '{"email":"invalid-email","password":"short"}'

test_api "POST" "http://localhost:7600/customer/auth/register" \
    "Customer registration (missing fields)" 400 \
    '{}'

# ==============================================
# 2. Test Customer Login Flow
# ==============================================
echo -e "\n${YELLOW}🔐 Testing Customer Login Flow${NC}"
echo "--------------------------------"

test_api "POST" "http://localhost:7600/customer/auth/login" \
    "Customer login (invalid credentials)" 401 \
    '{"email":"test@example.com","password":"wrongpassword"}'

test_api "POST" "http://localhost:7600/customer/auth/login" \
    "Customer login (missing fields)" 400 \
    '{}'

# ==============================================
# 3. Test Protected Routes
# ==============================================
echo -e "\n${YELLOW}🛡️  Testing Protected Routes${NC}"
echo "-----------------------------"

test_api "GET" "http://localhost:7600/customer/auth/profile" \
    "Customer profile (no auth)" 401

test_api "GET" "http://localhost:7600/customer/sites" \
    "Customer sites (no auth)" 401

test_api "GET" "http://localhost:7600/admin/users" \
    "Admin users (no auth)" 401

# ==============================================
# 4. Test Wizard Session Creation
# ==============================================
echo -e "\n${YELLOW}🧙 Testing Wizard Session Creation${NC}"
echo "-----------------------------------"

# Test wizard session endpoints exist
test_api "POST" "http://localhost:7600/customer/wizard/start" \
    "Wizard session start (no auth)" 401

test_api "GET" "http://localhost:7600/customer/wizard" \
    "Wizard sessions list (no auth)" 401

# ==============================================
# 5. Test Template Endpoints
# ==============================================
echo -e "\n${YELLOW}📄 Testing Template Endpoints${NC}"
echo "------------------------------"

test_api "GET" "http://localhost:7600/customer/templates" \
    "Customer templates (no auth)" 401

test_api "GET" "http://localhost:7600/customer/templates/categories" \
    "Template categories (no auth)" 401

# ==============================================
# 6. Test Public Endpoints
# ==============================================
echo -e "\n${YELLOW}🌍 Testing Public Endpoints${NC}"
echo "----------------------------"

test_api "GET" "http://localhost:7600/api/health" \
    "Public health check" 200

test_api "GET" "http://localhost:7600/api/templates" \
    "Public templates" 404

# ==============================================
# 7. Test Frontend Pages Load
# ==============================================
echo -e "\n${YELLOW}🌐 Testing Frontend Page Loads${NC}"
echo "--------------------------------"

# Core pages
PAGES=("/" "/login" "/register" "/sites" "/sites/create" "/wizard" "/wizard-v2")

for page in "${PAGES[@]}"; do
    test_api "GET" "http://localhost:7601$page" "Frontend page: $page" 200
done

# ==============================================
# 8. Test Error Handling
# ==============================================
echo -e "\n${YELLOW}⚠️  Testing Error Handling${NC}"
echo "---------------------------"

test_api "GET" "http://localhost:7600/nonexistent" \
    "404 handling" 404

test_api "POST" "http://localhost:7600/customer/auth/login" \
    "Malformed JSON handling" 400 \
    'invalid-json'

# ==============================================
# Final Results
# ==============================================
echo -e "\n=============================="
echo "🧪 Regression Tests Complete"
echo "=============================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo "No regressions detected"
    exit 0
else
    echo -e "${RED}❌ $FAILURES TESTS FAILED${NC}"
    echo "Regressions detected - please investigate"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Run health check: ./scripts/health-check.sh"
    echo "2. Check logs: ./scripts/check-logs.sh"
    echo "3. Compare with golden master: git diff golden-master-working"
    exit 1
fi