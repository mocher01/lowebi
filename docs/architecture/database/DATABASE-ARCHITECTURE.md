# 🗄️ Multi-Tenant Database Architecture v1.1.1.9.2.18

## Overview

The Multi-Tenant Database Layer replaces file-based site configurations with a scalable SQLite database, providing the foundation for true SaaS architecture with customer isolation, resource quotas, and advanced management features.

## 🏗️ Architecture

### Database Schema

```
customers (Multi-tenant foundation)
├── id (Primary Key)
├── email, name, company_name
├── plan_type (starter, pro, enterprise)
├── Resource quotas (max_sites, max_storage_mb, max_bandwidth_gb)
└── Billing metadata

sites (Core site configurations)
├── id, customer_id (Foreign Key)
├── name, domain, status, port
├── config (JSON site configuration)
├── Deployment info (deployed_at, build_status, logs)
└── Resource usage tracking

site_deployments (Deployment history)
├── Deployment tracking and logs
├── Version history
└── Rollback capabilities

site_backups (Backup system)
├── Configuration snapshots
├── Automated and manual backups
└── Point-in-time recovery

api_keys (Customer API access)
├── Secure API key management
├── Granular permissions
└── Usage tracking

customer_sessions (Web portal sessions)
├── Secure session management
├── Activity tracking
└── Multi-device support
```

## 🚀 Key Features

### 1. Multi-Tenant Isolation
- **Customer Separation**: Each customer's data is completely isolated
- **Resource Quotas**: Configurable limits per customer plan
- **Security**: Row-level security prevents cross-customer data access

### 2. Migration System
- **Seamless Migration**: Automatic migration from file-based configs
- **Backward Compatibility**: Maintains existing file structure during transition
- **Zero Downtime**: Migration can run while system is active

### 3. Backup & Recovery
- **Automated Backups**: Pre-deployment configuration snapshots
- **Manual Backups**: Customer-initiated backup creation
- **Point-in-Time Recovery**: Restore to any previous configuration
- **Rollback System**: One-click rollback to previous versions

### 4. Resource Management
- **Usage Tracking**: Monitor storage, bandwidth, API calls
- **Quota Enforcement**: Prevent customers from exceeding limits
- **Billing Integration**: Track usage for billing purposes

## 📚 Usage Guide

### Database Operations

```bash
# Initialize database and create schema
npm run db:init
# or
node database/cli.js init

# Migrate from file-based configs
npm run db:migrate
# or
node database/cli.js migrate

# Check database status
node database/cli.js status

# Create backup
npm run db:backup
# or
node database/cli.js backup

# Run tests
node database/cli.js test
```

### Customer Management

```bash
# Create a new customer
node database/cli.js create-customer john@example.com "John Doe" "Acme Corp"

# List all customers
node database/cli.js list-customers

# List sites for a customer
node database/cli.js list-sites customer-123
```

### API Usage

#### Customer Operations
```javascript
// Create customer
POST /api/customers
{
  "email": "john@example.com",
  "name": "John Doe",
  "company_name": "Acme Corp",
  "plan_type": "pro"
}

// Get customer info
GET /api/customers/{customerId}

// Update customer
PUT /api/customers/{customerId}
{
  "plan_type": "enterprise",
  "max_sites": 20
}
```

#### Site Operations
```javascript
// Create site
POST /api/sites/create
{
  "customerId": "customer-123",
  "siteData": {
    "name": "My Website",
    "businessType": "translation",
    "domain": "mysite.com"
  }
}

// Get customer sites
GET /api/customers/{customerId}/sites

// Deploy site
POST /api/sites/{customerId}/{siteId}/deploy
{
  "port": 3005
}

// Create backup
POST /api/sites/{customerId}/{siteId}/backup
{
  "name": "pre-update-backup"
}

// Restore from backup
POST /api/sites/{customerId}/{siteId}/restore/{backupId}
```

#### Dashboard & Analytics
```javascript
// Customer dashboard
GET /api/customer/{customerId}/dashboard

// Admin statistics
GET /api/admin/stats

// All customers (admin)
GET /api/admin/customers
```

## 🔧 Development

### Database Manager

```javascript
const { DatabaseManager } = require('./database/database-manager');

const db = new DatabaseManager();
await db.initialize();

// Create customer
const customer = await db.createCustomer({
  email: 'test@example.com',
  name: 'Test Customer',
  plan_type: 'starter'
});

// Create site
const site = await db.createSite(customer.id, {
  name: 'Test Site',
  config: { /* site configuration */ }
});

// Create backup
const backupId = await db.createSiteBackup(site.id, 'manual-backup');
```

### Portal Integration

```javascript
const { CustomerPortalDB } = require('./api/customer-portal-db');

// Start database-powered portal
const portal = new CustomerPortalDB();
await portal.start();
```

## 🎯 Migration Path

### From File-Based to Database

1. **Phase 1**: Initialize database alongside existing files
   ```bash
   node database/cli.js init
   ```

2. **Phase 2**: Migrate existing configurations
   ```bash
   node database/cli.js migrate
   ```

3. **Phase 3**: Run database-powered portal
   ```bash
   ./scripts/setup/start-portal-db.sh
   ```

4. **Phase 4**: Verify migration success
   ```bash
   node database/cli.js status
   ```

### Backward Compatibility

- **Config Files**: Database system maintains config files for existing tools
- **Init.sh Integration**: Deployment scripts work with both systems
- **Gradual Migration**: Can run file and database systems simultaneously

## 📊 Performance

### Optimization Features
- **Connection Pooling**: Efficient database connection management
- **Indexed Queries**: Optimized database indexes for common operations
- **Caching**: In-memory caching for frequently accessed data
- **Batch Operations**: Efficient bulk operations

### Scalability
- **SQLite Limits**: Handles 140TB databases, millions of rows
- **Concurrent Access**: Multiple read/write operations
- **Future Migration**: Easy migration to PostgreSQL for larger scale

## 🔒 Security

### Data Protection
- **Tenant Isolation**: Customer data completely separated
- **Foreign Key Constraints**: Data integrity enforcement
- **Input Validation**: SQL injection prevention
- **Secure Sessions**: Encrypted session management

### Access Control
- **API Keys**: Granular permission system
- **Session Management**: Secure web portal authentication
- **Audit Logging**: Track all data modifications

## 🚀 Deployment

### Production Setup

```bash
# 1. Install dependencies
npm install

# 2. Initialize database
npm run db:init

# 3. Migrate existing data
npm run db:migrate

# 4. Start database portal
./scripts/setup/start-portal-db.sh
```

### Environment Variables

```bash
# Database configuration
DB_PATH=./database/website-generator.db
DB_BACKUP_DIR=./database/backups

# Portal configuration
PORTAL_PORT=3080
SESSION_SECRET=your-session-secret
```

## 🔍 Monitoring

### Health Checks
- **Database Health**: `/api/health` endpoint
- **Connection Status**: Real-time connection monitoring
- **Performance Metrics**: Query performance tracking

### Logging
- **Operation Logs**: All database operations logged
- **Error Tracking**: Detailed error information
- **Usage Analytics**: Customer usage patterns

## 🛠️ Troubleshooting

### Common Issues

**Database Lock Errors**
```bash
# Check for long-running transactions
node database/cli.js status

# Restart portal if needed
pkill -f customer-portal-db
./scripts/setup/start-portal-db.sh
```

**Migration Failures**
```bash
# Check migration logs
node database/cli.js migrate 2>&1 | tee migration.log

# Manual cleanup if needed
rm database/website-generator.db
node database/cli.js init
node database/cli.js migrate
```

**Performance Issues**
```bash
# Analyze database
sqlite3 database/website-generator.db "ANALYZE;"

# Check indexes
sqlite3 database/website-generator.db ".schema"
```

## 📈 Future Enhancements

### Planned Features
- **PostgreSQL Migration**: For enterprise scale
- **Read Replicas**: Enhanced performance
- **Automated Backups**: Scheduled backup system
- **Advanced Analytics**: Customer usage insights
- **Multi-Region Support**: Global deployment capabilities

---

**🎉 Multi-Tenant Database Layer v1.1.1.9.2.18 - Scalable SaaS Foundation Complete!**