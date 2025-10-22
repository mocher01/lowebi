## 🏗️ **LOGEN PROJECT INFORMATION**

### **Project Location**
- The website-generator directory in the server is in `/var/apps/logen/` not root

### **🚀 DEPLOYMENT PROCESS - CRITICAL INSTRUCTIONS**

**IMPORTANT**: After making any code changes, follow this EXACT deployment sequence:

#### **1. Pre-Deployment Checklist**
```bash
# Check current container status
docker ps -a | grep logen

# Verify Docker network exists
docker network ls | grep logen-network
```

#### **2. Full Application Deployment Sequence**

**Deploy in this EXACT order:**

**A. Deploy Backend (after code changes):**
```bash
cd /var/apps/logen/apps/backend

# Stop and remove existing backend
docker stop logen-backend 2>/dev/null || true
docker rm logen-backend 2>/dev/null || true

# Build new image with code changes
docker build --no-cache -f Dockerfile.prod -t logen-backend:latest .

# Deploy with CORRECT environment variables (NOT .env file!)
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
  logen-backend:latest

# Wait and verify health
sleep 10
curl http://localhost:7600/api/health
```

**B. Deploy Frontend (after CSS/UI changes):**
```bash
cd /var/apps/logen/apps/frontend

# Stop and remove existing frontend
docker stop logen-frontend 2>/dev/null || true
docker rm logen-frontend 2>/dev/null || true

# Build new image with changes
docker build -f Dockerfile.prod -t logen-frontend:latest .

# Deploy frontend
docker run -d \
  --name logen-frontend \
  --network logen-network \
  -p 7601:7601 \
  --restart unless-stopped \
  logen-frontend:latest

# Verify
sleep 5
curl http://localhost:7601
```

**C. Deploy Admin Frontend (if admin changes):**
```bash
cd /var/apps/logen/apps/admin-frontend

docker stop logen-admin-frontend 2>/dev/null || true
docker rm logen-admin-frontend 2>/dev/null || true

docker build -f Dockerfile.prod -t logen-admin-frontend:latest .

docker run -d \
  --name logen-admin-frontend \
  --network logen-network \
  -p 7602:7602 \
  --restart unless-stopped \
  logen-admin-frontend:latest

curl http://localhost:7602
```

#### **3. Critical Deployment Verification**
```bash
# Verify all services are healthy
docker ps --filter "name=logen" --format "{{.Names}}: {{.Status}}"

# Test API endpoints
curl http://localhost:7600/api/health  # Backend
curl http://localhost:7601             # Customer frontend
curl http://localhost:7602             # Admin frontend

# Test login functionality
curl -X POST http://localhost:7600/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

#### **⚠️ CRITICAL DEPLOYMENT RULES**

1. **NEVER use .env files in production** - they're not copied to Docker containers
2. **ALWAYS use Docker -e flags** for environment variables
3. **ALWAYS use container names** for DATABASE_HOST (`logen-postgres`, not `127.0.0.1`)
4. **ALWAYS use internal ports** for DATABASE_PORT (`5432`, not `7603`)
5. **ALWAYS rebuild images with --no-cache** when code changes
6. **ALWAYS verify health endpoints** before declaring success

#### **🔧 Quick Troubleshooting**
```bash
# Check container logs if issues
docker logs logen-backend --tail 20
docker logs logen-frontend --tail 20

# Check environment variables are loaded
docker exec logen-backend env | grep DATABASE

# Check network connectivity
docker exec logen-backend nc -zv logen-postgres 5432
```

**📋 Reference**: See `/var/apps/logen/docs/deployment/DEFINITIVE_DEPLOYMENT_GUIDE.md` for complete deployment procedures.

---

## 🧪 **GOLDEN TESTING RULE**

### **⚠️ CRITICAL: Always Backup Working Tests Before Modifications**

**RULE**: When a test is working perfectly and needs updates, corrections, or additions:

1. **📋 ALWAYS create a backup copy first**:
   ```bash
   cp working-test.spec.ts working-test.backup.spec.ts
   ```

2. **✅ Verify the backup works**:
   ```bash
   npx playwright test working-test.backup.spec.ts
   ```

3. **🔧 Only then modify the original**

4. **❌ If modifications break the test**:
   ```bash
   cp working-test.backup.spec.ts working-test.spec.ts
   ```

**WHY**: Losing a working test means losing hours/days of debugging work. A 30-second backup saves massive rework.

**EXAMPLE**:
- ✅ `cycle13-verify-content-in-wizard.spec.ts` (working)
- ✅ `cycle13-verify-content-in-wizard.backup.spec.ts` (backup)
- 🔧 Modify `cycle13-verify-content-in-wizard.spec.ts`
- ❌ If broken → restore from `.backup.spec.ts`

**This rule prevents losing working tests and eliminates the need to rebuild from scratch.**