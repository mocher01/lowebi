# File Migration Mapping - Website Generator v2

## 📋 COMPREHENSIVE FILE MIGRATION PLAN

This document provides exact source → destination mappings for every file in the repository reorganization.

## 🗂️ DOCUMENTATION MIGRATION

### Root Level Documentation → /docs/
```bash
# Main documentation
CLAUDE.md → docs/development/CLAUDE.md
README.md → docs/README.md
LICENSE → LICENSE (keep at root)

# Deployment documentation
DEPLOYMENT_COORDINATION.md → docs/deployment/DEPLOYMENT_COORDINATION.md
PORTAL_V2_LAUNCH_STATUS.md → docs/deployment/PORTAL_V2_LAUNCH_STATUS.md
```

### V2 Level Documentation → /docs/
```bash
# Agent and project management
v2/AGENT_ASSIGNMENTS.md → docs/development/AGENT_ASSIGNMENTS.md
v2/PROJECT_STATUS.md → docs/development/PROJECT_STATUS.md
v2/CHANGELOG.md → docs/CHANGELOG.md

# Testing documentation
v2/COMPREHENSIVE_TESTING_REPORT.md → docs/development/COMPREHENSIVE_TESTING_REPORT.md
v2/COMPREHENSIVE_TEST_RESULTS.md → docs/development/COMPREHENSIVE_TEST_RESULTS.md
v2/EXECUTIVE_TESTING_SUMMARY.md → docs/development/EXECUTIVE_TESTING_SUMMARY.md
v2/SAFE_TESTING.md → docs/development/SAFE_TESTING.md
v2/TEST_SUMMARY.md → docs/development/TEST_SUMMARY.md
v2/POST_DEPLOYMENT_TEST_CHECKLIST.md → docs/deployment/POST_DEPLOYMENT_TEST_CHECKLIST.md

# Deployment and infrastructure
v2/DEPLOYMENT_FIX_INSTRUCTIONS.md → docs/deployment/DEPLOYMENT_FIX_INSTRUCTIONS.md
v2/NGINX_NEXTJS_ROUTING_FIX.md → docs/deployment/NGINX_NEXTJS_ROUTING_FIX.md
v2/PRODUCTION_DEPLOYMENT.md → docs/deployment/PRODUCTION_DEPLOYMENT.md
v2/SSL_DEPLOYMENT_GUIDE.md → docs/deployment/SSL_DEPLOYMENT_GUIDE.md

# Implementation documentation
v2/BACKEND_DIAGNOSIS_REPORT.md → docs/architecture/BACKEND_DIAGNOSIS_REPORT.md
```

### Backend Documentation → /docs/
```bash
# Backend specific documentation
v2/backend/README.md → docs/api/BACKEND_README.md
v2/backend/COMPREHENSIVE_E2E_TEST_REPORT.md → docs/development/BACKEND_E2E_TEST_REPORT.md
v2/backend/CUSTOMER_API_IMPLEMENTATION_SUMMARY.md → docs/api/CUSTOMER_API_IMPLEMENTATION.md
v2/backend/ENHANCED_BACKEND_SUMMARY.md → docs/api/ENHANCED_BACKEND_SUMMARY.md
v2/backend/IMPLEMENTATION_SUMMARY.md → docs/api/IMPLEMENTATION_SUMMARY.md
v2/backend/STAFF_API_IMPLEMENTATION_SUMMARY.md → docs/api/STAFF_API_IMPLEMENTATION.md
v2/backend/WEEK_2_COMPLETION_REPORT.md → docs/development/WEEK_2_COMPLETION_REPORT.md
v2/backend/WEEK_2_VALIDATION_REPORT.md → docs/development/WEEK_2_VALIDATION_REPORT.md

# Issue tracking documentation
v2/backend/ISSUE_74_IMPLEMENTATION_SUMMARY.md → docs/development/ISSUE_74_IMPLEMENTATION.md
v2/backend/ISSUE_90_2_FINAL_QA_VALIDATION_REPORT.md → docs/development/ISSUE_90_2_QA_VALIDATION.md
v2/backend/VALIDATION_ISSUE_90_1.md → docs/development/VALIDATION_ISSUE_90_1.md
```

### Frontend Documentation → /docs/
```bash
# Frontend specific documentation
v2/frontend/README.md → docs/development/FRONTEND_README.md
v2/frontend/ADMIN_DASHBOARD_IMPLEMENTATION.md → docs/development/ADMIN_DASHBOARD_IMPLEMENTATION.md
v2/frontend/STAFF_AUTH_IMPLEMENTATION_COMPLETE.md → docs/development/STAFF_AUTH_IMPLEMENTATION.md
```

### Existing docs/ Directory → /docs/ (reorganize)
```bash
# Keep existing structure but reorganize
docs/README.md → docs/development/DOCS_README.md
docs/ASSETS_GUIDE.md → docs/user-guides/ASSETS_GUIDE.md
docs/TEMPLATE_CONFIG_COMPLETE.json → docs/api/TEMPLATE_CONFIG_COMPLETE.json

# Admin documentation
docs/admin/ → docs/user-guides/admin/

# Archive documentation
docs/archive/ → docs/archive/ (keep as is)

# Database documentation
docs/database/ → docs/architecture/database/

# Deployment documentation (merge with new)
docs/deployment/ → docs/deployment/ (merge)

# Infrastructure documentation
docs/infrastructure/ → docs/architecture/infrastructure/

# Project documentation
docs/project/ → docs/development/project/

# Technical documentation
docs/technical/ → docs/architecture/technical/

# User stories
docs/user-stories/ → docs/development/user-stories/

# User documentation
docs/user/ → docs/user-guides/

# Wizard documentation
docs/wizard/ → docs/user-guides/wizard/
```

## 🏗️ APPLICATION CODE MIGRATION

### Frontend Applications
```bash
# Main customer frontend
v2/frontend/ → apps/frontend/
# Keep internal structure intact

# Admin frontend (already exists)
v2/admin-frontend/ → apps/admin-frontend/
# Keep internal structure intact

# Backend application
v2/backend/ → apps/backend/
# Keep internal structure intact
```

## 🔧 TOOLS AND SCRIPTS MIGRATION

### CLI Tools
```bash
cli/ → tools/cli/
cli/website-cli.js → tools/cli/website-cli.js
```

### Scripts Migration
```bash
# Root scripts
scripts/ → tools/scripts/legacy/

# V2 scripts
v2/scripts/ → tools/scripts/
v2/scripts/backup-restore.sh → tools/scripts/backup-restore.sh
v2/scripts/create-deployment-package.sh → tools/scripts/create-deployment-package.sh
v2/scripts/deploy-production.sh → tools/scripts/deploy-production.sh
v2/scripts/deploy-ssl-logen.sh → tools/scripts/deploy-ssl-logen.sh
v2/scripts/fix-nginx-nextjs-routing.sh → tools/scripts/fix-nginx-nextjs-routing.sh
v2/scripts/quick-deploy-backend.sh → tools/scripts/quick-deploy-backend.sh
v2/scripts/remote-deploy-fix.sh → tools/scripts/remote-deploy-fix.sh
v2/scripts/system-monitor.sh → tools/scripts/system-monitor.sh
v2/scripts/validate-routing-fix.sh → tools/scripts/validate-routing-fix.sh
v2/scripts/validate-ssl-deployment.sh → tools/scripts/validate-ssl-deployment.sh

# Backend scripts
v2/backend/fix-deployment.sh → tools/scripts/backend/fix-deployment.sh
v2/backend/fix-passwords.js → tools/scripts/backend/fix-passwords.js
v2/backend/database-connection-diagnostic.js → tools/scripts/backend/database-connection-diagnostic.js
v2/backend/deployment-verification.js → tools/scripts/backend/deployment-verification.js
v2/backend/performance-test.js → tools/scripts/backend/performance-test.js
v2/backend/test-* → tools/scripts/backend/test-scripts/

# Frontend scripts
v2/frontend/simple-login-test.js → tools/scripts/frontend/simple-login-test.js
v2/frontend/test-auth.js → tools/scripts/frontend/test-auth.js
v2/frontend/acceptance-test-issue-73.js → tools/scripts/frontend/acceptance-test-issue-73.js
```

### Generators and Utilities
```bash
# Legacy generators
api/config-generator.js → tools/generators/config-generator.js
api/image-processor.js → tools/generators/image-processor.js

# Scripts from root
scripts/generators/ → tools/generators/
scripts/maintenance/ → tools/scripts/maintenance/
scripts/setup/ → tools/scripts/setup/
scripts/test/ → tools/scripts/test/
scripts/utils/ → tools/scripts/utils/
scripts/validation/ → tools/scripts/validation/
```

## ⚙️ CONFIGURATION MIGRATION

### Docker Configuration
```bash
# Main docker files
Dockerfile → config/docker/Dockerfile.legacy
v2/frontend/Dockerfile.prod → config/docker/frontend.Dockerfile
v2/backend/Dockerfile.dev → config/docker/backend.dev.Dockerfile
v2/backend/Dockerfile.prod → config/docker/backend.prod.Dockerfile

# Docker compose files
v2/docker/ → config/docker/
v2/docker/docker-compose.yml → config/docker/docker-compose.yml
v2/docker/docker-compose.prod.yml → config/docker/docker-compose.prod.yml
v2/docker/docker-compose.test.yml → config/docker/docker-compose.test.yml
v2/docker/docker-compose.backend-only.yml → config/docker/docker-compose.backend-only.yml
```

### Database Configuration
```bash
# Database config files
v2/backend/config/database/ → config/database/
v2/backend/config/database/development.env → config/database/development.env
v2/backend/config/database/production.env → config/database/production.env
v2/backend/config/database/staging.env → config/database/staging.env

# Database setup
v2/docker/init.sql → config/database/init.sql
```

### Nginx Configuration
```bash
# Nginx configs
v2/docker/nginx/ → config/nginx/
configs/infrastructure/nginx-webhook-config.conf → config/nginx/nginx-webhook-config.conf
```

### Monitoring Configuration
```bash
# Monitoring setup
v2/docker/monitoring/ → config/monitoring/
v2/docker/monitoring/grafana/ → config/monitoring/grafana/
v2/docker/monitoring/prometheus.yml → config/monitoring/prometheus.yml
```

## 📊 DATA AND ASSETS MIGRATION

### Site Templates and Configurations
```bash
# Site configurations
configs/ → data/site-templates/
configs/bocoud-ai/ → data/site-templates/bocoud-ai/
configs/kalyarab/ → data/site-templates/kalyarab/
configs/translatepro/ → data/site-templates/translatepro/
# ... (all other site configs)

# Remove infrastructure from configs
configs/infrastructure/ → config/nginx/ (already handled above)
configs/VERSION.txt → data/metadata/VERSION.txt
configs/VERSION_DESC.txt → data/metadata/VERSION_DESC.txt
```

### Generated Sites
```bash
# Generated sites (keep location)
generated-sites/ → data/generated-sites/
```

### Templates
```bash
# Site templates
templates/ → data/templates/
```

## 🧪 TESTING MIGRATION

### Test Files Organization
```bash
# Root tests (legacy)
tests/ → tests/legacy/

# E2E and Integration tests
v2/comprehensive-auth-testing.js → tests/integration/auth-testing.js
v2/debug-login-response.js → tests/integration/debug-login-response.js
v2/frontend-e2e-tests.js → tests/e2e/frontend-e2e-tests.js
v2/portal-v2-comprehensive-test.js → tests/e2e/portal-v2-comprehensive-test.js
v2/quick-validation-test.js → tests/integration/quick-validation-test.js

# Backend tests (keep with app)
v2/backend/test/ → apps/backend/test/ (already in place)

# Frontend tests (keep with app)
v2/frontend/src/__tests__/ → apps/frontend/src/__tests__/ (already in place)
```

### Test Data and Databases
```bash
# Test databases
v2/backend/database/development.sqlite → apps/backend/database/development.sqlite
v2/backend/database/production.sqlite → apps/backend/database/production.sqlite
```

## 🗃️ DATABASE AND LOGS MIGRATION

### Database Files
```bash
# Legacy databases
database/ → data/legacy-databases/
portal.pid → data/legacy-databases/portal.pid

# Backend databases (already in correct location)
v2/backend/database/ → apps/backend/database/ (keep)
v2/backend/backups/ → apps/backend/backups/ (keep)
```

### Logs
```bash
# Logs
logs/ → logs/ (keep at root for easier access)
v2/logs/ → logs/v2/
```

## 🔄 COVERAGE AND BUILD ARTIFACTS

### Coverage Reports (Remove from Git)
```bash
# Remove coverage from git tracking
coverage/ → .gitignore
v2/frontend/coverage/ → .gitignore
v2/backend/coverage/ → .gitignore
```

### Node Modules (Ensure in .gitignore)
```bash
# Ensure all node_modules are ignored
node_modules/ → .gitignore
api/node_modules/ → .gitignore
v2/frontend/node_modules/ → .gitignore
v2/backend/node_modules/ → .gitignore
# ... etc
```

### Build Artifacts
```bash
# Remove from git
v2/frontend/tsconfig.tsbuildinfo → .gitignore
v2/backend/dist/ → .gitignore
v2/frontend/.next/ → .gitignore
```

## 📦 PACKAGE CONFIGURATION

### Root Package Files
```bash
# Root package files (keep)
package.json → package.json (update scripts)
package-lock.json → package-lock.json

# App package files (keep in place)
v2/frontend/package.json → apps/frontend/package.json
v2/backend/package.json → apps/backend/package.json
```

### Configuration Files
```bash
# Root config files (keep)
.gitignore → .gitignore (update paths)

# TypeScript configs
tsconfig.json → tsconfig.json (update)
v2/frontend/tsconfig.json → apps/frontend/tsconfig.json
v2/backend/tsconfig.json → apps/backend/tsconfig.json

# Next.js configs
v2/frontend/next.config.ts → apps/frontend/next.config.ts
v2/frontend/next-env.d.ts → apps/frontend/next-env.d.ts

# ESLint configs
v2/frontend/eslint.config.mjs → apps/frontend/eslint.config.mjs
v2/backend/eslint.config.mjs → apps/backend/eslint.config.mjs

# Jest configs
v2/frontend/jest.config.js → apps/frontend/jest.config.js
v2/frontend/jest.setup.js → apps/frontend/jest.setup.js

# PostCSS configs
v2/frontend/postcss.config.mjs → apps/frontend/postcss.config.mjs

# NestJS configs
v2/backend/nest-cli.json → apps/backend/nest-cli.json
```

## 🚫 FILES TO DELETE

### Duplicate and Legacy Files
```bash
# Remove duplicate files
api/ (legacy v1 portal)
mcp-puppeteer/ (if not needed)
temp_output.html
portal.pid

# Remove backup files
v2/backend/src/app.module.ts.backup
v2/backend/src/app.module-backup.ts
v2/backend/src/admin/admin.module.ts.backup

# Remove test databases from git
tests/test-database.db
tests/cli-test-database.db
tests/e2e-cli-test.db
tests/wizard-test-database.db

# Remove log files from git
logs/*.log
v2/logs/*.log
```

### Build Artifacts and Generated Files
```bash
# Remove from git tracking
coverage/
v2/frontend/coverage/
v2/backend/coverage/
v2/frontend/tsconfig.tsbuildinfo
dist/
.next/
node_modules/
```

## ⚡ MIGRATION PRIORITY ORDER

1. **HIGH PRIORITY** (Break nothing):
   - Documentation migration
   - Configuration file moves
   - Script reorganization

2. **MEDIUM PRIORITY** (Requires import updates):
   - Application code migration
   - Test file reorganization

3. **LOW PRIORITY** (Cleanup):
   - Remove duplicate files
   - Update .gitignore
   - Remove build artifacts

## 🔧 POST-MIGRATION UPDATES REQUIRED

### Import Path Updates
```typescript
// Update all imports from:
import { something } from '../../../v2/backend/src/...'
// To:
import { something } from '../../../apps/backend/src/...'
```

### Package.json Script Updates
```json
{
  "scripts": {
    "dev:frontend": "cd apps/frontend && npm run dev",
    "dev:backend": "cd apps/backend && npm run start:dev",
    "build:frontend": "cd apps/frontend && npm run build",
    "build:backend": "cd apps/backend && npm run build"
  }
}
```

### Docker Compose Updates
```yaml
# Update all volume mounts and context paths
services:
  frontend:
    build:
      context: ./apps/frontend
      dockerfile: ../../config/docker/frontend.Dockerfile
```

---

**Status**: Detailed migration mapping complete
**Next Step**: Execute migration in priority order
**Files Mapped**: 500+ files organized into logical groups