#!/bin/bash

# ==============================================
# Logen System Health Check
# ==============================================
# This script validates that all core services 
# and pages are working properly
# ==============================================

set -e  # Exit on first error

echo "🔍 Logen System Health Check Starting..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to check HTTP endpoint
check_endpoint() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    echo -n "Checking $description... "
    
    if response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 30 "$url" 2>/dev/null); then
        if [ "$response" -eq "$expected_code" ]; then
            echo -e "${GREEN}✅ OK (${response})${NC}"
        else
            echo -e "${RED}❌ FAILED (Expected: ${expected_code}, Got: ${response})${NC}"
            FAILURES=$((FAILURES + 1))
        fi
    else
        echo -e "${RED}❌ FAILED (Connection error)${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

# Function to check if process is running on port
check_port() {
    local port=$1
    local service_name=$2
    
    echo -n "Checking $service_name on port $port... "
    
    if netstat -tlnp 2>/dev/null | grep -q ":$port " || lsof -i :$port > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Running${NC}"
    else
        echo -e "${RED}❌ Not running${NC}"
        FAILURES=$((FAILURES + 1))
    fi
}

# ==============================================
# 1. Check Core Services
# ==============================================
echo -e "\n${YELLOW}📊 Checking Core Services${NC}"
echo "----------------------------"

check_port 7600 "Backend API"
check_port 7601 "Frontend Server"

# Check if postgres container is running
echo -n "Checking PostgreSQL container... "
if docker ps --filter "name=logen-postgres" --filter "status=running" | grep -q logen-postgres; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
    FAILURES=$((FAILURES + 1))
fi

# ==============================================
# 2. Check Backend API Health
# ==============================================
echo -e "\n${YELLOW}🔧 Checking Backend API${NC}"
echo "-------------------------"

check_endpoint "http://localhost:7600/api/health" "Health endpoint"
check_endpoint "http://localhost:7600/" "Root endpoint"
check_endpoint "http://localhost:7600/api/metrics" "Metrics endpoint"

# ==============================================
# 3. Check Critical Frontend Pages
# ==============================================
echo -e "\n${YELLOW}🌐 Checking Critical Frontend Pages${NC}"
echo "-------------------------------------"

# Core pages that must work
CRITICAL_PAGES=(
    "/"
    "/login"
    "/register"
    "/sites"
    "/sites/create"
    "/wizard"
    "/dashboard"
)

for page in "${CRITICAL_PAGES[@]}"; do
    check_endpoint "http://localhost:7601$page" "Page: $page"
done

# ==============================================
# 4. Check API Authentication Endpoints
# ==============================================
echo -e "\n${YELLOW}🔐 Checking Authentication Endpoints${NC}"
echo "--------------------------------------"

check_endpoint "http://localhost:7600/customer/auth/profile" "Customer auth profile" 401
check_endpoint "http://localhost:7600/auth/profile" "Admin auth profile" 401

# ==============================================
# 5. Database Connection Test
# ==============================================
echo -e "\n${YELLOW}🗄️  Database Connection Test${NC}"
echo "------------------------------"

# Test with a simple curl to an endpoint that requires DB
check_endpoint "http://localhost:7600/customer/sites" "Customer sites (DB test)" 401

# ==============================================
# 6. Final Results
# ==============================================
echo -e "\n=========================================="
echo "🔍 Health Check Complete"
echo "=========================================="

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS HEALTHY!${NC}"
    echo -e "Total checks passed: All"
    exit 0
else
    echo -e "${RED}❌ $FAILURES CHECKS FAILED${NC}"
    echo -e "Please review the failures above"
    echo ""
    echo -e "${YELLOW}Quick recovery options:${NC}"
    echo "1. Run: ./scripts/start-services.sh"
    echo "2. Check logs: ./scripts/check-logs.sh"
    echo "3. Reset to golden master: git reset --hard golden-master-working"
    exit 1
fi