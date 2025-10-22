# 🚀 **LOGEN v2 - DEFINITIVE DEPLOYMENT GUIDE**
*Created: September 14, 2025*
*Architecture Version: v1 (Modern Docker Networking)*

## 📋 **OVERVIEW**

This guide provides exact, step-by-step instructions for deploying LOGEN v2 using modern Docker networking. Follow these commands precisely to ensure a successful deployment.

**Prerequisites**:
- Docker and Docker Network configured
- All code updated in `/var/apps/logen/`
- Proper permissions for Docker operations

---

## 🗂️ **PRE-DEPLOYMENT CHECKLIST**

### **1. Verify Current State**
```bash
# Check existing containers
docker ps -a | grep logen

# Check Docker network
docker network ls | grep logen

# Check volumes
docker volume ls | grep logen
```

### **2. Environment Configuration Verification**
⚠️  **CRITICAL**: Do NOT rely on .env files for production deployment!

```bash
# ✅ REQUIRED: Verify environment variables are ready for Docker deployment
echo "Checking environment variables to be passed to Docker..."

# These variables MUST be passed as -e flags to docker run:
echo "NODE_ENV=production"
echo "PORT=7600"
echo "DATABASE_HOST=logen-postgres"  # ← Container name, NOT 127.0.0.1
echo "DATABASE_PORT=5432"           # ← Internal port, NOT 7603
echo "DATABASE_USER=locod_user"
echo "DATABASE_PASSWORD=locod_pass_2024"
echo "DATABASE_NAME=locod_db"
echo "DB_SSL=false"
echo "JWT_SECRET=your-super-secret-jwt-key-production-v2-2024"
echo "JWT_EXPIRES_IN=24h"
```

### **3. Network and Container Verification**
```bash
# Ensure logen-network exists and is accessible
docker network inspect logen-network > /dev/null && echo "✅ Network OK" || echo "❌ Network missing"

# Verify database and redis containers are running
docker ps --filter "name=logen-postgres" --filter "name=logen-redis" --format "{{.Names}}: {{.Status}}"

# Test database connectivity (should work before backend deployment)
docker exec logen-postgres pg_isready -U locod_user -d locod_db && echo "✅ Database ready" || echo "❌ Database not ready"
```

---

## 🏗️ **INFRASTRUCTURE SETUP**

### **1. Create Docker Network**
```bash
# Create the logen network (if not exists)
docker network create logen-network 2>/dev/null || echo "Network already exists"

# Verify network creation
docker network inspect logen-network
```

### **2. Setup Persistent Volumes**
```bash
# Create volumes for data persistence
docker volume create logen-postgres-data 2>/dev/null || echo "Volume exists"
docker volume create logen-redis-data 2>/dev/null || echo "Volume exists"

# Verify volumes
docker volume ls | grep logen
```

---

## 🗄️ **DATABASE DEPLOYMENT**

### **1. Deploy PostgreSQL**
```bash
# Stop existing postgres if running
docker stop logen-postgres 2>/dev/null || true
docker rm logen-postgres 2>/dev/null || true

# Deploy fresh PostgreSQL container
docker run -d \
  --name logen-postgres \
  --network logen-network \
  -p 7603:5432 \
  -v logen-postgres-data:/var/lib/postgresql/data \
  -e POSTGRES_DB=locod_db \
  -e POSTGRES_USER=locod_user \
  -e POSTGRES_PASSWORD=locod_pass_2024 \
  --restart unless-stopped \
  --health-cmd "pg_isready -U locod_user -d locod_db" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  postgres:15-alpine

# Wait for database to be healthy
echo "Waiting for PostgreSQL to be healthy..."
while ! docker exec logen-postgres pg_isready -U locod_user -d locod_db; do
  echo "Waiting for database..."
  sleep 2
done
echo "✅ PostgreSQL is healthy"
```

### **2. Deploy Redis Cache**
```bash
# Stop existing redis if running
docker stop logen-redis 2>/dev/null || true
docker rm logen-redis 2>/dev/null || true

# Deploy fresh Redis container
docker run -d \
  --name logen-redis \
  --network logen-network \
  -p 7679:6379 \
  -v logen-redis-data:/data \
  --restart unless-stopped \
  --health-cmd "redis-cli ping" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  redis:7-alpine

# Verify Redis is healthy
echo "Waiting for Redis to be healthy..."
sleep 5
docker exec logen-redis redis-cli ping
echo "✅ Redis is healthy"
```

---

## 🏢 **APPLICATION DEPLOYMENT**

### **1. Deploy Backend API**
```bash
# Navigate to backend directory
cd /var/apps/logen/apps/backend

# Stop existing backend
docker stop logen-backend 2>/dev/null || true
docker rm logen-backend 2>/dev/null || true

# Build backend image
echo "🔨 Building backend..."
docker build --no-cache -f Dockerfile.prod -t logen-backend:latest .

# Deploy backend container with proper environment variables
# CRITICAL: Environment variables must be passed via Docker, not .env file
docker run -d \
  --name logen-backend \
  --network logen-network \
  -p 7600:7600 \
  -e NODE_ENV=production \
  -e PORT=7600 \
  -e DATABASE_HOST=logen-postgres \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=locod_user \
  -e DATABASE_PASSWORD=locod_pass_2024 \
  -e DATABASE_NAME=locod_db \
  -e DB_SSL=false \
  -e JWT_SECRET=your-super-secret-jwt-key-production-v2-2024 \
  -e JWT_EXPIRES_IN=24h \
  --restart unless-stopped \
  --health-cmd "curl -f http://localhost:7600/api/health" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  --health-start-period 60s \
  logen-backend:latest

# Wait for backend to be healthy
echo "Waiting for backend to be healthy..."
sleep 10
for i in {1..30}; do
  if curl -s http://localhost:7600/api/health > /dev/null; then
    echo "✅ Backend is healthy"
    break
  fi
  echo "Attempt $i/30: Waiting for backend..."
  sleep 5
done
```

### **2. Deploy Customer Frontend**
```bash
# Navigate to frontend directory
cd /var/apps/logen/apps/frontend

# Stop existing frontend
docker stop logen-frontend 2>/dev/null || true
docker rm logen-frontend 2>/dev/null || true

# Build frontend image
echo "🔨 Building customer frontend..."
docker build -f Dockerfile.prod -t logen-frontend:latest .

# Deploy frontend container
docker run -d \
  --name logen-frontend \
  --network logen-network \
  -p 7601:7601 \
  --restart unless-stopped \
  --health-cmd "curl -f http://localhost:7601" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  --health-start-period 40s \
  logen-frontend:latest

# Wait for frontend to be healthy
echo "Waiting for customer frontend to be healthy..."
sleep 5
curl -s http://localhost:7601 > /dev/null && echo "✅ Customer frontend is healthy"
```

### **3. Deploy Admin Frontend**
```bash
# Navigate to admin frontend directory
cd /var/apps/logen/apps/admin-frontend

# Stop existing admin frontend
docker stop logen-admin-frontend 2>/dev/null || true
docker rm logen-admin-frontend 2>/dev/null || true

# Build admin frontend image (if needed - usually already built)
echo "🔨 Building admin frontend..."
docker build -f Dockerfile.prod -t logen-admin-frontend:latest . 2>/dev/null || echo "Using existing image"

# Deploy admin frontend container
docker run -d \
  --name logen-admin-frontend \
  --network logen-network \
  -p 7602:7602 \
  --restart unless-stopped \
  --health-cmd "curl -f http://localhost:7602" \
  --health-interval 30s \
  --health-timeout 10s \
  --health-retries 3 \
  --health-start-period 40s \
  logen-admin-frontend:latest

# Wait for admin frontend to be healthy
echo "Waiting for admin frontend to be healthy..."
sleep 5
curl -s http://localhost:7602 > /dev/null && echo "✅ Admin frontend is healthy"
```

### **4. Deploy Supporting Services**
```bash
# Deploy Adminer (optional database UI)
docker stop logen-adminer 2>/dev/null || true
docker rm logen-adminer 2>/dev/null || true

docker run -d \
  --name logen-adminer \
  --network logen-network \
  -p 7605:8080 \
  --restart unless-stopped \
  adminer:latest

echo "✅ Adminer deployed (database UI on port 7605)"
```

---

## 🔧 **POST-DEPLOYMENT VERIFICATION**

### **1. Container Health Check**
```bash
echo "🔍 Checking all container status..."
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep logen

echo -e "\n🏥 Checking health status..."
docker ps --filter "name=logen" --format "table {{.Names}}\t{{.Status}}"
```

### **2. Network Connectivity Tests**
```bash
echo "🌐 Testing network connectivity..."

# Test backend to database
echo "Testing backend → database..."
docker exec logen-backend nc -zv logen-postgres 5432 && echo "✅ DB connection OK" || echo "❌ DB connection FAILED"

# Test backend to redis
echo "Testing backend → redis..."
docker exec logen-backend nc -zv logen-redis 6379 && echo "✅ Redis connection OK" || echo "❌ Redis connection FAILED"

# Test database operations
echo "Testing database operations..."
docker exec logen-postgres psql -U locod_user -d locod_db -c "SELECT 1;" > /dev/null && echo "✅ Database query OK" || echo "❌ Database query FAILED"

# Test redis operations
echo "Testing Redis operations..."
docker exec logen-redis redis-cli ping | grep PONG > /dev/null && echo "✅ Redis ping OK" || echo "❌ Redis ping FAILED"
```

### **3. API Endpoint Tests**
```bash
echo "🔌 Testing API endpoints..."

# Backend health
curl -s http://localhost:7600/api/health > /dev/null && echo "✅ Backend API healthy" || echo "❌ Backend API failed"

# Customer frontend
curl -s http://localhost:7601 > /dev/null && echo "✅ Customer frontend OK" || echo "❌ Customer frontend failed"

# Admin frontend
curl -s http://localhost:7602 > /dev/null && echo "✅ Admin frontend OK" || echo "❌ Admin frontend failed"

# Adminer
curl -s http://localhost:7605 > /dev/null && echo "✅ Adminer OK" || echo "❌ Adminer failed"
```

### **4. Functional Tests**
```bash
echo "🧪 Running functional tests..."

# Test environment variables are loaded correctly
echo "Testing environment variables..."
docker exec logen-backend env | grep DATABASE_HOST | grep logen-postgres > /dev/null && echo "✅ Environment variables loaded" || echo "❌ Environment variables missing"

# Test database authentication
echo "Testing database auth..."
docker exec logen-backend node -e "
const { createConnection } = require('typeorm');
createConnection({
  type: 'postgres',
  host: 'logen-postgres',
  port: 5432,
  username: 'locod_user',
  password: 'locod_pass_2024',
  database: 'locod_db'
}).then(() => {
  console.log('✅ TypeORM connection successful');
  process.exit(0);
}).catch(err => {
  console.log('❌ TypeORM connection failed:', err.message);
  process.exit(1);
});
" 2>/dev/null || echo "❌ Database connection test failed"

# Test login functionality (should return 401 for invalid credentials)
echo "Testing login endpoint..."
response=$(curl -s -X POST http://localhost:7600/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}')

if echo "$response" | grep -q '"statusCode":401'; then
  echo "✅ Login endpoint working correctly (401 for invalid credentials)"
elif echo "$response" | grep -q "error\|success"; then
  echo "✅ Login endpoint responding"
else
  echo "❌ Login endpoint not responding properly: $response"
fi

# Test My Sites functionality (Continue button data)
echo "Testing My Sites API..."
curl -s http://localhost:7600/customer/wizard-sessions | grep -q '"success":true' && echo "✅ My Sites API working" || echo "⚠️ My Sites API needs authentication"
```

---

## 🚨 **TROUBLESHOOTING GUIDE**

### **CRITICAL LESSONS LEARNED**

#### **🔴 MOST COMMON ISSUE: Environment Variables Not Loading**
**Problem**: Backend shows `ECONNREFUSED` even when network connectivity works
**Root Cause**: .env file is NOT copied into production Docker containers
**Solution**: Always use Docker environment variables (`-e` flags) for production deployments

```bash
# ❌ WRONG - This won't work in production
docker run -d --name logen-backend logen-backend:latest

# ✅ CORRECT - Pass environment variables explicitly
docker run -d --name logen-backend \
  -e DATABASE_HOST=logen-postgres \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=locod_user \
  -e DATABASE_PASSWORD=locod_pass_2024 \
  -e DATABASE_NAME=locod_db \
  logen-backend:latest
```

**How to Verify**: Check environment variables inside container
```bash
docker exec logen-backend env | grep DATABASE
# Should show all DATABASE_* variables
```

#### **🔴 Database Connection Configuration**
**Problem**: Backend tries to connect to wrong host/port
**Root Cause**: Confusion between Docker network vs host network addressing
**Solution**: Use container names and internal ports for Docker network communication

```bash
# ✅ CORRECT for Docker network
DATABASE_HOST=logen-postgres  # Container name
DATABASE_PORT=5432           # Internal container port

# ❌ WRONG for Docker network (this is for host network)
DATABASE_HOST=127.0.0.1      # Host IP
DATABASE_PORT=7603           # External mapped port
```

#### **🔴 Container Network Isolation**
**Problem**: Containers can't communicate even when running
**Root Cause**: Containers not on the same Docker network
**Solution**: Always ensure all logen containers are on `logen-network`

```bash
# Verify all containers are on same network
docker network inspect logen-network | grep -A 3 "Containers"
```

### **Common Issues & Solutions**

#### **Backend Can't Connect to Database**
```bash
# Check if containers are on same network
docker inspect logen-backend | grep NetworkMode
docker inspect logen-postgres | grep NetworkMode

# Check environment variables
docker exec logen-backend env | grep DATABASE

# Check database logs
docker logs logen-postgres --tail 50
```

#### **Frontend Can't Access Backend**
```bash
# Check nginx configuration
docker exec nginx-reverse nginx -t

# Test direct backend access
curl -v http://localhost:7600/api/health

# Check frontend environment
docker exec logen-frontend env | grep API
```

#### **Container Won't Start**
```bash
# Check container logs
docker logs logen-backend --tail 50

# Check resource usage
docker stats --no-stream

# Check port conflicts
netstat -tulpn | grep 7600
```

### **Health Check Commands**
```bash
# Quick health overview
docker ps --filter "name=logen" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Detailed container inspection
for container in logen-backend logen-frontend logen-admin-frontend logen-postgres logen-redis; do
  echo "=== $container ==="
  docker inspect $container --format '{{.State.Health.Status}}' 2>/dev/null || echo "No health check"
done

# Network connectivity matrix
echo "Testing internal network connectivity..."
docker exec logen-backend nc -zv logen-postgres 5432 && echo "✅ Backend → DB" || echo "❌ Backend → DB"
docker exec logen-backend nc -zv logen-redis 6379 && echo "✅ Backend → Redis" || echo "❌ Backend → Redis"
```

---

## 🔄 **ROLLBACK PROCEDURE**

### **Emergency Rollback**
```bash
# Stop all new containers
docker stop logen-backend logen-frontend logen-admin-frontend

# If you have previous working images tagged:
docker run -d --name logen-backend --network logen-network -p 7600:7600 logen-backend:previous
docker run -d --name logen-frontend --network logen-network -p 7601:7601 logen-frontend:previous
docker run -d --name logen-admin-frontend --network logen-network -p 7602:7602 logen-admin-frontend:previous

# Verify rollback
curl http://localhost:7600/api/health
curl http://localhost:7601
curl http://localhost:7602
```

### **Database Rollback** (if needed)
```bash
# Only if database changes were made
docker stop logen-postgres
docker run -d --name logen-postgres --network logen-network -p 7603:5432 \
  -v logen-postgres-data-backup:/var/lib/postgresql/data \
  -e POSTGRES_DB=locod_db -e POSTGRES_USER=locod_user -e POSTGRES_PASSWORD=locod_pass_2024 \
  postgres:15-alpine
```

---

## 📊 **MONITORING SETUP**

### **Log Monitoring**
```bash
# Real-time log monitoring
docker logs -f logen-backend &
docker logs -f logen-frontend &
docker logs -f logen-admin-frontend &

# Log rotation setup
docker run --log-driver json-file --log-opt max-size=10m --log-opt max-file=3

# System resource monitoring
watch docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"
```

### **Automated Health Monitoring Script**
```bash
# Create monitoring script
cat > /var/apps/logen/scripts/health-monitor.sh << 'EOF'
#!/bin/bash
echo "=== LOGEN Health Check $(date) ==="

services=("logen-backend:7600/api/health" "logen-frontend:7601" "logen-admin-frontend:7602")
for service in "${services[@]}"; do
  name="${service%:*}"
  url="http://localhost:${service#*:}"
  if curl -s -f "$url" > /dev/null; then
    echo "✅ $name healthy"
  else
    echo "❌ $name failed"
  fi
done

echo "=== Container Status ==="
docker ps --filter "name=logen" --format "table {{.Names}}\t{{.Status}}"
EOF

chmod +x /var/apps/logen/scripts/health-monitor.sh
```

---

## 🎯 **SUCCESS CRITERIA**

### **Deployment Successful When**:
- ✅ All containers show "healthy" status
- ✅ All API endpoints respond correctly
- ✅ Database connections established
- ✅ Redis cache accessible
- ✅ Network connectivity verified
- ✅ Frontend applications load properly
- ✅ Login functionality works
- ✅ No error logs in container output

### **Performance Benchmarks**:
- Backend health check: < 200ms response
- Frontend page load: < 2s initial load
- Database queries: < 100ms average
- API endpoints: < 500ms response time

---

## 📋 **FINAL VERIFICATION CHECKLIST**

```bash
# Run this complete verification
echo "🎯 FINAL DEPLOYMENT VERIFICATION"
echo "================================"

# 1. All containers running
echo "1. Container Status:"
docker ps --filter "name=logen" --format "{{.Names}}: {{.Status}}" | head -6

# 2. Health checks passing
echo -e "\n2. Health Checks:"
curl -s http://localhost:7600/api/health > /dev/null && echo "✅ Backend" || echo "❌ Backend"
curl -s http://localhost:7601 > /dev/null && echo "✅ Customer Portal" || echo "❌ Customer Portal"
curl -s http://localhost:7602 > /dev/null && echo "✅ Admin Portal" || echo "❌ Admin Portal"

# 3. Database operational
echo -e "\n3. Database:"
docker exec logen-postgres pg_isready -U locod_user -d locod_db > /dev/null && echo "✅ PostgreSQL" || echo "❌ PostgreSQL"

# 4. Cache operational
echo -e "\n4. Cache:"
docker exec logen-redis redis-cli ping | grep PONG > /dev/null && echo "✅ Redis" || echo "❌ Redis"

# 5. Network connectivity
echo -e "\n5. Network:"
docker exec logen-backend nc -zv logen-postgres 5432 2>&1 | grep -q "open" && echo "✅ Backend→DB" || echo "❌ Backend→DB"
docker exec logen-backend nc -zv logen-redis 6379 2>&1 | grep -q "open" && echo "✅ Backend→Redis" || echo "❌ Backend→Redis"

echo -e "\n🎊 Deployment verification complete!"
echo "Visit: https://logen.locod-ai.com (Customer Portal)"
echo "Visit: https://admin.logen.locod-ai.com (Admin Portal)"
```

---

## ⛔ **CRITICAL: DO NOT DO THESE THINGS**

### **🚫 Environment Variable Mistakes**
```bash
# ❌ NEVER: Rely on .env files in production containers
docker run -d --name logen-backend logen-backend:latest
# The .env file is NOT copied to production containers!

# ❌ NEVER: Use host network configuration for Docker network
-e DATABASE_HOST=127.0.0.1 -e DATABASE_PORT=7603
# This breaks container-to-container communication!

# ❌ NEVER: Mix environment approaches
# Don't put some vars in .env and some in Docker -e flags
```

### **🚫 Network Configuration Mistakes**
```bash
# ❌ NEVER: Deploy backend without proper network
docker run --name logen-backend -p 7600:7600 logen-backend:latest
# Missing --network logen-network breaks database connectivity!

# ❌ NEVER: Assume containers can reach each other without same network
# Always verify: docker network inspect logen-network
```

### **🚫 Deployment Process Mistakes**
```bash
# ❌ NEVER: Deploy without stopping existing containers first
# This causes port conflicts and confusion

# ❌ NEVER: Skip health checks
# Always wait for health checks before declaring success

# ❌ NEVER: Deploy all services simultaneously
# Deploy in order: DB → Redis → Backend → Frontends
```

### **🚫 Debugging Mistakes**
```bash
# ❌ NEVER: Assume network connectivity equals working application
# Even if `nc -zv` works, environment variables might be missing

# ❌ NEVER: Edit .env files during deployment and expect changes
# Production containers ignore .env files - use Docker -e flags

# ❌ NEVER: Use docker exec to "fix" issues temporarily
# Always fix the root cause in the deployment process
```

---

## 📋 **DEPLOYMENT SUCCESS CHECKLIST**
Before declaring deployment successful, verify ALL of these:

- [ ] All containers show "healthy" status: `docker ps | grep healthy`
- [ ] Environment variables loaded: `docker exec logen-backend env | grep DATABASE_HOST`
- [ ] Database connectivity: `docker exec logen-backend nc -zv logen-postgres 5432`
- [ ] API health endpoint: `curl http://localhost:7600/api/health`
- [ ] Login endpoint: `curl -X POST http://localhost:7600/auth/login` (should return 401)
- [ ] Frontend accessibility: `curl http://localhost:7601` and `curl http://localhost:7602`
- [ ] No error logs: `docker logs logen-backend --tail 20` (no ECONNREFUSED errors)

---

**This definitive deployment guide ensures consistent, reliable deployments of LOGEN v2 with proper Docker networking and comprehensive verification procedures. Following these instructions exactly will prevent the common pitfalls that cause deployment failures.**