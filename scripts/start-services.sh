#!/bin/bash

# ==============================================
# Logen Service Startup Script
# ==============================================
# Starts all required services in the correct order
# ==============================================

set -e

echo "🚀 Starting Logen Services"
echo "=========================="

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to check if port is in use
port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
}

# Function to kill processes on port
kill_port() {
    local port=$1
    local service_name=$2
    
    if port_in_use $port; then
        echo -e "${YELLOW}⚠️  Port $port in use by $service_name - killing existing process${NC}"
        lsof -ti :$port | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
}

# ==============================================
# 1. Clean up existing processes
# ==============================================
echo -e "\n${BLUE}🧹 Cleaning up existing processes${NC}"
echo "-----------------------------------"

kill_port 7600 "Backend"
kill_port 7601 "Frontend"

# ==============================================
# 2. Start Database Services
# ==============================================
echo -e "\n${BLUE}🗄️  Starting Database Services${NC}"
echo "--------------------------------"

echo "Starting PostgreSQL container..."
cd /var/apps/logen

# Check if postgres container exists and start it
if docker ps -a --filter "name=logen-postgres" | grep -q logen-postgres; then
    echo "PostgreSQL container exists, starting..."
    docker start logen-postgres || echo "Container already running"
else
    echo "PostgreSQL container doesn't exist, creating..."
    docker-compose -f config/docker/docker-compose.yml up -d postgres
fi

# Wait for postgres to be ready
echo "Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec logen-postgres pg_isready -U logen_user > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start after 30 seconds${NC}"
        exit 1
    fi
done

# ==============================================
# 3. Start Backend Service
# ==============================================
echo -e "\n${BLUE}⚙️  Starting Backend Service${NC}"
echo "------------------------------"

cd apps/backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "Starting backend on port 7600..."
JWT_SECRET="logen-jwt-secret-development" \
DB_HOST=localhost \
DB_PORT=5433 \
DB_USERNAME=logen_user \
DB_PASSWORD=logen_pass_2024 \
DB_DATABASE=logen_db \
nohup npm run start:dev > /tmp/logen-backend.log 2>&1 &

BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "Waiting for backend to be ready..."
for i in {1..60}; do
    if curl -f http://localhost:7600/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Backend failed to start after 60 seconds${NC}"
        echo "Check logs: tail -f /tmp/logen-backend.log"
        exit 1
    fi
done

# ==============================================
# 4. Start Frontend Service
# ==============================================
echo -e "\n${BLUE}🌐 Starting Frontend Service${NC}"
echo "------------------------------"

cd ../frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "Starting frontend on port 7601..."
nohup npm run dev -- --port 7601 > /tmp/logen-frontend.log 2>&1 &

FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo "Waiting for frontend to be ready..."
for i in {1..60}; do
    if curl -f http://localhost:7601 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend ready${NC}"
        break
    fi
    sleep 1
    if [ $i -eq 60 ]; then
        echo -e "${RED}❌ Frontend failed to start after 60 seconds${NC}"
        echo "Check logs: tail -f /tmp/logen-frontend.log"
        exit 1
    fi
done

# ==============================================
# 5. Verify All Services
# ==============================================
echo -e "\n${BLUE}✅ Verifying All Services${NC}"
echo "---------------------------"

cd /var/apps/logen

# Run health check
if ./scripts/health-check.sh; then
    echo -e "\n${GREEN}🎉 ALL SERVICES STARTED SUCCESSFULLY!${NC}"
    echo ""
    echo "📱 Access URLs:"
    echo "   • Customer Portal: http://localhost:7601"
    echo "   • Admin Portal:    http://localhost:7602"
    echo "   • Backend API:     http://localhost:7600"
    echo "   • API Docs:        http://localhost:7600/api/docs"
    echo "   • Health Check:    http://localhost:7600/api/health"
    echo ""
    echo "📄 Log Files:"
    echo "   • Backend:  tail -f /tmp/logen-backend.log"
    echo "   • Frontend: tail -f /tmp/logen-frontend.log"
    echo ""
    echo "🔧 Process IDs:"
    echo "   • Backend:  $BACKEND_PID"
    echo "   • Frontend: $FRONTEND_PID"
else
    echo -e "${RED}❌ Health check failed after startup${NC}"
    exit 1
fi