# LOGEN Deployment Manager

The LOGEN Deployment Manager is a comprehensive script that provides a single entry point for all LOGEN deployment operations. It ensures consistent naming conventions, fixed port allocations, and reliable service management across all environments.

## 🎯 Key Features

- **Standardized Naming**: All containers and images follow `logen-{service}-{env}` convention
- **Fixed Port Allocation**: Ports never change, preventing conflicts
- **Environment Isolation**: Separate configurations for dev, staging, and prod
- **Health Monitoring**: Comprehensive health checks for all services
- **Backup & Restore**: Automated backup and restore functionality
- **Validation**: Pre-deployment validation to catch issues early
- **Single Entry Point**: One script to manage all operations

## 📋 Port Allocation (Fixed)

These ports are **NEVER** changed to ensure consistency:

| Service | Port | Purpose |
|---------|------|---------|
| Backend | 7600 | NestJS API server |
| Admin Frontend | 7602 | Admin portal (Next.js) |
| Customer Frontend | 7601 | Customer portal (Next.js) |
| PostgreSQL Main | 5433 | Main database |
| PostgreSQL Prod | 7633 | Production database |
| Redis | 7679 | Cache and sessions |
| Nginx HTTP | 80 | Reverse proxy |
| Nginx HTTPS | 443 | SSL termination |

## 🚀 Quick Start

### 1. Initialize Environment

```bash
# Initialize production environment
./scripts/deploy/logen-manager.sh init prod

# Initialize development environment  
./scripts/deploy/logen-manager.sh init dev
```

### 2. Validate Configuration

```bash
# Validate environment before deployment
./scripts/deploy/logen-manager.sh validate prod
```

### 3. Deploy Services

```bash
# Deploy all services
./scripts/deploy/logen-manager.sh deploy prod

# Check deployment status
./scripts/deploy/logen-manager.sh status prod
```

### 4. Monitor Health

```bash
# Run comprehensive health checks
./scripts/deploy/logen-manager.sh health prod
```

## 📖 Command Reference

### Environment Management

```bash
# Initialize a new environment
./scripts/deploy/logen-manager.sh init <env>

# Deploy/redeploy all services
./scripts/deploy/logen-manager.sh deploy <env>

# Check services status  
./scripts/deploy/logen-manager.sh status <env>

# Run health checks
./scripts/deploy/logen-manager.sh health <env>

# Validate configuration
./scripts/deploy/logen-manager.sh validate <env>
```

### Service Management

```bash
# Rebuild a specific service
./scripts/deploy/logen-manager.sh rebuild <service> <env>

# Restart a service
./scripts/deploy/logen-manager.sh restart <service> <env>

# View service logs
./scripts/deploy/logen-manager.sh logs <service> <env>

# Scale service (future feature)
./scripts/deploy/logen-manager.sh scale <service> <env> <replicas>
```

### Maintenance Operations

```bash
# Create backup
./scripts/deploy/logen-manager.sh backup <env>

# Restore from backup
./scripts/deploy/logen-manager.sh restore <env> <backup-file>

# Clean unused resources
./scripts/deploy/logen-manager.sh cleanup <env>
```

## 🏗️ Architecture

### Directory Structure

```
scripts/deploy/
├── logen-manager.sh              # Main script
├── lib/
│   ├── environment.sh            # Environment management
│   ├── docker.sh                 # Docker operations
│   ├── health.sh                 # Health checks
│   ├── backup.sh                 # Backup/restore
│   └── validation.sh             # Validation functions
├── templates/
│   ├── docker-compose.template   # Docker compose template
│   └── nginx.template            # Nginx config template
├── hooks/
│   ├── pre-deploy.sh            # Pre-deployment hooks
│   └── post-deploy.sh           # Post-deployment hooks
└── README.md                    # This file
```

### Generated Configuration Structure

```
config/
├── environments/
│   ├── dev/.env
│   ├── staging/.env
│   └── prod/.env
├── docker/
│   ├── dev/docker-compose.yml
│   ├── staging/docker-compose.yml
│   └── prod/docker-compose.yml
└── nginx/
    ├── dev/
    ├── staging/
    └── prod/
```

## 🌍 Environments

### Development (dev)
- **Purpose**: Local development
- **Database**: Local PostgreSQL on port 5433
- **Frontend URLs**: localhost:7601, localhost:7602
- **API URL**: localhost:7600

### Staging (staging)
- **Purpose**: Pre-production testing
- **Database**: Dedicated staging database
- **Frontend URLs**: staging.logen.locod-ai.com
- **API URL**: staging-api.logen.locod-ai.com

### Production (prod)
- **Purpose**: Live production system
- **Database**: Production PostgreSQL
- **Frontend URLs**: logen.locod-ai.com, admin.logen.locod-ai.com
- **API URL**: admin.logen.locod-ai.com/api
- **SSL**: Required with Let's Encrypt certificates

## 🔧 Service Details

### Backend (NestJS)
- **Port**: 7600
- **Container**: `logen-backend-{env}`
- **Image**: `logen-backend:{env}`
- **Health Check**: `/api/health`

### Admin Frontend (Next.js)
- **Port**: 7602
- **Container**: `logen-admin-frontend-{env}`
- **Image**: `logen-admin-frontend:{env}`
- **Purpose**: Administrative interface

### Customer Frontend (Next.js)
- **Port**: 7601
- **Container**: `logen-customer-frontend-{env}`
- **Image**: `logen-customer-frontend:{env}`
- **Purpose**: Customer portal

### PostgreSQL Database
- **Port**: 5433 (main), 7633 (prod)
- **Container**: `logen-postgres-{env}`
- **Volume**: `logen-postgres-{env}-data`
- **Health Check**: `pg_isready`

### Redis Cache
- **Port**: 7679
- **Container**: `logen-redis-{env}`
- **Volume**: `logen-redis-{env}-data`
- **Health Check**: `redis-cli ping`

## 🔍 Health Monitoring

The health check system monitors:

- **System Resources**: Disk space, memory, CPU load
- **Container Health**: Docker container status and health checks
- **Database Connectivity**: PostgreSQL connection and query performance
- **Cache Performance**: Redis connectivity and memory usage
- **API Endpoints**: Backend API response times and status
- **Frontend Accessibility**: Frontend loading and response
- **Network Connectivity**: DNS resolution and internet access
- **SSL Certificates**: Certificate validity and expiration (prod only)

### Health Check Example

```bash
./scripts/deploy/logen-manager.sh health prod
```

Output includes:
- System resource utilization
- Service health status
- Database connection status
- API response times
- SSL certificate validity
- Overall system health score

## 💾 Backup & Restore

### Automated Backups

```bash
# Create full environment backup
./scripts/deploy/logen-manager.sh backup prod
```

Backup includes:
- Complete database dump (SQL)
- Redis data snapshot
- Configuration files
- Container configurations
- SSL certificates
- Environment variables (sanitized)

### Backup Structure

```
backups/prod/
├── logen-prod-backup-20250822-120000.tar.gz
├── logen-prod-backup-20250821-120000.tar.gz
└── ...
```

Each backup contains:
- `database-dump.sql` - Full database backup
- `redis-dump.rdb` - Redis data
- `configurations/` - All config files
- `containers/` - Container configs and logs
- `MANIFEST.txt` - Backup information

### Restore Process

```bash
# Restore from backup
./scripts/deploy/logen-manager.sh restore prod /path/to/backup.tar.gz
```

Restore process:
1. Validates backup integrity
2. Stops running services
3. Restores database and Redis
4. Restores configurations
5. Restarts services
6. Validates restoration

## 🔧 Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check what's using a port
netstat -tulnp | grep :7600

# Clean up old containers
./scripts/deploy/logen-manager.sh cleanup prod
```

#### Service Won't Start
```bash
# Check service logs
./scripts/deploy/logen-manager.sh logs backend prod

# Rebuild service
./scripts/deploy/logen-manager.sh rebuild backend prod
```

#### Database Connection Issues
```bash
# Validate configuration
./scripts/deploy/logen-manager.sh validate prod

# Check database logs
./scripts/deploy/logen-manager.sh logs postgres prod
```

#### SSL Certificate Problems
```bash
# Check certificate status
openssl x509 -in /etc/letsencrypt/live/admin.logen.locod-ai.com/fullchain.pem -text -noout

# Renew certificates
sudo certbot renew
```

### Debug Mode

For detailed debugging information:
```bash
# Enable debug output
export DEBUG=1
./scripts/deploy/logen-manager.sh deploy prod
```

### Log Locations

- **Script Logs**: `/var/apps/logen/logs/logen-manager.log`
- **Service Logs**: `docker logs <container-name>`
- **Environment Logs**: `/var/apps/logen/logs/{env}/`

## 🔒 Security Considerations

### Production Security
- SSL certificates automatically managed
- Security headers configured in nginx
- Database connections encrypted
- Environment variables properly isolated
- Container security best practices

### Access Control
- Admin portal requires authentication
- Database access restricted to containers
- Redis access limited to backend services
- Production environment isolated

## 📊 Monitoring Integration

### Built-in Monitoring
- Health check endpoints
- Resource utilization tracking  
- Service dependency monitoring
- Performance metrics collection

### External Monitoring
The system provides endpoints for integration with:
- Prometheus metrics
- Grafana dashboards
- AlertManager notifications
- Log aggregation systems

## 🔄 CI/CD Integration

### GitHub Actions Integration
```yaml
# Example workflow step
- name: Deploy to Production
  run: |
    ./scripts/deploy/logen-manager.sh validate prod
    ./scripts/deploy/logen-manager.sh deploy prod
    ./scripts/deploy/logen-manager.sh health prod
```

### Deployment Hooks
- **Pre-deployment**: Validation, backup creation
- **Post-deployment**: Health checks, notifications

## 📝 Best Practices

### Development Workflow
1. Work in `dev` environment
2. Test changes locally
3. Deploy to `staging` for integration testing
4. Deploy to `prod` after approval

### Deployment Process
1. Always validate before deployment
2. Create backups before major changes
3. Monitor health after deployment
4. Keep deployment logs for audit

### Maintenance Schedule
- **Daily**: Health checks
- **Weekly**: Backup verification
- **Monthly**: Cleanup unused resources
- **Quarterly**: SSL certificate review

## 🆘 Emergency Procedures

### System Recovery
```bash
# Emergency stop all services
docker stop $(docker ps -q --filter "name=logen-*-prod")

# Restore from latest backup
./scripts/deploy/logen-manager.sh restore prod $(ls -t backups/prod/*.tar.gz | head -1)

# Emergency health check
./scripts/deploy/logen-manager.sh health prod
```

### Rollback Procedure
```bash
# If available, rollback to previous version
./scripts/deploy/logen-manager.sh rollback prod v1.0.0

# Otherwise, restore from backup
./scripts/deploy/logen-manager.sh restore prod /path/to/stable/backup.tar.gz
```

## 📞 Support

For issues or questions:
1. Check this README
2. Review script logs: `tail -f logs/logen-manager.log`
3. Run validation: `./scripts/deploy/logen-manager.sh validate <env>`
4. Check service status: `./scripts/deploy/logen-manager.sh status <env>`

---

**LOGEN Deployment Manager v1.0.0**  
*Single entry point for all LOGEN deployment operations*