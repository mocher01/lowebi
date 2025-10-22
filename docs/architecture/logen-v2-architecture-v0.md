# 🏗️ **LOGEN v2 - PRODUCTION ARCHITECTURE REFERENCE v0**
*Last Updated: September 7, 2025*  
*Status: Currently Deployed & Operational*

## 📋 **EXECUTIVE SUMMARY**

This document serves as the definitive reference for the currently deployed LOGEN v2 multi-tenant website generation platform. The system consists of 3 main application services, 2 databases, and supporting infrastructure, all orchestrated via Docker containers with NGINX reverse proxy handling SSL termination and routing.

---

## 🗂️ **DEPLOYED SERVICES OVERVIEW**

| Service | Container Name | Image | Port | Domain | Status |
|---------|---------------|--------|------|---------|---------|
| **Backend API** | `logen-backend` | `logen-backend` | 7600 | Internal | ✅ Healthy |
| **Admin Portal** | `logen-admin-frontend` | `logen-admin-frontend` | 7602 | admin.logen.locod-ai.com | ✅ Healthy |
| **Customer Portal** | `logen-frontend` | `logen-frontend` | 7601 | logen.locod-ai.com | ✅ Healthy |
| **PostgreSQL DB** | `logen-postgres` | `postgres:15-alpine` | 7603 | Internal | ✅ Healthy |
| **Redis Cache** | `logen-redis` | `redis:7-alpine` | 7679 | Internal | ✅ Healthy |
| **Adminer DB UI** | `logen-adminer` | `adminer:latest` | 7605 | Internal | ✅ Running |

---

## 🏢 **CORE APPLICATION ARCHITECTURE**

### **1. Backend API Service** 
- **Container**: `logen-backend`
- **Code Location**: `/var/apps/logen/apps/backend/`
- **Dockerfile**: `/var/apps/logen/apps/backend/Dockerfile.prod`
- **Image**: `logen-backend`
- **Port**: `7600` (Internal)
- **Technology**: NestJS + TypeScript + TypeORM
- **Database**: PostgreSQL (`logen-postgres:7603`)
- **Cache**: Redis (`logen-redis:7679`)
- **Health Check**: `http://localhost:7600/api/health`

**Key Features**:
- Admin API endpoints (`/admin/*`)
- Customer API endpoints (`/customer/*`, `/api/customer/*`)
- Authentication service (`/auth/*`)
- AI request queue management
- Site generation & deployment logic
- Multi-tenant data isolation

### **2. Admin Portal (Next.js)**
- **Container**: `logen-admin-frontend`
- **Code Location**: `/var/apps/logen/apps/admin-frontend/`
- **Dockerfile**: `/var/apps/logen/apps/admin-frontend/Dockerfile.prod`
- **Image**: `logen-admin-frontend`
- **Port**: `7602`
- **Domain**: `https://admin.logen.locod-ai.com`
- **Technology**: Next.js 14 + React + TypeScript + Tailwind CSS

**Key Features**:
- AI Queue Management (✅ Fixed UUID display issue)
- Customer management
- Site monitoring & analytics
- System administration
- User authentication with enhanced security headers

### **3. Customer Portal (Next.js)**
- **Container**: `logen-frontend`
- **Code Location**: `/var/apps/logen/apps/frontend/`
- **Dockerfile**: `/var/apps/logen/apps/frontend/Dockerfile.prod`
- **Image**: `logen-frontend`
- **Port**: `7601`
- **Domain**: `https://logen.locod-ai.com`
- **Technology**: Next.js 14 + React + TypeScript + Tailwind CSS

**Key Features**:
- Site creation wizard
- Site management dashboard
- Preview & deployment tools
- Customer authentication
- Multi-tenant site isolation

---

## 🗄️ **DATABASE & STORAGE ARCHITECTURE**

### **PostgreSQL Database**
- **Container**: `logen-postgres`
- **Image**: `postgres:15-alpine`
- **Port**: `7603` (External: `127.0.0.1:7603`)
- **Volume**: `logen-postgres-data` → `/var/lib/postgresql/data`
- **Database**: `locod_db`
- **User**: `locod_user`
- **Network**: `logen-network`

**Key Tables**:
- `users` - Customer & admin accounts
- `sites` - Generated websites (V1 schema consolidated)
- `wizard_sessions` - Site creation workflows
- `ai_requests` - AI generation queue (✅ Fixed with proper relations)

### **Redis Cache Systems**
**Primary Redis** (`logen-redis`):
- Port: `7604` (External)
- Volume: `redis_data`
- Usage: Development/legacy

**Production Redis** (`logen-redis-prod`):
- Port: `7679` (External) → `6379` (Internal)
- Volume: `logen-redis-prod-data`
- Usage: Current production cache & sessions

---

## 🌐 **NGINX REVERSE PROXY & SSL**

### **Configuration Files**:
- **Admin Portal**: `/var/apps/nginx-reverse/nginx/conf.d/admin.logen.locod-ai.com.conf`
- **Customer Portal**: `/var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf`

### **Routing Rules**:
**admin.logen.locod-ai.com**:
```
/api/* → logen-backend:7600/api/*
/admin/* → logen-backend:7600/admin/*
/auth/* → logen-backend:7600/auth/*
/_next/* → logen-admin-frontend:7602/_next/*
/* → logen-admin-frontend:7602
```

**logen.locod-ai.com**:
```
/customer/* → logen-backend:7600/customer/*
/api/customer/* → logen-backend:7600/api/customer/*
/api/* → logen-backend:7600/*
/_next/* → logen-frontend:7601/_next/*
/* → logen-frontend:7601
```

### **SSL Certificates**:
- **Admin**: `/etc/letsencrypt/live/admin.logen.locod-ai.com/`
- **Customer**: `/etc/letsencrypt/live/logen.locod-ai.com/`
- **Auto-renewal**: Certbot configured

---

## 🐳 **DOCKER ORCHESTRATION**

### **Primary Compose File**:
- **Location**: `/var/apps/logen/config/docker/prod/docker-compose.yml`
- **Network**: `logen-network`
- **Environment**: Production

### **Alternative Compose Files** (Not Currently Used):
- `/var/apps/logen/config/docker/docker-compose.yml` (Development)
- `/var/apps/logen/config/docker/docker-compose.simple.yml`
- `/var/apps/logen/config/docker/docker-compose.backend-only.yml`

### **Docker Images Build Context**:
```
logen-backend ← /var/apps/logen/apps/backend/ + Dockerfile.prod
logen-admin-frontend ← /var/apps/logen/apps/admin-frontend/ + Dockerfile.prod  
logen-frontend ← /var/apps/logen/apps/frontend/ + Dockerfile.prod
```

### **Docker Networks**:
- `logen-network` (Production - Currently Used)

### **Persistent Volumes**:
```
logen-postgres-data (External, shared)
logen-redis-data
```

---

## 🔧 **ENVIRONMENT CONFIGURATION**

### **Backend Environment** (Production):
```bash
NODE_ENV=production
PORT=7600
DATABASE_HOST=127.0.0.1  # Note: External IP for container networking
DATABASE_PORT=7603
DATABASE_USER=locod_user
DATABASE_PASSWORD=locod_pass_2024
DATABASE_NAME=locod_db
DB_SSL=false
JWT_SECRET=your-super-secret-jwt-key-production-v2-2024
JWT_EXPIRES_IN=24h
```

### **Frontend Environment**:
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://admin.logen.locod-ai.com (Admin)
NEXT_PUBLIC_API_URL=https://logen.locod-ai.com (Customer)
NEXT_PUBLIC_APP_ENV=production
```

---

## 🏗️ **RECENT ARCHITECTURE FIXES** ✅

### **TypeORM Entity Relations Fixed** (September 2025):
- **Issue**: AI Queue showing UUIDs instead of names
- **Root Cause**: Missing TypeORM relations in `AiRequest` entity
- **Solution**: Added proper `@ManyToOne` relations:
  ```typescript
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: User;

  @ManyToOne(() => Site, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'site_id' })
  site?: Site;
  ```

### **Database Schema Consolidation**:
- **V1 Legacy**: Archived to `/var/apps/logen/archive/v1-legacy/`
- **Current Schema**: Unified under `/var/apps/logen/apps/backend/src/*/entities/`
- **Migration**: V1 data structures preserved with compatibility getters

---

## ⚠️ **CRITICAL OPERATIONAL NOTES**

### **Container Management**:
1. **Only ONE Environment**: Production containers only (no separate dev/prod)
2. **Image Naming Inconsistency**: Customer frontend uses `logen_frontend` vs `logen-customer-frontend:prod` pattern
3. **Database Connection**: Backend connects via external IP (162.55.213.90) - not Docker network
4. **Redis**: Two Redis instances running (legacy cleanup needed)

### **Development vs Production**:
- **Production Containers**: Currently deployed and operational
- **Docker Compose**: Production file defines services not all currently deployed
- **Code Updates**: Require container rebuilds for deployment

### **Security**:
- SSL termination at NGINX level
- Enhanced CSP headers for admin portal
- JWT-based authentication
- Database credentials in environment files (consider secrets management)

---

## 🔄 **DEPLOYMENT WORKFLOW**

1. **Code Changes**: Made in `/var/apps/logen/apps/{service}/`
2. **Build**: `docker build -t {service}:prod -f Dockerfile.prod .`
3. **Deploy**: `docker stop {container} && docker run...` or compose restart
4. **Verification**: Health checks + manual testing
5. **DNS**: Automatic via NGINX + Let's Encrypt SSL

---

## 📊 **MONITORING & HEALTH CHECKS**

### **Container Health**:
- All services have configured health checks
- Status visible via `docker ps`
- Backend: `curl -f http://localhost:7600/api/health`
- Frontends: `curl -f http://localhost:{port}`

### **Database Administration**:
- **Adminer**: Available on port 7605 (internal access)
- **Direct PostgreSQL**: Port 7603
- **Redis**: Ports 7604 (legacy) + 7679 (production)

---

## 📋 **OPTIMIZATION ROADMAP**

### **Phase 1: Container Standardization**
1. **Standardize Image Naming**: Change `logen_frontend` → `logen-customer-frontend:prod`
2. **Cleanup Redis**: Remove unused `logen-redis` container (port 7604)
3. **Docker Network**: Move backend to use Docker network instead of external IP
4. **Environment Management**: Implement Docker secrets for credentials
5. **Monitoring**: Add centralized logging and metrics collection

### **Phase 2: Infrastructure Improvements**
- Container orchestration with docker-compose
- Automated health monitoring
- Backup strategies for persistent data
- CI/CD pipeline integration
- Load balancing considerations

---

**This document provides the complete current state of LOGEN v2 architecture as of September 2025. All services are operational and the recent AI Queue UUID display issue has been successfully resolved.**