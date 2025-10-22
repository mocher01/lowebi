#!/bin/bash

# ==============================================
# Logen Service Stop Script
# ==============================================
# Safely stops all Logen services
# ==============================================

echo "🛑 Stopping Logen Services"
echo "=========================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to kill processes on port
kill_port() {
    local port=$1
    local service_name=$2
    
    echo -n "Stopping $service_name on port $port... "
    
    if lsof -i :$port > /dev/null 2>&1; then
        # Get PIDs and kill them
        pids=$(lsof -ti :$port)
        kill $pids 2>/dev/null
        
        # Wait a moment, then force kill if necessary
        sleep 2
        if lsof -i :$port > /dev/null 2>&1; then
            echo -e "${YELLOW}Force killing...${NC}"
            kill -9 $pids 2>/dev/null || true
        fi
        
        # Verify stopped
        if lsof -i :$port > /dev/null 2>&1; then
            echo -e "${RED}❌ Failed to stop${NC}"
        else
            echo -e "${GREEN}✅ Stopped${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  Not running${NC}"
    fi
}

# ==============================================
# 1. Stop Application Services
# ==============================================
echo -e "\n${BLUE}🔧 Stopping Application Services${NC}"
echo "-----------------------------------"

kill_port 7600 "Backend API"
kill_port 7601 "Frontend Server"
kill_port 7602 "Admin Frontend" # In case it's running

# ==============================================
# 2. Stop Docker Services (Optional)
# ==============================================
echo -e "\n${BLUE}🐳 Docker Services${NC}"
echo "------------------"

read -p "Stop PostgreSQL container? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Stopping PostgreSQL container..."
    docker stop logen-postgres 2>/dev/null || echo "Container not running"
    echo -e "${GREEN}✅ PostgreSQL container stopped${NC}"
fi

# ==============================================
# 3. Clean up log files
# ==============================================
echo -e "\n${BLUE}🧹 Cleanup${NC}"
echo "----------"

read -p "Remove log files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f /tmp/logen-backend.log
    rm -f /tmp/logen-frontend.log
    echo -e "${GREEN}✅ Log files cleaned${NC}"
fi

# ==============================================
# 4. Verify All Stopped
# ==============================================
echo -e "\n${BLUE}✅ Verification${NC}"
echo "----------------"

if ! lsof -i :7600 -i :7601 -i :7602 > /dev/null 2>&1; then
    echo -e "${GREEN}🎉 All Logen services stopped successfully${NC}"
else
    echo -e "${YELLOW}⚠️  Some processes may still be running:${NC}"
    lsof -i :7600 -i :7601 -i :7602 2>/dev/null || true
fi

echo -e "\n${BLUE}ℹ️  Next Steps${NC}"
echo "---------------"
echo "• To start services: ./scripts/start-services.sh"
echo "• To check status:   ./scripts/check-logs.sh"
echo "• To run tests:      ./scripts/health-check.sh"