# Repository Restructure Plan - Website Generator v2

## 🎯 OBJECTIVE
Transform the current disorganized repository into a clean, maintainable, and professional structure following industry best practices.

## 📊 CURRENT STATE ANALYSIS

### Issues Identified:
1. **Documentation Scattered**: 15+ markdown files across different directories
2. **Inconsistent Naming**: Mixed camelCase, kebab-case, snake_case conventions
3. **Legacy v1 Code**: Root directory contains v1 portal alongside v2
4. **Test Disorganization**: Tests scattered across multiple directories
5. **Configuration Chaos**: Config files in multiple locations
6. **Build Artifacts**: Generated files tracked in git
7. **Duplicate Systems**: Multiple admin interfaces

## 🏗️ PROPOSED OPTIMAL STRUCTURE

```
website-generator/
├── 📁 docs/                           # Centralized documentation
│   ├── 📁 api/                        # API documentation
│   ├── 📁 architecture/               # System architecture docs
│   ├── 📁 deployment/                 # Deployment guides
│   ├── 📁 development/                # Development guides
│   ├── 📁 user-guides/                # User documentation
│   ├── CHANGELOG.md                   # Version history
│   ├── CONTRIBUTING.md                # Development guidelines
│   └── README.md                      # Main project readme
│
├── 📁 apps/                           # Application code
│   ├── 📁 frontend/                   # Next.js customer portal
│   │   ├── 📁 src/
│   │   │   ├── 📁 app/                # Next.js app router
│   │   │   ├── 📁 components/         # Reusable components
│   │   │   ├── 📁 lib/               # Utilities and helpers
│   │   │   ├── 📁 services/          # API services
│   │   │   ├── 📁 store/             # State management
│   │   │   └── 📁 types/             # TypeScript types
│   │   ├── 📁 public/                # Static assets
│   │   ├── 📁 __tests__/             # Test files
│   │   ├── package.json
│   │   └── next.config.ts
│   │
│   ├── 📁 admin-frontend/             # Admin dashboard (separate app)
│   │   ├── 📁 src/
│   │   ├── 📁 public/
│   │   ├── 📁 __tests__/
│   │   └── package.json
│   │
│   └── 📁 backend/                    # NestJS API server
│       ├── 📁 src/
│       │   ├── 📁 admin/              # Admin modules
│       │   ├── 📁 auth/               # Authentication
│       │   ├── 📁 customer/           # Customer modules
│       │   ├── 📁 database/           # Database config
│       │   └── 📁 security/           # Security modules
│       ├── 📁 test/                   # E2E tests
│       ├── 📁 migrations/             # Database migrations
│       └── package.json
│
├── 📁 packages/                       # Shared packages/libraries
│   ├── 📁 shared-types/               # Shared TypeScript types
│   ├── 📁 ui-components/              # Shared UI components
│   └── 📁 utils/                      # Shared utilities
│
├── 📁 tools/                          # Development tools
│   ├── 📁 cli/                        # Command line tools
│   ├── 📁 scripts/                    # Build/deployment scripts
│   └── 📁 generators/                 # Code generators
│
├── 📁 config/                         # Configuration files
│   ├── 📁 docker/                     # Docker configurations
│   ├── 📁 nginx/                      # Nginx configurations
│   ├── 📁 database/                   # Database configurations
│   └── 📁 monitoring/                 # Monitoring configs
│
├── 📁 data/                           # Data and assets
│   ├── 📁 site-templates/             # Website templates
│   ├── 📁 generated-sites/            # Generated customer sites
│   └── 📁 migrations/                 # Data migration scripts
│
├── 📁 tests/                          # Integration tests
│   ├── 📁 e2e/                        # End-to-end tests
│   ├── 📁 integration/                # Integration tests
│   └── 📁 performance/                # Performance tests
│
├── 📁 infrastructure/                 # Infrastructure as Code
│   ├── 📁 terraform/                  # Terraform files
│   ├── 📁 kubernetes/                 # K8s manifests
│   └── 📁 monitoring/                 # Monitoring setup
│
├── .gitignore                         # Git ignore rules
├── docker-compose.yml                 # Main docker compose
├── package.json                       # Root package.json
├── README.md                          # Main readme
└── tsconfig.json                      # Root TypeScript config
```

## 🗂️ FILE MIGRATION PLAN

### Phase 1: Documentation Consolidation
1. **Create `/docs/` structure**
2. **Move all markdown files** to appropriate subdirectories
3. **Remove duplicate documentation**
4. **Update internal links**

### Phase 2: Application Restructure
1. **Rename `/v2/frontend/` → `/apps/frontend/`**
2. **Move `/v2/admin-frontend/` → `/apps/admin-frontend/`**
3. **Rename `/v2/backend/` → `/apps/backend/`**
4. **Create `/packages/` for shared code**

### Phase 3: Configuration Organization
1. **Move all Docker files** to `/config/docker/`
2. **Organize environment files** in `/config/database/`
3. **Consolidate script files** in `/tools/scripts/`

### Phase 4: Data and Assets
1. **Move `/configs/` → `/data/site-templates/`**
2. **Keep `/generated-sites/` → `/data/generated-sites/`**
3. **Organize database files** properly

### Phase 5: Testing Consolidation
1. **Move integration tests** to `/tests/integration/`
2. **Organize e2e tests** in `/tests/e2e/`
3. **Keep unit tests** with their respective applications

## 📋 DETAILED MIGRATION STEPS

### Step 1: Create New Directory Structure
```bash
mkdir -p docs/{api,architecture,deployment,development,user-guides}
mkdir -p apps/{frontend,admin-frontend,backend}
mkdir -p packages/{shared-types,ui-components,utils}
mkdir -p tools/{cli,scripts,generators}
mkdir -p config/{docker,nginx,database,monitoring}
mkdir -p data/{site-templates,generated-sites,migrations}
mkdir -p tests/{e2e,integration,performance}
mkdir -p infrastructure/{terraform,kubernetes,monitoring}
```

### Step 2: Documentation Migration
```bash
# Move all markdown files to docs/
mv v2/CHANGELOG.md docs/
mv PORTAL_V2_LAUNCH_STATUS.md docs/deployment/
mv v2/AGENT_ASSIGNMENTS.md docs/development/
# ... (continue for all markdown files)
```

### Step 3: Application Code Migration
```bash
# Move applications
mv v2/frontend apps/
mv v2/admin-frontend apps/
mv v2/backend apps/

# Update package.json scripts
# Update import paths
# Update configuration files
```

### Step 4: Configuration Migration
```bash
# Move Docker files
mv v2/docker/* config/docker/
mv Dockerfile* config/docker/

# Move scripts
mv scripts/* tools/scripts/
mv v2/scripts/* tools/scripts/
```

### Step 5: Data Migration
```bash
# Move site configurations
mv configs/* data/site-templates/
mv generated-sites/* data/generated-sites/

# Move CLI tools
mv cli/* tools/cli/
```

## 🔧 REQUIRED UPDATES AFTER MIGRATION

### 1. Package.json Updates
- Update all import paths
- Fix relative path references
- Update script commands

### 2. Configuration Updates
- Update Docker compose files
- Fix nginx configuration paths
- Update environment variable paths

### 3. Import Path Updates
- Update TypeScript import paths
- Fix Next.js import references
- Update NestJS module imports

### 4. CI/CD Updates
- Update GitHub Actions workflows
- Fix deployment script paths
- Update test runner configurations

## 🎯 BENEFITS OF NEW STRUCTURE

1. **Clear Separation of Concerns**: Apps, tools, docs, and config clearly separated
2. **Monorepo Best Practices**: Proper packages structure for shared code
3. **Industry Standards**: Follows Next.js, NestJS, and modern monorepo conventions
4. **Scalability**: Easy to add new applications or packages
5. **Developer Experience**: Intuitive structure for new developers
6. **CI/CD Optimization**: Better caching and build optimization
7. **Documentation**: Centralized and organized documentation

## ⚠️ RISKS AND MITIGATION

### Risks:
1. **Breaking existing deployments**
2. **Import path issues**
3. **CI/CD pipeline failures**
4. **Developer workflow disruption**

### Mitigation:
1. **Gradual migration** with feature branches
2. **Comprehensive testing** at each step
3. **Update all import paths** systematically
4. **Backup before migration**
5. **Update documentation** immediately

## 📅 IMPLEMENTATION TIMELINE

### Week 1: Documentation & Planning
- Days 1-2: Create new directory structure
- Days 3-4: Migrate documentation
- Day 5: Update documentation links

### Week 2: Application Migration
- Days 1-2: Migrate frontend applications
- Days 3-4: Migrate backend application
- Day 5: Update import paths and test

### Week 3: Configuration & Tooling
- Days 1-2: Migrate configuration files
- Days 3-4: Update scripts and tools
- Day 5: Update CI/CD pipelines

### Week 4: Testing & Validation
- Days 1-3: Comprehensive testing
- Days 4-5: Bug fixes and optimization

## ✅ SUCCESS CRITERIA

1. **All applications build successfully**
2. **All tests pass**
3. **Documentation is accessible and accurate**
4. **CI/CD pipelines work correctly**
5. **Developer workflow is improved**
6. **No functionality is lost**
7. **Performance is maintained or improved**

---

**Status**: Plan Complete - Ready for Implementation
**Next Step**: Begin Phase 1 - Documentation Consolidation