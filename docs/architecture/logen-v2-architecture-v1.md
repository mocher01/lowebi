# 🏗️ **LOGEN v2 - PRODUCTION ARCHITECTURE REFERENCE v1**
*Created: September 14, 2025*
*Status: Modern Docker Network Architecture*

## 📋 **EXECUTIVE SUMMARY**

This document defines the modern, optimized architecture for LOGEN v2 multi-tenant website generation platform. All services use proper Docker networking with `logen-network` for container-to-container communication, eliminating the need for external IP connections and improving security and maintainability.

---

## 🗂️ **SERVICE ARCHITECTURE OVERVIEW**

| Service | Container Name | Image | Internal Port | External Port | Network | Domain |
|---------|---------------|--------|---------------|---------------|---------|---------|
| **Backend API** | `logen-backend` | `logen-backend:latest` | 7600 | 7600 | `logen-network` | Internal |
| **Customer Portal** | `logen-frontend` | `logen-frontend:latest` | 7601 | 7601 | `logen-network` | logen.locod-ai.com |
| **Admin Portal** | `logen-admin-frontend` | `logen-admin-frontend:latest` | 7602 | 7602 | `logen-network` | admin.logen.locod-ai.com |
| **PostgreSQL DB** | `logen-postgres` | `postgres:15-alpine` | 5432 | 7603 | `logen-network` | Internal |
| **Redis Cache** | `logen-redis` | `redis:7-alpine` | 6379 | 7679 | `logen-network` | Internal |
| **Adminer DB UI** | `logen-adminer` | `adminer:latest` | 8080 | 7605 | `logen-network` | Internal |

---

## 🐳 **DOCKER NETWORK ARCHITECTURE**

### **Primary Network**: `logen-network`
- **Type**: Bridge network
- **Purpose**: All LOGEN services communicate internally
- **Security**: Container isolation from host network
- **Performance**: Optimized container-to-container communication

### **Service Communication**:
```
logen-backend → logen-postgres:5432 (Database)
logen-backend → logen-redis:6379 (Cache)
logen-frontend → logen-backend:7600 (API calls via nginx)
logen-admin-frontend → logen-backend:7600 (API calls via nginx)
```

---

## 🏢 **CORE APPLICATION SERVICES**

### **1. Backend API Service**
- **Container**: `logen-backend`
- **Code Location**: `/var/apps/logen/apps/backend/`
- **Build**: `docker build -f Dockerfile.prod -t logen-backend:latest .`
- **Network**: `logen-network`
- **Dependencies**: `logen-postgres`, `logen-redis`

**Environment Configuration**:
```bash
NODE_ENV=production
PORT=7600
DATABASE_HOST=logen-postgres  # Docker network hostname
DATABASE_PORT=5432            # Internal container port
DATABASE_USER=locod_user
DATABASE_PASSWORD=locod_pass_2024
DATABASE_NAME=locod_db
DB_SSL=false
JWT_SECRET=your-super-secret-jwt-key-production-v2-2024
JWT_EXPIRES_IN=24h
```

**Key Features**:
- Admin API endpoints (`/admin/*`)
- Customer API endpoints (`/customer/*`, `/api/customer/*`)
- Authentication service (`/auth/*`)
- AI request queue management
- Multi-tenant data isolation
- Health check: `http://localhost:7600/api/health`

### **2. Customer Portal (Next.js)**
- **Container**: `logen-frontend`
- **Code Location**: `/var/apps/logen/apps/frontend/`
- **Build**: `docker build -f Dockerfile.prod -t logen-frontend:latest .`
- **Network**: `logen-network`
- **Dependencies**: `logen-backend` (via nginx proxy)

**Environment Configuration**:
```bash
NODE_ENV=production
PORT=7601
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_ENV=production
```

**Key Features**:
- Site creation wizard (7-step process)
- My Sites dashboard with Continue functionality
- Site preview and deployment
- Customer authentication
- Multi-tenant site isolation

### **3. Admin Portal (Next.js)**
- **Container**: `logen-admin-frontend`
- **Code Location**: `/var/apps/logen/apps/admin-frontend/`
- **Build**: `docker build -f Dockerfile.prod -t logen-admin-frontend:latest .`
- **Network**: `logen-network`
- **Dependencies**: `logen-backend` (via nginx proxy)

**Environment Configuration**:
```bash
NODE_ENV=production
PORT=7602
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_ENV=production
```

**Key Features**:
- AI Queue Management
- Customer management
- Site monitoring and analytics
- System administration
- Enhanced security headers

---

## 🗄️ **DATABASE & STORAGE ARCHITECTURE**

### **PostgreSQL Database**
- **Container**: `logen-postgres`
- **Image**: `postgres:15-alpine`
- **Internal Port**: `5432` (standard PostgreSQL)
- **External Access**: `localhost:7603` (for admin tools)
- **Volume**: `logen-postgres-data:/var/lib/postgresql/data`
- **Network**: `logen-network`

**Database Configuration**:
```bash
POSTGRES_DB=locod_db
POSTGRES_USER=locod_user
POSTGRES_PASSWORD=locod_pass_2024
```

**Key Tables**:
- `users` - Customer and admin accounts
- `wizard_sessions` - Site creation workflows with session management
- `ai_requests` - AI generation queue with proper TypeORM relations
- `sites` - Generated websites (consolidated V1/V2 schema)

### **Redis Cache**
- **Container**: `logen-redis`
- **Image**: `redis:7-alpine`
- **Internal Port**: `6379` (standard Redis)
- **External Access**: `localhost:7679` (for debugging)
- **Volume**: `logen-redis-data:/data`
- **Network**: `logen-network`

**Usage**:
- Session storage
- API response caching
- AI request queue temporary data
- Rate limiting counters

---

## 🌐 **NGINX REVERSE PROXY & SSL**

### **Configuration Structure**:
- **Admin Domain**: `admin.logen.locod-ai.com`
- **Customer Domain**: `logen.locod-ai.com`
- **SSL**: Let's Encrypt automatic renewal
- **Config Location**: `/var/apps/nginx-reverse/nginx/conf.d/`

### **Routing Rules**:

**Customer Portal** (`logen.locod-ai.com`):
```nginx
# API routes to backend
location /api/ {
    proxy_pass http://logen-backend:7600/;
}

location /customer/ {
    proxy_pass http://logen-backend:7600/customer/;
}

# Frontend static files and pages
location / {
    proxy_pass http://logen-frontend:7601/;
}
```

**Admin Portal** (`admin.logen.locod-ai.com`):
```nginx
# API routes to backend
location /api/ {
    proxy_pass http://logen-backend:7600/;
}

location /admin/ {
    proxy_pass http://logen-backend:7600/admin/;
}

# Admin frontend
location / {
    proxy_pass http://logen-admin-frontend:7602/;
}
```

---

## 🚀 **DEPLOYMENT ARCHITECTURE**

### **Build Order**:
1. **Backend** (database dependent services first)
2. **Frontend applications** (API dependent services)
3. **Network verification** (connectivity tests)

### **Health Check Strategy**:
- **Backend**: `/api/health` endpoint
- **Database**: PostgreSQL connection test
- **Redis**: PING command
- **Frontends**: Root URL accessibility
- **Network**: Inter-container connectivity

### **Container Dependencies**:
```
logen-postgres → (base dependency)
logen-redis → (base dependency)
logen-backend → logen-postgres + logen-redis
logen-frontend → logen-backend (via nginx)
logen-admin-frontend → logen-backend (via nginx)
```

---

## 🔧 **ENVIRONMENT MANAGEMENT**

### **Backend Environment Variables**:
```bash
# Application
NODE_ENV=production
PORT=7600
LOG_LEVEL=info

# Database (Docker Network)
DATABASE_HOST=logen-postgres
DATABASE_PORT=5432
DATABASE_USER=locod_user
DATABASE_PASSWORD=locod_pass_2024
DATABASE_NAME=locod_db
DB_SSL=false

# Cache (Docker Network)
REDIS_HOST=logen-redis
REDIS_PORT=6379

# Security
JWT_SECRET=your-super-secret-jwt-key-production-v2-2024
JWT_EXPIRES_IN=24h
JWT_EXPIRATION=15m
BCRYPT_ROUNDS=12

# Features
ENABLE_REQUEST_LOGGING=true
ENABLE_HEALTH_CHECKS=true
```

### **Frontend Environment Variables**:
```bash
# Application
NODE_ENV=production
PORT=7601  # or 7602 for admin

# API Configuration
NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_APP_ENV=production

# Build Configuration (Docker)
NEXT_TELEMETRY_DISABLED=1
```

---

## 🔒 **SECURITY ARCHITECTURE**

### **Network Security**:
- **Container Isolation**: All services on private `logen-network`
- **Port Exposure**: Only necessary ports exposed to host
- **SSL Termination**: At nginx level with automatic certificate renewal
- **Internal Communication**: No external IP dependencies

### **Application Security**:
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: BCrypt with 12 rounds for production
- **CORS Configuration**: Restricted to known domains
- **Rate Limiting**: Throttler protection on API endpoints
- **Input Validation**: Class-validator on all DTOs
- **SQL Injection Protection**: TypeORM parameterized queries

### **Data Security**:
- **Environment Secrets**: Stored in secure .env files
- **Database Encryption**: PostgreSQL native encryption
- **Session Management**: Redis-based session storage
- **Multi-tenant Isolation**: Row-level security by customer ID

---

## 📊 **MONITORING & OBSERVABILITY**

### **Health Monitoring**:
- **Container Health**: Docker health checks every 30s
- **Application Health**: `/api/health` endpoint monitoring
- **Database Health**: Connection pool monitoring
- **Cache Health**: Redis connectivity and memory usage

### **Logging Strategy**:
- **Production**: Structured JSON logs
- **Development**: Console output with debug info
- **Log Rotation**: Automatic via Docker logging driver
- **Error Tracking**: Comprehensive error logging with context

### **Performance Monitoring**:
- **Response Times**: Performance interceptor tracking
- **Database Queries**: TypeORM query logging
- **Memory Usage**: Container resource monitoring
- **Cache Performance**: Redis hit/miss ratios

---

## 🔄 **DEPLOYMENT WORKFLOW**

### **Standard Deployment Process**:
1. **Code Changes**: Made in `/var/apps/logen/apps/{service}/`
2. **Build Images**: `docker build` with proper tags
3. **Stop Services**: Graceful container shutdown
4. **Start Services**: New containers with health checks
5. **Verification**: Automated health and functionality tests
6. **Rollback**: Automated if health checks fail

### **Network Verification**:
```bash
# Test database connectivity
docker exec logen-backend nc -zv logen-postgres 5432

# Test cache connectivity
docker exec logen-backend nc -zv logen-redis 6379

# Test API health
curl -f http://localhost:7600/api/health
```

---

## 🎯 **OPTIMIZATION BENEFITS**

### **Performance Improvements**:
- **Faster Communication**: Direct container-to-container networking
- **Reduced Latency**: No external IP routing overhead
- **Better Resource Usage**: Optimized Docker network stack
- **Improved Caching**: Redis on same network segment

### **Security Improvements**:
- **Network Isolation**: Services not exposed to host network unnecessarily
- **Reduced Attack Surface**: No external IP dependencies
- **Container Security**: Default Docker network security policies
- **Service Mesh Ready**: Prepared for future service mesh integration

### **Maintainability Improvements**:
- **Consistent Naming**: All services follow `logen-*` pattern
- **Clear Dependencies**: Explicit service relationships
- **Environment Clarity**: Docker network vs external access clearly defined
- **Documentation**: Comprehensive architecture reference

---

## 📋 **MIGRATION NOTES**

### **Changes from v0 Architecture**:
- **Database Connection**: `127.0.0.1:7603` → `logen-postgres:5432`
- **Redis Connection**: External IP → `logen-redis:6379`
- **Network Strategy**: Host networking → Docker bridge networking
- **Container Naming**: Standardized `logen-*` prefix
- **Environment Management**: Centralized and documented

### **Backward Compatibility**:
- **External Access**: Database still accessible on `localhost:7603` for tools
- **API Endpoints**: No changes to external API contracts
- **Data Storage**: Existing volumes and data preserved
- **SSL Certificates**: Existing certificates continue to work

---

**This v1 architecture provides a modern, secure, and maintainable foundation for LOGEN v2 with proper Docker networking practices and clear service boundaries.**