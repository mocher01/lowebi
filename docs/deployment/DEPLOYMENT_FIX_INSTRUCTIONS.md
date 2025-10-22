# Portal v2.0 Backend Deployment Fix Instructions

## Current Status
- **Frontend**: ✅ Deployed and operational on http://162.55.213.90:7601
- **Backend**: ❌ Failing to start due to database authentication errors
- **Error**: `password authentication failed for user "postgres"`

## Solution Overview

I've created comprehensive diagnostic and fix scripts to resolve the database connectivity issues and get the Portal v2.0 backend operational on port 7600.

## Files Created

### 1. Database Connection Diagnostic Script
**File**: `C:\Users\M\Documents\Root\01. Business\02. Freelance\06. Locod.AI\Projets\claudeprojects\website-generator\v2\backend\database-connection-diagnostic.js`

**Purpose**: Tests multiple PostgreSQL connection configurations to find working credentials.

**Usage on Server**:
```bash
cd /var/apps/website-generator/v2/backend
node database-connection-diagnostic.js
```

### 2. Production Environment Configuration
**File**: `C:\Users\M\Documents\Root\01. Business\02. Freelance\06. Locod.AI\Projets\claudeprojects\website-generator\v2\backend\.env.server`

**Purpose**: Optimized .env configuration for server deployment.

### 3. Deployment Verification Script
**File**: `C:\Users\M\Documents\Root\01. Business\02. Freelance\06. Locod.AI\Projets\claudeprojects\website-generator\v2\backend\deployment-verification.js`

**Purpose**: Tests all critical endpoints after deployment to verify functionality.

**Usage on Server**:
```bash
cd /var/apps/website-generator/v2/backend
node deployment-verification.js
```

### 4. Comprehensive Deployment Fix Script (Linux)
**File**: `C:\Users\M\Documents\Root\01. Business\02. Freelance\06. Locod.AI\Projets\claudeprojects\website-generator\v2\backend\fix-deployment.sh`

**Purpose**: Complete automated fix script for Linux/server deployment.

**Usage on Server**:
```bash
cd /var/apps/website-generator/v2/backend
chmod +x fix-deployment.sh
./fix-deployment.sh
```

### 5. Windows Development Fix Script
**File**: `C:\Users\M\Documents\Root\01. Business\02. Freelance\06. Locod.AI\Projets\claudeprojects\website-generator\v2\backend\fix-deployment.bat`

**Purpose**: Windows version for local testing.

## Step-by-Step Server Deployment Fix

### Step 1: Connect to Production Server
```bash
ssh root@162.55.213.90
```

### Step 2: Navigate to Backend Directory
```bash
cd /var/apps/website-generator/v2/backend
```

### Step 3: Copy Diagnostic Scripts
Copy the following files from your local environment to the server:
- `database-connection-diagnostic.js`
- `deployment-verification.js`
- `fix-deployment.sh`
- `.env.server`

### Step 4: Run Database Diagnostic
```bash
node database-connection-diagnostic.js
```

This will:
- Test various PostgreSQL connection configurations
- Identify working database credentials
- Display recommended .env configuration

### Step 5: Run Automated Fix Script
```bash
chmod +x fix-deployment.sh
./fix-deployment.sh
```

This will:
- Discover working database configuration
- Create proper .env file
- Stop existing services
- Install dependencies
- Build the application
- Start the backend service
- Verify all endpoints

### Step 6: Verify Deployment
```bash
node deployment-verification.js
```

This will test:
- Health endpoint: http://162.55.213.90:7600/api/health
- API documentation: http://162.55.213.90:7600/api/docs
- Authentication endpoints
- CORS configuration

## Expected Database Configurations

The diagnostic script will test these configurations in order:

1. **v2test-postgres (Port 5433)**:
   - Host: 127.0.0.1:5433
   - User: postgres (no password)
   - Database: postgres

2. **v2test-postgres with locod_user**:
   - Host: 127.0.0.1:5433
   - User: locod_user
   - Password: locod_pass_2024
   - Database: locod_db or locod_prod

3. **n8n-prod-postgres (Port 5432)**:
   - Host: 127.0.0.1:5432
   - User: postgres (no password)
   - Database: postgres

## Manual Fallback Process

If the automated script fails, follow these manual steps:

### 1. Check PostgreSQL Containers
```bash
docker ps | grep postgres
docker start v2test-postgres
docker start n8n-prod-postgres
```

### 2. Test Database Connection Manually
```bash
# Test v2test-postgres
psql -h 127.0.0.1 -p 5433 -U postgres -d postgres -c "SELECT version();"

# Test n8n-prod-postgres
psql -h 127.0.0.1 -p 5432 -U postgres -d postgres -c "SELECT version();"
```

### 3. Create .env File Manually
Copy the contents from `.env.server` and update with working credentials:

```bash
cp .env.server .env
nano .env
```

Update the database configuration with working credentials.

### 4. Build and Start Backend
```bash
npm install
npm run build
npm run start:prod
```

### 5. Test Endpoints
```bash
curl http://127.0.0.1:7600/api/health
curl http://127.0.0.1:7600/api/docs
```

## Success Criteria

After successful deployment, the following should be accessible:

- ✅ **Health Check**: http://162.55.213.90:7600/api/health
- ✅ **API Documentation**: http://162.55.213.90:7600/api/docs
- ✅ **Root Endpoint**: http://162.55.213.90:7600/
- ✅ **Authentication**: http://162.55.213.90:7600/auth/login
- ✅ **Frontend Integration**: http://162.55.213.90:7601

## Troubleshooting

### Database Connection Issues
1. Verify PostgreSQL containers are running
2. Check firewall rules for ports 5432 and 5433
3. Verify database credentials and user permissions

### Backend Startup Issues
1. Check Node.js version compatibility
2. Verify all dependencies are installed
3. Check for port conflicts on 7600

### CORS Issues
1. Verify frontend URL in CORS configuration
2. Check that frontend is accessible on port 7601
3. Test OPTIONS requests to backend endpoints

## Expected Timeline

- **Database Diagnostic**: 2-5 minutes
- **Automated Fix**: 5-10 minutes
- **Manual Fix (if needed)**: 10-20 minutes
- **Verification**: 2-5 minutes

**Total Expected Time**: 15-30 minutes

## Contact Support

If issues persist after following these instructions:
1. Capture the output of the diagnostic script
2. Check backend logs: `journalctl -u portal-v2-backend -f`
3. Verify PostgreSQL container status and logs