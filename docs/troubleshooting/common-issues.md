# Common Issues and Solutions

This document contains solutions to frequently encountered issues during Logen development.

## 🚨 Service Issues

### Backend Won't Start

**Symptoms:**
- `npm run start:dev` fails
- Port 7600 connection refused
- Database connection errors

**Solutions:**
1. **Check PostgreSQL container:**
   ```bash
   docker ps | grep logen-postgres
   # If not running:
   docker start logen-postgres
   ```

2. **Check environment variables:**
   ```bash
   # Ensure these are set:
   JWT_SECRET="logen-jwt-secret-development"
   DB_HOST=localhost
   DB_PORT=5433
   DB_USERNAME=logen_user
   DB_PASSWORD=logen_pass_2024
   DB_DATABASE=logen_db
   ```

3. **Clear node_modules and reinstall:**
   ```bash
   cd apps/backend
   rm -rf node_modules package-lock.json
   npm install
   ```

### Frontend Won't Start

**Symptoms:**
- `npm run dev` fails on port 7601
- `EADDRINUSE` error
- Build errors

**Solutions:**
1. **Kill existing processes:**
   ```bash
   lsof -ti :7601 | xargs kill -9
   ```

2. **Clear Next.js cache:**
   ```bash
   cd apps/frontend
   rm -rf .next node_modules
   npm install
   ```

3. **Check for port conflicts:**
   ```bash
   netstat -tlnp | grep 7601
   ```

### Database Connection Issues

**Symptoms:**
- `ECONNREFUSED` to PostgreSQL
- Migration errors
- "relation does not exist" errors

**Solutions:**
1. **Reset PostgreSQL container:**
   ```bash
   docker stop logen-postgres
   docker rm logen-postgres
   docker-compose -f config/docker/docker-compose.yml up -d postgres
   ```

2. **Check database credentials:**
   ```bash
   docker exec -it logen-postgres psql -U logen_user -d logen_db
   ```

3. **Run migrations:**
   ```bash
   cd apps/backend
   npm run typeorm migration:run
   ```

## 🔐 Authentication Issues

### Customer Login Fails

**Symptoms:**
- 401 errors on login
- JWT token issues
- Session not created

**Solutions:**
1. **Check JWT secret consistency:**
   - Ensure `JWT_SECRET` is the same in all environments
   - Verify token generation in backend logs

2. **Clear browser storage:**
   ```javascript
   // In browser console:
   localStorage.clear();
   document.cookie.split(";").forEach(c => {
     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
   });
   ```

3. **Check API endpoints:**
   - Verify frontend calls `/customer/auth/login` not `/auth/login`
   - Check CORS settings in backend

### Admin Authentication Issues

**Symptoms:**
- Cannot access admin endpoints
- Role-based access fails

**Solutions:**
1. **Verify admin user exists:**
   ```sql
   SELECT * FROM users WHERE role = 'ADMIN';
   ```

2. **Check role guards:**
   - Ensure `@Roles('ADMIN')` decorators are present
   - Verify JWT payload contains correct role

## 🌐 Frontend Issues

### 404 Errors on Pages

**Symptoms:**
- Missing wizard pages
- Site creation pages not found
- Routing errors

**Solutions:**
1. **Check if files exist:**
   ```bash
   ls -la apps/frontend/src/app/sites/create/
   ls -la apps/frontend/src/app/wizard/
   ```

2. **Restart Next.js development server:**
   ```bash
   cd apps/frontend
   npm run dev -- --port 7601
   ```

3. **Clear Next.js cache:**
   ```bash
   rm -rf apps/frontend/.next
   ```

### Hydration Errors

**Symptoms:**
- "Text content did not match" warnings
- Client/server mismatch errors

**Solutions:**
1. **Check for client-only code in SSR:**
   ```tsx
   // Use useEffect for client-only code
   useEffect(() => {
     // Client-only code here
   }, []);
   ```

2. **Suppress hydration warnings (if necessary):**
   ```tsx
   <div suppressHydrationWarning={true}>
     {/* Dynamic content */}
   </div>
   ```

## 🗄️ Database Issues

### Migration Errors

**Symptoms:**
- Migration fails to run
- Column/table already exists
- Foreign key constraint errors

**Solutions:**
1. **Reset migrations:**
   ```bash
   # DANGER: This will delete all data
   docker exec -it logen-postgres psql -U logen_user -c "DROP DATABASE logen_db;"
   docker exec -it logen-postgres psql -U logen_user -c "CREATE DATABASE logen_db;"
   npm run typeorm migration:run
   ```

2. **Manual migration:**
   ```bash
   # Check current schema
   docker exec -it logen-postgres psql -U logen_user -d logen_db -c "\dt"
   ```

### Data Inconsistencies

**Symptoms:**
- Orphaned records
- Constraint violations
- Unexpected null values

**Solutions:**
1. **Data integrity check:**
   ```sql
   -- Check for orphaned sessions
   SELECT * FROM sessions WHERE user_id NOT IN (SELECT id FROM users);
   
   -- Check for missing required fields
   SELECT * FROM users WHERE email IS NULL OR email = '';
   ```

## 🔧 Development Workflow Issues

### Git Conflicts

**Symptoms:**
- Merge conflicts on package-lock.json
- Database migration conflicts
- Configuration file conflicts

**Solutions:**
1. **Package lock conflicts:**
   ```bash
   rm package-lock.json
   npm install
   git add package-lock.json
   ```

2. **Migration conflicts:**
   ```bash
   # Rename conflicting migration files with new timestamps
   # Or reset to golden master and reapply changes
   git reset --hard golden-master-working
   ```

### Pre-commit Hook Failures

**Symptoms:**
- Health check fails before commit
- Linting errors block commits
- Services not running

**Solutions:**
1. **Start all services:**
   ```bash
   ./scripts/start-services.sh
   ```

2. **Fix linting errors:**
   ```bash
   cd apps/frontend && npm run lint --fix
   cd ../backend && npm run lint --fix
   ```

3. **Skip hooks (emergency only):**
   ```bash
   git commit --no-verify -m "Emergency commit"
   ```

## 🚀 Recovery Procedures

### Complete System Reset

When everything is broken:

1. **Stop all services:**
   ```bash
   ./scripts/stop-services.sh
   ```

2. **Reset to golden master:**
   ```bash
   git stash
   git reset --hard golden-master-working
   ```

3. **Clean environment:**
   ```bash
   docker stop logen-postgres && docker rm logen-postgres
   rm -rf apps/*/node_modules apps/*/.next apps/*/dist
   ```

4. **Fresh start:**
   ```bash
   ./scripts/start-services.sh
   ```

### Quick Health Check

```bash
# Run this anytime you suspect issues
./scripts/health-check.sh
./scripts/check-logs.sh
```

## 📞 When All Else Fails

1. **Check system resources:**
   ```bash
   df -h /var/apps/logen  # Disk space
   free -h                # Memory
   top                    # CPU usage
   ```

2. **Create issue snapshot:**
   ```bash
   git tag "broken-state-$(date +%Y%m%d-%H%M%S)"
   ./scripts/check-logs.sh > issue-logs.txt
   ```

3. **Reset to golden master and document the issue**

Remember: **It's better to reset to a working state and lose some work than to spend hours debugging a broken system.**