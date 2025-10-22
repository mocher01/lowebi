# Website Generator v2 - Production Deployment Guide

This guide covers the complete production deployment process for the Website Generator v2 platform, including SSL/HTTPS configuration, monitoring, and security hardening.

## 🚀 Quick Start

### Prerequisites

- Ubuntu 20.04+ or CentOS 8+ server
- Docker 20.10+ and Docker Compose 2.0+
- Root access to the server
- Domain or static IP address (162.55.213.90)
- At least 4GB RAM and 20GB disk space

### 1. Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd website-generator/v2

# Copy environment configuration
cp .env.production .env

# Edit environment variables (IMPORTANT!)
nano .env
```

**Critical Environment Variables to Update:**
```bash
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD_HERE
JWT_SECRET=YOUR_32_CHAR_JWT_SECRET_HERE
GRAFANA_PASSWORD=YOUR_GRAFANA_PASSWORD_HERE
ADMIN_EMAIL=your-admin@email.com
```

### 2. Generate SSL Certificates

```bash
# Navigate to nginx directory
cd docker/nginx

# Make script executable and run
chmod +x generate-ssl.sh
./generate-ssl.sh

# For production, replace with real certificates
# cp /path/to/real/cert.pem ssl/cert.pem
# cp /path/to/real/key.pem ssl/key.pem
```

### 3. Deploy Production Stack

```bash
# Make deployment script executable
chmod +x scripts/deploy-production.sh

# Run deployment
./scripts/deploy-production.sh deploy
```

### 4. Verify Deployment

```bash
# Check service status
./scripts/deploy-production.sh status

# Run health checks
./scripts/deploy-production.sh health

# View logs
./scripts/deploy-production.sh logs
```

## 📋 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Architecture                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Nginx     │    │   Next.js   │    │   NestJS    │     │
│  │ Reverse     │◄──►│  Frontend   │◄──►│   Backend   │     │
│  │ Proxy       │    │ Port: 6001  │    │ Port: 6000  │     │
│  │ SSL/HTTPS   │    │             │    │             │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                                       │           │
│         ▼                                       ▼           │
│  ┌─────────────┐                    ┌─────────────┐         │
│  │  Let's      │                    │ PostgreSQL  │         │
│  │  Encrypt    │                    │ Database    │         │
│  │  SSL        │                    │ Port: 5433  │         │
│  └─────────────┘                    └─────────────┘         │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ Prometheus  │    │   Grafana   │    │    Redis    │     │
│  │ Metrics     │    │ Monitoring  │    │   Cache     │     │
│  │ Port: 9090  │    │ Port: 3001  │    │ Port: 6380  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

## 🔐 Security Features

### SSL/HTTPS Configuration
- **Automatic HTTP to HTTPS redirect**
- **Strong cipher suites (TLS 1.2+)**
- **HSTS headers enabled**
- **Self-signed certificates for development**
- **Let's Encrypt ready for production**

### Security Headers
```nginx
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

### Rate Limiting
- **API endpoints: 10 requests/second**
- **Authentication: 5 requests/second**
- **General traffic: 50 requests/second**
- **Automatic IP blocking on abuse**

### Application Security
- **JWT token authentication**
- **Bcrypt password hashing (12 rounds)**
- **Input validation and sanitization**
- **SQL injection prevention**
- **CORS properly configured**

## 📊 Monitoring & Alerting

### Health Check Endpoints

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `/api/health` | Basic health check | Service status |
| `/api/health/detailed` | Detailed system info | Memory, CPU, database |
| `/api/health/readiness` | Load balancer probe | Service readiness |
| `/api/health/liveness` | Container probe | Service alive status |
| `/api/metrics` | Prometheus metrics | Performance metrics |

### Monitoring Stack

**Prometheus (Port 9090)**
- Application metrics collection
- System performance monitoring
- Custom business metrics

**Grafana (Port 3001)**
- Visual monitoring dashboards
- Real-time system overview
- Alert management

**System Monitor Script**
```bash
# Install monitoring cron job
./scripts/system-monitor.sh install-cron

# Manual monitoring check
./scripts/system-monitor.sh full

# Generate monitoring report
./scripts/system-monitor.sh report
```

## 🗂️ Backup & Recovery

### Automated Backups

```bash
# Setup automated daily backups
chmod +x scripts/backup-restore.sh

# Add to crontab for daily backup at 2 AM
echo "0 2 * * * /root/website-generator/v2/scripts/backup-restore.sh backup" | crontab -

# Manual backup
./scripts/backup-restore.sh backup

# List available backups
./scripts/backup-restore.sh list
```

### Recovery Process

```bash
# Restore from backup
./scripts/backup-restore.sh restore /backups/website-generator/20240816_143000/database.sql.gz

# Verify backup integrity
./scripts/backup-restore.sh verify /backups/website-generator/20240816_143000
```

### Backup Configuration

- **Database**: Daily compressed dumps
- **Configuration**: Environment and Docker files
- **Retention**: 30 days local, extended on cloud
- **Verification**: Automatic integrity checks
- **Encryption**: Optional backup encryption

## 🚀 Production Access URLs

After successful deployment, access your application at:

- **Frontend Application**: https://162.55.213.90:7643
- **Backend API**: https://162.55.213.90:7643/api
- **API Documentation**: https://162.55.213.90:7643/api/docs
- **Health Checks**: https://162.55.213.90:7643/api/health
- **Direct Backend**: http://162.55.213.90:7600
- **Direct Frontend**: http://162.55.213.90:7601
- **Monitoring Dashboard**: http://162.55.213.90:7690 (Grafana)
- **Metrics**: http://162.55.213.90:7691 (Prometheus)

## 🛠️ Management Commands

### Service Management
```bash
# View service status
docker-compose -f docker/docker-compose.prod.yml ps

# Restart specific service
docker-compose -f docker/docker-compose.prod.yml restart backend

# View logs
docker-compose -f docker/docker-compose.prod.yml logs -f backend

# Scale services (if needed)
docker-compose -f docker/docker-compose.prod.yml up -d --scale backend=2
```

### Database Management
```bash
# Connect to database
docker exec -it locod-postgres-prod psql -U locod_user -d locod_prod

# Database backup
docker exec locod-postgres-prod pg_dump -U locod_user locod_prod > backup.sql

# Monitor database performance
docker exec locod-postgres-prod psql -U locod_user -d locod_prod -c "SELECT * FROM pg_stat_activity;"
```

### Log Management
```bash
# View application logs
docker logs locod-backend-prod --tail=100 -f
docker logs locod-frontend-prod --tail=100 -f

# View Nginx access logs
docker exec locod-nginx-prod tail -f /var/log/nginx/access.log

# System logs
journalctl -u docker -f
```

## 🔧 Troubleshooting

### Common Issues

**1. SSL Certificate Issues**
```bash
# Regenerate certificates
cd docker/nginx
./generate-ssl.sh

# Check certificate validity
openssl x509 -in ssl/cert.pem -text -noout
```

**2. Database Connection Issues**
```bash
# Check database status
docker exec locod-postgres-prod pg_isready -U locod_user

# Restart database
docker-compose -f docker/docker-compose.prod.yml restart postgres
```

**3. Memory Issues**
```bash
# Check memory usage
free -h
docker stats

# Restart services if needed
docker-compose -f docker/docker-compose.prod.yml restart
```

**4. Performance Issues**
```bash
# Check system resources
./scripts/system-monitor.sh system

# Analyze slow queries
docker exec locod-postgres-prod psql -U locod_user -d locod_prod -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;"
```

### Log Locations

- **Application Logs**: Docker container logs
- **System Logs**: `/var/log/system-monitor.log`
- **Nginx Logs**: `/var/log/nginx/` (in container)
- **Deployment Logs**: `/var/log/deployment.log`

## 📞 Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor system health via Grafana
- Check backup completion
- Review error logs

**Weekly:**
- Update system packages
- Review security alerts
- Performance optimization

**Monthly:**
- SSL certificate renewal check
- Database optimization
- Security audit

### Performance Tuning

**Database Optimization:**
```sql
-- Run in PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE locod_prod;
```

**Application Optimization:**
- Monitor memory usage patterns
- Optimize database queries
- Review and update rate limits
- Cache optimization

### Security Updates

```bash
# Update system packages
apt update && apt upgrade -y

# Update Docker images
docker-compose -f docker/docker-compose.prod.yml pull
docker-compose -f docker/docker-compose.prod.yml up -d

# Security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v /tmp:/tmp anchore/grype:latest \
  $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep locod)
```

## 📈 Scaling Guidelines

### Horizontal Scaling
```bash
# Scale backend instances
docker-compose -f docker/docker-compose.prod.yml up -d --scale backend=3

# Add load balancer configuration
# Update nginx upstream configuration
```

### Vertical Scaling
- Increase container memory limits
- Optimize database configuration
- Add Redis caching layer

### Database Scaling
- Read replicas for read-heavy workloads
- Connection pooling optimization
- Query optimization and indexing

---

**Support Contact**: admin@locod.ai  
**Documentation**: [Project Repository]  
**Last Updated**: August 16, 2025