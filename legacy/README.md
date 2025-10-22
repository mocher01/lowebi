# LOGEN V1 - Legacy Website Generation System

This directory contains the **V1 website generation system** extracted from the `backup-issue-111.1` branch.

## 📁 Directory Structure

```
legacy/
├── v1-api/          # V1 Customer Portal API (Express.js)
│   ├── admin/       # Admin API endpoints
│   ├── portal-ui/   # Portal UI files
│   └── customer-portal-db.js
│
├── v1-data/         # V1 Data Storage
│   ├── generated-sites/    # Generated websites (qalyarab, plumber, etc.)
│   ├── site-templates/     # Site-specific template configurations
│   ├── templates/          # Base React + Vite template
│   └── legacy-databases/   # Legacy database files
│
└── v1-tools/        # V1 Generation & Deployment Tools
    └── scripts/
        └── legacy/
            └── core/
                ├── generate-site.sh      # Main site generation script
                ├── deploy-to-nginx.sh    # Deployment to nginx
                └── ...
```

## 🔧 V1 Generation Process

### How V1 Generates Websites:

1. **Configuration**: Each site has a config in `v1-data/site-templates/<site-name>/site-config.json`

2. **Template Injection**:
   ```bash
   # Script: v1-data/templates/scripts/inject-config.js
   node inject-config.js <site-name>
   # Injects config into React template, replaces placeholders
   ```

3. **Build**:
   ```bash
   # Script: v1-tools/scripts/legacy/core/generate-site.sh
   ./generate-site.sh <site-name> --build --docker
   # Builds React app with Vite, creates Docker container
   ```

4. **Deploy**:
   ```bash
   # Script: v1-tools/scripts/legacy/core/deploy-to-nginx.sh
   # Deploys Docker container with nginx, assigns port & subdomain
   ```

5. **Result**: Live website at `https://<site-name>.logen.locod-ai.com`

### Example Generated Sites:

- `qalyarab-3005` - Restaurant site on port 3005
- `qalyjap-3006` - Japanese restaurant on port 3006
- `plumber` - Plumbing business site
- `testco` - Test company site

Each generated site in `v1-data/generated-sites/` contains:
- Full React source code (`src/`)
- Build configuration (`vite.config.js`, `package.json`)
- Docker configuration (`Dockerfile`)
- Public assets (`public/assets/`)
- Built output (`dist/` - ready for deployment)

## 🔄 V1 vs V2 Integration

### V1 System (This folder):
- **Purpose**: Generate static React websites from templates
- **Technology**: React + Vite + Tailwind + Docker + nginx
- **Generation**: Template-based with config injection
- **Deployment**: Docker containers with unique ports

### V2 System (Main codebase):
- **Purpose**: Multi-tenant SaaS with wizard, AI, admin dashboard
- **Technology**: Next.js + NestJS + PostgreSQL
- **Data Storage**: `wizard_sessions` → `customer_sites` tables
- **Integration Point**: V2 should call V1 generation scripts after wizard completion

## 🎯 Integration Strategy for Step 6

When implementing **Step 6 (Advanced Features)** OAuth2 backend:

1. **Wizard Phase** (V2):
   - Store OAuth2 config in `wizard_sessions.wizardData.step6`
   - Encrypt tokens before storage

2. **Generation Phase** (V1):
   - Transform `step6` → proper `site-config.json` structure
   - Include email/features config for template injection
   - Call V1 `generate-site.sh` with transformed config

3. **Deployment Phase** (V1):
   - Generated site includes email handling based on Step 6 choices
   - Features (N8N, Analytics, reCAPTCHA) configured in React app

4. **Post-Deployment** (V2):
   - Store final config in `customer_sites.siteConfig`
   - Manage via V2 `CustomerSitesService`

## 📝 Key Files to Study

### Generation:
- `v1-tools/scripts/legacy/core/generate-site.sh` - Main generation script
- `v1-data/templates/scripts/inject-config.js` - Config injection logic
- `v1-data/templates/src/config/` - Template config structure

### Examples:
- `v1-data/generated-sites/qalyarab-3005/` - Complete generated site example
- `v1-data/site-templates/qalyarab/site-config.json` - Example configuration

### Deployment:
- `v1-tools/scripts/legacy/core/deploy-to-nginx.sh` - Deployment script
- `v1-data/generated-sites/*/Dockerfile` - Docker configuration examples

## ⚠️ Status

This is **legacy code** preserved for reference and integration purposes.

- ✅ **Working**: V1 generation system is proven and operational
- 🔄 **Integration Needed**: Connect V2 wizard completion → V1 generation
- 🎯 **Goal**: Use V1 generation engine within V2 multi-tenant architecture

## 📚 Next Steps

1. Study V1 generation process to understand template injection
2. Design transformation layer: V2 wizard data → V1 config format
3. Implement Step 6 backend with proper data transformation
4. Create service to call V1 generation scripts from V2 backend
5. Test end-to-end: V2 wizard → V1 generation → deployed site

---

**Date Preserved**: October 2025
**Source Branch**: `backup-issue-111.1`
**Reason**: V1 code was missing from main branch, needed for V2 integration
