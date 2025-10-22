# Logen Development Setup Guide

This guide provides step-by-step instructions for setting up the Logen development environment from scratch.

## 🎯 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git
- PostgreSQL client (optional, for debugging)

## 🚀 Quick Setup (Automated)

For a fresh development environment:

```bash
# Clone the repository
git clone https://github.com/mocher01/logen.git
cd logen

# Use our automated setup script
./scripts/start-services.sh
```

This script will:
- Start PostgreSQL container
- Install dependencies
- Start backend and frontend services
- Run health checks
- Provide access URLs

## 🔧 Manual Setup

If you prefer to understand each step:

### 1. Environment Setup

Create environment configuration:

```bash
# Create environment files
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

Edit the environment files with these values:

**Backend (`apps/backend/.env`):**
```env
NODE_ENV=development
JWT_SECRET=logen-jwt-secret-development
DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=logen_user
DB_PASSWORD=logen_pass_2024
DB_DATABASE=logen_db
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=7600
```

**Frontend (`apps/frontend/.env.local`):**
```env
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:7600
```

### 2. Database Setup

Start PostgreSQL container:

```bash
# Using Docker Compose
docker-compose -f config/docker/docker-compose.yml up -d postgres

# Wait for PostgreSQL to be ready
docker exec logen-postgres pg_isready -U logen_user
```

### 3. Backend Setup

```bash
cd apps/backend

# Install dependencies
npm install

# Run database migrations (if any)
npm run typeorm migration:run

# Start development server
JWT_SECRET="logen-jwt-secret-development" \
DB_HOST=localhost \
DB_PORT=5433 \
DB_USERNAME=logen_user \
DB_PASSWORD=logen_pass_2024 \
DB_DATABASE=logen_db \
npm run start:dev
```

The backend will be available at: http://localhost:7600

### 4. Frontend Setup

In a new terminal:

```bash
cd apps/frontend

# Install dependencies
npm install

# Start development server
npm run dev -- --port 7601
```

The frontend will be available at: http://localhost:7601

### 5. Verify Setup

Run the health check:

```bash
./scripts/health-check.sh
```

All checks should pass ✅.

## 🌐 Access Points

After successful setup:

| Service | URL | Description |
|---------|-----|-------------|
| Customer Portal | http://localhost:7601 | Main customer interface |
| Backend API | http://localhost:7600 | REST API server |
| API Documentation | http://localhost:7600/api/docs | Swagger/OpenAPI docs |
| Health Check | http://localhost:7600/api/health | System status |
| Metrics | http://localhost:7600/api/metrics | Performance metrics |

## 🔑 Test Credentials

Create test accounts using the registration flow, or use the backend to create users programmatically.

For testing authentication:

```bash
# Create a test customer via API
curl -X POST http://localhost:7600/customer/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## 🛠️ Development Workflow

### Daily Development

1. **Start your day:**
   ```bash
   git pull origin main
   ./scripts/health-check.sh
   ```

2. **Before making changes:**
   ```bash
   git checkout -b feature/your-feature-name
   git tag "backup-$(date +%Y%m%d-%H%M%S)"
   ```

3. **After making changes:**
   ```bash
   ./scripts/health-check.sh
   ./scripts/regression-test.sh
   git add .
   git commit -m "Your descriptive message"
   ```

### Branch Management

- `main` - Production-ready code
- `golden-master-working` - Last known stable state
- `feature/*` - Feature development branches
- `hotfix/*` - Critical fixes

### Testing Your Changes

```bash
# Quick health check
./scripts/health-check.sh

# Full regression test
./scripts/regression-test.sh

# Check logs for errors
./scripts/check-logs.sh
```

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Kill processes on Logen ports
   ./scripts/stop-services.sh
   ```

2. **Database connection issues:**
   ```bash
   # Restart PostgreSQL container
   docker restart logen-postgres
   ```

3. **Module not found errors:**
   ```bash
   # Reinstall dependencies
   cd apps/backend && rm -rf node_modules && npm install
   cd ../frontend && rm -rf node_modules && npm install
   ```

### Emergency Recovery

If everything breaks:

```bash
# Nuclear option - reset to working state
git stash
git reset --hard golden-master-working
./scripts/start-services.sh
```

## 📁 Project Structure

```
logen/
├── apps/
│   ├── backend/           # NestJS API server
│   └── frontend/          # Next.js customer portal
├── scripts/               # Automation scripts
├── docs/                  # Documentation
├── config/                # Configuration files
│   └── docker/           # Docker configurations
└── .husky/               # Git hooks
```

## 🔧 Advanced Setup

### IDE Configuration

**VS Code Extensions:**
- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Docker
- GitLens

**Settings (`.vscode/settings.json`):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### Debugging Setup

**Backend debugging:**
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Backend",
  "program": "${workspaceFolder}/apps/backend/src/main.ts",
  "env": {
    "NODE_ENV": "development",
    "JWT_SECRET": "logen-jwt-secret-development"
  }
}
```

### Database Management

**Connect to PostgreSQL:**
```bash
# Using Docker
docker exec -it logen-postgres psql -U logen_user -d logen_db

# Using local client
psql -h localhost -p 5433 -U logen_user -d logen_db
```

**Backup database:**
```bash
docker exec logen-postgres pg_dump -U logen_user logen_db > backup.sql
```

**Restore database:**
```bash
docker exec -i logen-postgres psql -U logen_user -d logen_db < backup.sql
```

## ✅ Verification Checklist

After setup, verify these work:

- [ ] Backend starts without errors (port 7600)
- [ ] Frontend starts without errors (port 7601)
- [ ] PostgreSQL container is running
- [ ] Health check passes (`./scripts/health-check.sh`)
- [ ] Can register new customer
- [ ] Can login as customer
- [ ] Wizard pages load without 404 errors
- [ ] API documentation accessible
- [ ] Pre-commit hooks work (`git commit` triggers checks)

## 🎉 You're Ready!

Your Logen development environment is now set up and ready for development. 

**Next steps:**
- Read the [Common Issues Guide](common-issues.md)
- Review the [API Documentation](http://localhost:7600/api/docs)
- Check out the [Project Roadmap](../development/project/ROADMAP-v2.md)

**Need help?** Run `./scripts/check-logs.sh` and check the troubleshooting guides.