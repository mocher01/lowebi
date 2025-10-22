# Portal v2.0 Production Deployment Coordination

## 🚨 CRITICAL UPDATE: SSL DEPLOYMENT COORDINATION ACTIVE
**Status**: GitHub Issues Created for Coordinated Production Deployment  
**Target Domain**: https://logen.locod-ai.com (SSL/HTTPS Configuration)  
**Critical Issue**: Portal v2.0 configs created locally but NOT deployed to production server
**Latest Action**: Multi-phase deployment coordination initiated via GitHub issues

---

## 📋 ACTIVE GITHUB ISSUES COORDINATION

### Master Coordination Issue
- **Issue #63**: [CRITICAL] Portal v2.0 Production SSL Deployment - ACTUAL SERVER DEPLOYMENT REQUIRED
  - Status: OPEN - Blocking V1 to V2 migration
  - Tracks overall deployment progress and success criteria

### Phase-Based Execution Issues
- **Issue #64**: [DEVOPS] Phase 1: Production Server Assessment for Portal v2.0 SSL Deployment
  - Agent: DevOps Engineer
  - Duration: 30 minutes
  - Tasks: Server access, nginx assessment, service inventory, backup preparation

- **Issue #65**: [DEVOPS] Phase 2: Execute Portal v2.0 SSL Production Deployment  
  - Agent: DevOps Engineer
  - Duration: 45 minutes
  - Dependencies: Issue #64 completed
  - Tasks: SSL certificate generation, nginx configuration, deployment execution

- **Issue #66**: [QA] Phase 3: Production Validation & Comprehensive Testing
  - Agent: QA Tester  
  - Duration: 30 minutes
  - Dependencies: Issue #65 completed
  - Tasks: Domain validation, SSL testing, authentication flows, regression testing

### Total Execution Timeline
- **Total Duration**: ~2 hours for complete production deployment
- **Critical Path**: Sequential execution required (Phase 1 → Phase 2 → Phase 3)
- **Success Criteria**: https://logen.locod-ai.com loads Portal v2.0 with valid SSL

---

## 🔧 DEPLOYMENT ARTIFACTS READY

All necessary configuration files and scripts are prepared in the repository:
- `v2/scripts/deploy-production-ssl.sh` - Complete automated deployment
- `v2/scripts/validate-production-ssl.sh` - Comprehensive validation testing  
- `v2/docker/nginx/logen.locod-ai.com.conf` - Production nginx configuration
- `v2/docker/nginx/generate-ssl-logen.sh` - SSL certificate generation
- `v2/docker/nginx/backup-nginx-config.sh` - Safety backup procedures

---

## ⚠️ SAFETY REQUIREMENTS ENFORCED
- **ZERO DISRUPTION** to existing production services (n8n, etc.)
- **BACKUP FIRST** approach - all configurations backed up before changes
- **ADDITIVE CONFIGURATION** - no modifications to existing nginx rules
- **COMPREHENSIVE TESTING** - full validation before declaring success
- **ROLLBACK READY** - emergency restoration procedures prepared

---

## Phase 1: Code Transfer Strategy (SUPERSEDED BY SSL DEPLOYMENT) 
**Assigned**: devops_debugger_engineer

### Option A: Archive Transfer (Recommended)
```bash
# On local machine
cd /c/Users/M/Documents/Root/01.\ Business/02.\ Freelance/06.\ Locod.AI/Projets/claudeprojects/website-generator
tar -czf portal-v2-deployment.tar.gz v2/ --exclude=node_modules --exclude=.git

# Transfer to server via scp/rsync
scp portal-v2-deployment.tar.gz root@162.55.213.90:/root/

# On server
cd /root/website-generator
tar -xzf /root/portal-v2-deployment.tar.gz
```

### Option B: GitHub Release Package
```bash
# Create deployment release on GitHub
gh release create v2.0-deployment --target main --title "Portal v2.0 Production Deploy" --notes "Port-configured production deployment"

# Download on server
cd /root/website-generator
wget https://github.com/[repo]/archive/refs/tags/v2.0-deployment.tar.gz
tar -xzf v2.0-deployment.tar.gz
```

### Option C: Direct Docker Build
```bash
# If git works with different auth method
cd /root/website-generator
git init
git remote add origin [repo-url]
git fetch origin main
git checkout -b main origin/main
```

## Phase 2: Environment Configuration
**Assigned**: backend_developer

### Production Environment Setup
```bash
# Create production environment file
cd /root/website-generator/v2
cp .env.example .env
```

**Required Environment Variables:**
- `POSTGRES_PASSWORD` - Secure database password
- `JWT_SECRET` - Cryptographically secure secret (32+ chars)
- `GRAFANA_PASSWORD` - Admin password for monitoring
- `NODE_ENV=production`
- `LOG_LEVEL=info`

## Phase 3: SSL & Security Setup
**Assigned**: devops_debugger_engineer

### SSL Certificate Generation
```bash
cd /root/website-generator/v2/docker/nginx
chmod +x generate-ssl.sh
./generate-ssl.sh
```

### Firewall Configuration
```bash
# Open required ports
ufw allow 6000/tcp  # Backend API
ufw allow 6001/tcp  # Frontend
ufw allow 6080/tcp  # HTTP Nginx
ufw allow 6443/tcp  # HTTPS Nginx
ufw allow 6090/tcp  # Grafana
ufw allow 6091/tcp  # Prometheus
```

## Phase 4: Production Deployment
**Assigned**: devops_debugger_engineer

### Execute Deployment
```bash
cd /root/website-generator/v2
chmod +x scripts/deploy-production.sh
./scripts/deploy-production.sh
```

### Service Verification
```bash
# Check all services are running
docker-compose -f docker/docker-compose.prod.yml ps

# Verify health endpoints
curl http://162.55.213.90:6000/api/health
curl http://162.55.213.90:6001
```

## Phase 5: External Accessibility Testing
**Assigned**: qa_acceptance_tester

### Test External Access
- **Frontend**: http://162.55.213.90:6001
- **Backend API**: http://162.55.213.90:6000/api
- **HTTPS Frontend**: https://162.55.213.90:6443
- **HTTPS API**: https://162.55.213.90:6443/api
- **Monitoring**: http://162.55.213.90:6090 (Grafana)

### Authentication Flow Testing
1. Register new user account
2. Login with credentials
3. Access protected admin routes
4. Verify JWT token handling
5. Test session management

## Phase 6: Performance & Monitoring
**Assigned**: qa_acceptance_tester

### Performance Verification
- Page load times < 2 seconds
- API response times < 500ms
- Database query optimization
- Memory and CPU usage monitoring

### Monitoring Dashboard Setup
- Configure Grafana dashboards
- Set up alerts for system issues
- Verify Prometheus metrics collection

## Critical Success Factors

1. **Port Conflicts**: Verified 6000-6100 range is available
2. **Database Migration**: Automatic with docker-compose up
3. **SSL Configuration**: Self-signed for development, Let's Encrypt for production
4. **External Access**: Firewall rules and service binding verification
5. **Health Monitoring**: Comprehensive health checks and monitoring

## Rollback Strategy

If deployment fails:
```bash
# Stop new services
cd /root/website-generator/v2
docker-compose -f docker/docker-compose.prod.yml down

# Restore backup if needed
# Previous v1 system on ports 3000-3006 remains operational
```

## Next Actions Required

1. **devops_debugger_engineer**: Execute Phase 1 code transfer
2. **backend_developer**: Create secure production environment file
3. **devops_debugger_engineer**: Execute deployment script
4. **qa_acceptance_tester**: Validate external accessibility and performance

## Communication Protocol

- Update this document with progress on each phase
- Report any blockers immediately for coordination
- Confirm completion of each phase before proceeding to next