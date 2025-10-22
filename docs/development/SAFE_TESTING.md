# 🔒 SAFE V2.0 Testing Guide

## ⚠️ CRITICAL: Existing Services on Server

### Currently Running Services (DO NOT CONFLICT):
- **Port 3000**: (Check if in use)
- **Port 3080**: Customer Portal (ACTIVE - DO NOT TOUCH)
- **Port 5432**: Might have existing PostgreSQL
- **Port 6379**: Might have existing Redis
- **Port 80/443**: Nginx (ACTIVE)

## 🛡️ Safe Testing Strategy

### 1. Use Different Ports for V2
Create a `v2/.env` file with NON-CONFLICTING ports:

```env
# Use different ports to avoid conflicts
POSTGRES_PORT=5433  # Not 5432
REDIS_PORT=6380     # Not 6379
BACKEND_PORT=4000   # Not 3000
FRONTEND_PORT=4001  # Not 3001
ADMINER_PORT=8081   # Not 8080
```

### 2. Modified docker-compose.yml for Testing

```yaml
# v2/docker/docker-compose.test.yml
services:
  postgres:
    ports:
      - "${POSTGRES_PORT:-5433}:5432"  # External:Internal
  
  redis:
    ports:
      - "${REDIS_PORT:-6380}:6379"
  
  adminer:
    ports:
      - "${ADMINER_PORT:-8081}:8080"
  
  backend:
    ports:
      - "${BACKEND_PORT:-4000}:3000"
  
  frontend:
    ports:
      - "${FRONTEND_PORT:-4001}:3000"
```

### 3. Testing Commands (SAFE)

```bash
# First, check what's already running
docker ps
lsof -i :3000
lsof -i :5432
lsof -i :6379

# Create isolated v2 test
cd /var/apps/website-generator/v2

# Copy and modify environment
cp .env.example .env
# EDIT .env to use safe ports (5433, 6380, 4000, 4001, 8081)

# Start ONLY infrastructure (no app containers yet)
cd docker
docker-compose -p v2test up -d postgres redis adminer

# Check if working
docker-compose -p v2test ps
docker-compose -p v2test logs postgres

# Stop when done testing
docker-compose -p v2test down

# Clean up completely
docker-compose -p v2test down -v  # Removes volumes too
```

### 4. Production Deployment (LATER)

Once testing is complete and v1 can be migrated:
1. Backup v1 database
2. Stop v1 services gracefully
3. Deploy v2 with proper ports
4. Migrate data
5. Switch nginx configuration

## 🚫 DO NOT RUN

```bash
# DANGEROUS COMMANDS - DO NOT RUN
docker-compose down          # Without -p flag kills ALL
docker system prune -a        # Removes everything
docker stop $(docker ps -q)  # Stops ALL containers
```

## ✅ Safe Testing Checklist

- [ ] Check existing services with `docker ps`
- [ ] Verify ports are free with `lsof -i :PORT`
- [ ] Use project name flag: `-p v2test`
- [ ] Use different ports in .env
- [ ] Test infrastructure only first
- [ ] Keep v1 portal running on 3080
- [ ] Document any issues found

## 📝 Notes

- The `-p v2test` flag creates an isolated project namespace
- Always use `docker-compose -p v2test` for v2 commands
- Never use `docker-compose down` without the `-p` flag
- Keep existing production services running