#!/bin/bash

# ==============================================
# Logen Log Checker Script
# ==============================================
# Quickly check logs for errors and issues
# ==============================================

echo "📋 Logen System Logs"
echo "===================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to show log section
show_log() {
    local log_file=$1
    local service_name=$2
    local lines=${3:-50}
    
    echo -e "\n${BLUE}📄 $service_name Logs (last $lines lines)${NC}"
    echo "$(printf '%.0s-' {1..50})"
    
    if [ -f "$log_file" ]; then
        tail -n $lines "$log_file" | while IFS= read -r line; do
            if echo "$line" | grep -qiE "(error|failed|exception|fatal)"; then
                echo -e "${RED}$line${NC}"
            elif echo "$line" | grep -qiE "(warn|warning)"; then
                echo -e "${YELLOW}$line${NC}"
            elif echo "$line" | grep -qiE "(success|ready|started|running)"; then
                echo -e "${GREEN}$line${NC}"
            else
                echo "$line"
            fi
        done
    else
        echo -e "${RED}❌ Log file not found: $log_file${NC}"
    fi
}

# Function to check process status
check_process() {
    local port=$1
    local service_name=$2
    
    echo -n "Checking $service_name... "
    
    if lsof -i :$port > /dev/null 2>&1; then
        pid=$(lsof -ti :$port)
        echo -e "${GREEN}✅ Running (PID: $pid)${NC}"
    else
        echo -e "${RED}❌ Not running${NC}"
    fi
}

# ==============================================
# 1. Check Process Status
# ==============================================
echo -e "\n${BLUE}🔍 Service Status${NC}"
echo "-------------------"

check_process 7600 "Backend"
check_process 7601 "Frontend"

# Check Docker containers
echo -n "Checking PostgreSQL... "
if docker ps --filter "name=logen-postgres" --filter "status=running" | grep -q logen-postgres; then
    echo -e "${GREEN}✅ Running${NC}"
else
    echo -e "${RED}❌ Not running${NC}"
fi

# ==============================================
# 2. Show Recent Logs
# ==============================================
show_log "/tmp/logen-backend.log" "Backend"
show_log "/tmp/logen-frontend.log" "Frontend" 30

# ==============================================
# 3. Check Docker Logs
# ==============================================
echo -e "\n${BLUE}🐳 Docker Logs (PostgreSQL)${NC}"
echo "$(printf '%.0s-' {1..30})"

if docker ps --filter "name=logen-postgres" | grep -q logen-postgres; then
    docker logs --tail 20 logen-postgres 2>&1 | while IFS= read -r line; do
        if echo "$line" | grep -qiE "(error|failed|fatal)"; then
            echo -e "${RED}$line${NC}"
        elif echo "$line" | grep -qiE "(warn|warning)"; then
            echo -e "${YELLOW}$line${NC}"
        elif echo "$line" | grep -qiE "(ready|started)"; then
            echo -e "${GREEN}$line${NC}"
        else
            echo "$line"
        fi
    done
else
    echo -e "${RED}❌ PostgreSQL container not running${NC}"
fi

# ==============================================
# 4. Quick Error Analysis
# ==============================================
echo -e "\n${BLUE}🚨 Recent Errors${NC}"
echo "-------------------"

if [ -f "/tmp/logen-backend.log" ]; then
    echo -e "\n${YELLOW}Backend Errors:${NC}"
    grep -i -A 2 -B 1 "error\|exception\|failed" /tmp/logen-backend.log | tail -n 10 | while IFS= read -r line; do
        echo -e "${RED}$line${NC}"
    done
fi

if [ -f "/tmp/logen-frontend.log" ]; then
    echo -e "\n${YELLOW}Frontend Errors:${NC}"
    grep -i -A 2 -B 1 "error\|exception\|failed" /tmp/logen-frontend.log | tail -n 10 | while IFS= read -r line; do
        echo -e "${RED}$line${NC}"
    done
fi

# ==============================================
# 5. Disk Space Check
# ==============================================
echo -e "\n${BLUE}💽 Disk Space${NC}"
echo "---------------"

df -h /var/apps/logen | tail -n +2 | while read line; do
    usage=$(echo $line | awk '{print $5}' | sed 's/%//')
    if [ "$usage" -gt 90 ]; then
        echo -e "${RED}$line${NC}"
    elif [ "$usage" -gt 75 ]; then
        echo -e "${YELLOW}$line${NC}"
    else
        echo -e "${GREEN}$line${NC}"
    fi
done

# ==============================================
# 6. Port Usage
# ==============================================
echo -e "\n${BLUE}🔌 Port Usage${NC}"
echo "---------------"

echo "Processes using Logen ports:"
lsof -i :7600 -i :7601 -i :5433 2>/dev/null || echo "No processes found on Logen ports"

# ==============================================
# 7. Recommendations
# ==============================================
echo -e "\n${BLUE}💡 Recommendations${NC}"
echo "--------------------"

# Check for common issues
if ! lsof -i :7600 > /dev/null 2>&1; then
    echo -e "${YELLOW}• Backend not running - try: ./scripts/start-services.sh${NC}"
fi

if ! lsof -i :7601 > /dev/null 2>&1; then
    echo -e "${YELLOW}• Frontend not running - try: ./scripts/start-services.sh${NC}"
fi

if [ -f "/tmp/logen-backend.log" ] && grep -q "ECONNREFUSED" /tmp/logen-backend.log; then
    echo -e "${YELLOW}• Database connection issues - check PostgreSQL container${NC}"
fi

if [ -f "/tmp/logen-frontend.log" ] && grep -q "EADDRINUSE" /tmp/logen-frontend.log; then
    echo -e "${YELLOW}• Port conflict - kill existing processes and restart${NC}"
fi

echo -e "\n${BLUE}🔧 Useful Commands${NC}"
echo "--------------------"
echo "• View live backend logs:  tail -f /tmp/logen-backend.log"
echo "• View live frontend logs: tail -f /tmp/logen-frontend.log"
echo "• Restart all services:    ./scripts/start-services.sh"
echo "• Run health check:        ./scripts/health-check.sh"
echo "• Kill all processes:      ./scripts/stop-services.sh"