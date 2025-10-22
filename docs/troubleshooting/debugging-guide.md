# Debugging Guide

This guide helps you systematically debug issues in the Logen application.

## 🎯 Debugging Strategy

### 1. First Principles: Isolate the Problem

Before diving into code, identify:
- **What** is broken?
- **When** did it break?
- **Where** is the issue occurring?
- **How** can you reproduce it?

### 2. Debugging Checklist

**Always start with:**
```bash
./scripts/health-check.sh
./scripts/check-logs.sh
```

## 🔍 System-Level Debugging

### Check Service Status

```bash
# Quick service overview
netstat -tlnp | grep -E "(7600|7601|5433)"

# Process details
ps aux | grep -E "(node|next|postgres)"

# Docker containers
docker ps --filter "name=logen"
```

### Resource Usage

```bash
# Disk space
df -h /var/apps/logen

# Memory usage
free -h

# CPU usage
top -p $(pgrep -f "node\|next")
```

### Network Connectivity

```bash
# Test backend connectivity
curl -v http://localhost:7600/api/health

# Test frontend connectivity
curl -v http://localhost:7601

# Test database connectivity
docker exec logen-postgres pg_isready -U logen_user
```

## 🔧 Backend Debugging

### Enable Debug Logging

```bash
# Start backend with detailed logging
cd apps/backend
DEBUG=* npm run start:dev

# Or with specific namespaces
DEBUG=typeorm:*,nest:* npm run start:dev
```

### Database Query Debugging

Add to `apps/backend/src/app.module.ts`:
```typescript
TypeOrmModule.forRoot({
  // ... other config
  logging: ['query', 'error', 'warn'],
  logger: 'advanced-console',
})
```

### API Request Debugging

```bash
# Test specific endpoints with curl
curl -X POST http://localhost:7600/customer/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123","firstName":"Test","lastName":"User"}' \
  -v

# Check authentication
curl -X GET http://localhost:7600/customer/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -v
```

### Common Backend Issues

**1. Database Connection Errors**
```bash
# Check if PostgreSQL is running
docker exec logen-postgres pg_isready -U logen_user

# Test connection manually
docker exec -it logen-postgres psql -U logen_user -d logen_db -c "SELECT 1;"

# Check environment variables
echo $DB_HOST $DB_PORT $DB_USERNAME
```

**2. JWT Token Issues**
```bash
# Decode JWT token (paste your token)
node -e "
const token = 'YOUR_JWT_TOKEN';
const [header, payload, signature] = token.split('.');
console.log('Header:', JSON.parse(Buffer.from(header, 'base64').toString()));
console.log('Payload:', JSON.parse(Buffer.from(payload, 'base64').toString()));
"
```

**3. API Route Issues**
```bash
# Check if routes are properly registered
curl http://localhost:7600 | grep -E "(customer|auth|admin)"
```

## 🌐 Frontend Debugging

### Enable Detailed Logging

In `apps/frontend/next.config.ts`:
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  experimental: {
    logging: 'verbose',
  },
}
```

### Browser Developer Tools

**1. Network Tab:**
- Check API request/response
- Verify request headers and payloads
- Look for failed requests (red entries)

**2. Console Tab:**
- React errors and warnings
- Uncaught exceptions
- API call logs

**3. Application Tab:**
- Local storage (tokens, user data)
- Session storage
- Cookies

### API Client Debugging

Add logging to API calls in `apps/frontend/src/services/`:
```typescript
// Before API call
console.log('API Request:', { method, url, data });

// After API response
console.log('API Response:', { status, data: response.data });

// In catch block
console.error('API Error:', { 
  message: error.message, 
  response: error.response?.data,
  status: error.response?.status 
});
```

### Common Frontend Issues

**1. Hydration Errors**
```javascript
// Add to component for debugging
useEffect(() => {
  console.log('Client-side render:', { 
    isClient: typeof window !== 'undefined',
    data: someData 
  });
}, []);
```

**2. Authentication State Issues**
```javascript
// Debug auth store
const { user, isAuthenticated, error } = useCustomerAuthStore();
console.log('Auth State:', { user, isAuthenticated, error });
```

**3. Routing Issues**
```bash
# Check if page files exist
ls -la apps/frontend/src/app/sites/create/
ls -la apps/frontend/src/app/wizard*/
```

## 🗄️ Database Debugging

### Query Analysis

```sql
-- Connect to database
docker exec -it logen-postgres psql -U logen_user -d logen_db

-- Check table structure
\d users
\d sessions
\d customer_sites

-- Find problematic data
SELECT * FROM users WHERE email IS NULL;
SELECT * FROM sessions WHERE expires_at < NOW();

-- Check relationships
SELECT u.email, COUNT(s.id) as session_count 
FROM users u 
LEFT JOIN sessions s ON u.id = s.user_id 
GROUP BY u.id, u.email;
```

### Migration Issues

```bash
# Check migration status
cd apps/backend
npm run typeorm migration:show

# Create new migration
npm run typeorm migration:create -n YourMigrationName

# Revert last migration (DANGER)
npm run typeorm migration:revert
```

### Performance Analysis

```sql
-- Enable query timing
\timing on

-- Slow query analysis
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Check indexes
\di

-- Table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🐛 Step-by-Step Debugging Process

### When Something Breaks

**Step 1: Immediate Assessment**
```bash
# What's the scope of the problem?
./scripts/health-check.sh

# When did it break?
git log --oneline -10

# What changed recently?
git diff HEAD~5
```

**Step 2: Isolate the Component**
- Is it frontend, backend, or database?
- Can you reproduce it consistently?
- Does it happen in different browsers/environments?

**Step 3: Gather Evidence**
```bash
# Capture current state
./scripts/check-logs.sh > debug-session-$(date +%Y%m%d-%H%M%S).log

# Browser console logs (screenshot or copy)
# Network tab for failed requests
# Database query logs if applicable
```

**Step 4: Hypothesis Testing**
- Form a hypothesis about what's wrong
- Test it with minimal changes
- Document what you try and results

**Step 5: Incremental Fixes**
- Make ONE small change at a time
- Test after each change
- Commit working fixes immediately

**Step 6: Recovery**
```bash
# If debugging takes too long (>30 minutes)
git stash
git reset --hard golden-master-working
./scripts/start-services.sh

# Then methodically re-apply changes
```

## 🔬 Advanced Debugging Techniques

### Backend Profiling

```typescript
// Add timing to controllers
@Get()
async findAll() {
  const start = Date.now();
  const result = await this.service.findAll();
  console.log(`findAll took ${Date.now() - start}ms`);
  return result;
}
```

### Frontend Performance Debugging

```javascript
// Measure component render time
const MyComponent = () => {
  const renderStart = performance.now();
  
  useEffect(() => {
    console.log(`MyComponent render took ${performance.now() - renderStart}ms`);
  });
  
  return <div>...</div>;
};
```

### Memory Leak Detection

```bash
# Monitor memory usage over time
while true; do
  ps -o pid,ppid,cmd,%mem,%cpu -p $(pgrep -f "node.*nest")
  sleep 10
done
```

## 📊 Debugging Tools and Commands

### Essential Commands

```bash
# Process tree
pstree -p $(pgrep -f logen)

# Open file descriptors
lsof -p $(pgrep -f "node.*nest")

# Network connections
netstat -tulnp | grep $(pgrep -f "node.*nest")

# Environment variables
cat /proc/$(pgrep -f "node.*nest")/environ | tr '\0' '\n'
```

### Log Analysis

```bash
# Find errors in logs
grep -i "error\|exception\|failed" /tmp/logen-*.log | tail -20

# Pattern analysis
awk '/ERROR/ {errors++} /SUCCESS/ {success++} END {print "Errors:", errors, "Success:", success}' /tmp/logen-backend.log

# Time-based filtering
sed -n '/2025-09-01 17:30:00/,/2025-09-01 17:35:00/p' /tmp/logen-backend.log
```

### Database Debugging

```sql
-- Connection details
SELECT * FROM pg_stat_activity WHERE datname = 'logen_db';

-- Lock analysis
SELECT * FROM pg_locks WHERE NOT granted;

-- Table statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del 
FROM pg_stat_user_tables;
```

## 🚨 Emergency Debugging

### System is Completely Broken

1. **Don't panic** - tag the broken state first:
   ```bash
   git tag "emergency-$(date +%Y%m%d-%H%M%S)"
   ```

2. **Quick triage:**
   ```bash
   # Are any services running?
   ps aux | grep -E "(node|next)"
   
   # Any obvious errors?
   tail -50 /tmp/logen-*.log
   ```

3. **Reset to golden master:**
   ```bash
   git reset --hard golden-master-working
   ./scripts/start-services.sh
   ```

4. **Post-mortem analysis:**
   ```bash
   git diff golden-master-working emergency-$(date +%Y%m%d-%H%M%S)
   ```

### Critical Production Issues

```bash
# Quick health check
curl -f http://localhost:7600/api/health || echo "Backend DOWN"
curl -f http://localhost:7601 || echo "Frontend DOWN"

# Check resource exhaustion
df -h && free -h && uptime

# Emergency log collection
tar -czf emergency-logs-$(date +%Y%m%d-%H%M%S).tar.gz \
  /tmp/logen-*.log \
  docker logs logen-postgres
```

Remember: **Speed of recovery is more important than understanding the root cause during an emergency.**