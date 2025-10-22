# LOGEN Complete Architecture - V1 + V2 Integration

**Date**: October 2025
**Purpose**: Document complete data flow from wizard → generation → deployment for Step 6 implementation

---

## 🏗️ System Overview

LOGEN consists of **two integrated systems**:

1. **V2 (Current)**: Multi-tenant SaaS wizard platform
2. **V1 (Legacy)**: Website generation engine

---

## 📊 Complete Data Flow

### Phase 1: WIZARD (V2 - Frontend + Backend)

**Location**: `/var/apps/logen/apps/`

**Components**:
- **Frontend**: Next.js 15 wizard (`apps/frontend/src/components/wizard/`)
- **Backend**: NestJS API (`apps/backend/src/customer/`)
- **Database**: PostgreSQL with TypeORM

**Data Storage**:

```typescript
// TEMPORARY (during wizard)
wizard_sessions {
  id: UUID
  sessionId: string  // unique identifier
  userId: string
  siteName: string
  siteId: string
  currentStep: number  // 0-6
  status: 'active' | 'completed' | 'abandoned'

  // JSONB field - stores ALL wizard data
  wizardData: {
    // Steps 1-5: Basic info, template, images, content
    siteName, businessType, services, contact, hero, about, images, blog, etc.

    // Step 6: Advanced Features (NEW)
    step6: {
      emailConfig: {
        scenario: 'oauth2' | 'locodai-default' | 'no-form'

        // OAuth2 Gmail
        oauth: {
          connected: boolean
          email: string
          encryptedAccessToken: string
          encryptedRefreshToken: string
          expiresAt: string
          scopes: string[]
        }

        // Locod.ai Default Email
        locodaiDefault: {
          enabled: boolean
          businessEmail: string
          gdprConsent: {
            accepted: boolean
            acceptedAt: string
            ipAddress: string
            policyVersion: string
          }
        }

        // No Form (contact info only)
        noForm: {
          contactInfoOnly: {
            phone: string
            address: string
            socialLinks: string[]
          }
        }
      }

      // Feature Toggles
      n8n: { enabled: boolean }
      analytics: { enabled: boolean }
      recaptcha: { enabled: boolean }
    }
  }
}
```

**Services**:
- `WizardSessionService` - Manages wizard sessions
- `AiQueueService` - Handles AI content generation
- OAuth2 service (to implement) - Manages Google OAuth tokens

---

### Phase 2: GENERATION (V1 - Template-Based)

**Location**: `/var/apps/logen/legacy/v1-tools/`

**Process**:

```bash
# 1. Wizard completes → Transform data
wizard_sessions.wizardData → site-config.json

# 2. Generate site from template
cd /var/apps/logen/legacy/v1-tools/scripts/legacy/core
./generate-site.sh <site-name> --build --docker

# 3. What happens:
#    a) Read config: configs/<site-name>/site-config.json
#    b) Inject into template: v1-data/templates/
#    c) Replace placeholders in React components
#    d) Copy assets (logos, images)
#    e) Build with Vite (React → static HTML/CSS/JS)
#    f) Create Docker container with nginx
```

**Template Structure**:

```
v1-data/templates/
├── src/               # React components
│   ├── components/
│   ├── config/        # Injected site-config.json goes here
│   └── App.jsx
├── public/
│   └── assets/        # Site-specific images copied here
├── scripts/
│   └── inject-config.js  # Config injection logic
├── package.json
├── vite.config.js
└── Dockerfile
```

**site-config.json Format** (V1):

```json
{
  "brand": {
    "name": "Company Name",
    "slogan": "Our slogan",
    "logos": {
      "navbar": "logo.png",
      "footer": "logo-footer.png"
    },
    "favicons": {
      "light": "favicon-light.png",
      "dark": "favicon-dark.png"
    }
  },
  "meta": {
    "domain": "company.logen.com"
  },
  "seo": {
    "title": "Company - Description",
    "description": "SEO description",
    "keywords": ["keyword1", "keyword2"]
  },
  "contact": {
    "email": "contact@company.com",
    "phone": "+1234567890",
    "address": "123 Street, City"
  },
  "services": [
    {
      "title": "Service 1",
      "description": "Description",
      "features": ["feature1", "feature2"]
    }
  ],
  "features": {
    "email": {
      "provider": "oauth2-gmail",
      "enabled": true
    },
    "n8n": { "enabled": true },
    "analytics": { "enabled": true },
    "recaptcha": { "enabled": true }
  }
}
```

**Generated Output**:

```
v1-data/generated-sites/<site-name>/
├── dist/              # Built static files (ready for deployment)
├── src/               # React source
├── public/            # Assets
├── Dockerfile         # Deployment config
├── package.json
└── vite.config.js
```

---

### Phase 3: DEPLOYMENT (V1 - Docker + Nginx)

**Location**: `/var/apps/logen/legacy/v1-tools/scripts/legacy/core/`

**Process**:

```bash
# 1. Deploy site
./deploy-to-nginx.sh <site-name>

# 2. What happens:
#    a) Docker build from generated site
#    b) Run container with unique port (3005, 3006, etc.)
#    c) Configure nginx reverse proxy
#    d) Assign subdomain: <site-name>.logen.locod-ai.com
```

**Deployment Result**:
- Docker container running nginx serving static files
- Accessible at: `https://<site-name>.logen.locod-ai.com`
- Example: `https://qalyarab.logen.locod-ai.com` (port 3005)

**Examples of Live Sites**:
- `qalyarab-3005` - Restaurant on port 3005
- `qalyjap-3006` - Japanese restaurant on port 3006
- `plumber` - Plumbing business
- `testco` - Test company site

---

### Phase 4: POST-DEPLOYMENT (V2 - Management API)

**Location**: `/var/apps/logen/apps/backend/src/customer/services/`

**Data Storage** (Permanent):

```typescript
customer_sites {
  id: UUID
  customerId: string
  name: string
  subdomain: string
  domain: string
  status: 'draft' | 'building' | 'deployed' | 'error' | 'suspended'

  // JSONB - permanent configuration
  siteConfig: {
    email: {
      provider: 'oauth2-gmail' | 'locodai-default' | 'none'
      credentials: string  // ENCRYPTED tokens
      connectedEmail: string
    },
    features: {
      n8n: { enabled: boolean, webhookUrl: string }
      analytics: { enabled: boolean, trackingId: string }
      recaptcha: { enabled: boolean, siteKey: string }
    },
    branding: { ... },
    seo: { ... }
  }

  // JSONB - permanent content
  content: {
    hero: { ... },
    services: [ ... ],
    about: { ... },
    testimonials: [ ... ],
    faq: [ ... ],
    blog: { articles: [ ... ] }
  }

  deploymentUrl: string  // https://<subdomain>.logen.com
  deploymentStatus: string
  lastDeployedAt: timestamp
  currentWizardSessionId: UUID  // Link back to wizard
}
```

**Services**:
- `CustomerSitesService.updateSite()` - Update site config/content
- `CustomerSitesService.deploySite()` - Trigger redeployment
- `CustomerSitesService.deleteSite()` - Soft delete (suspend)
- `CustomerSitesService.getSiteAnalytics()` - Get analytics data

---

## 🔑 Critical Architectural Decisions

### 1. Data Transformation

**WRONG** ❌:
```typescript
// Storing wizard terminology in production
customer_sites.siteConfig = {
  step6: {
    emailConfig: { ... }
  }
}
```

**CORRECT** ✅:
```typescript
// Transform to production structure
customer_sites.siteConfig = {
  email: {
    provider: 'oauth2-gmail',
    credentials: encrypt(tokens),
    connectedEmail: 'user@gmail.com'
  },
  features: {
    n8n: { enabled: true },
    analytics: { enabled: true },
    recaptcha: { enabled: true }
  }
}
```

### 2. Security

**OAuth2 Tokens**:
- ✅ **Encrypt** before storing in `wizard_sessions.wizardData.step6.oauth.encryptedAccessToken`
- ✅ **Encrypt** before storing in `customer_sites.siteConfig.email.credentials`
- ✅ Use backend encryption service (NestJS with crypto module)
- ✅ Never send decrypted tokens to frontend

**GDPR Consent**:
- ✅ Store acceptance timestamp, IP address, policy version
- ✅ Log in audit trail
- ✅ Allow revocation via customer dashboard

### 3. Integration Points

**V2 → V1 Integration**:

```typescript
// In CustomerWizardService.completeWizard()

async completeWizard(sessionId: string) {
  // 1. Get wizard session
  const session = await this.wizardSessionRepository.findOne({ id: sessionId });

  // 2. Transform wizard data → V1 config format
  const siteConfig = this.transformToV1Config(session.wizardData);

  // 3. Write config file for V1
  fs.writeFileSync(
    `/var/apps/logen/configs/${session.siteId}/site-config.json`,
    JSON.stringify(siteConfig, null, 2)
  );

  // 4. Call V1 generation script
  await this.executeShellCommand(
    `/var/apps/logen/legacy/v1-tools/scripts/legacy/core/generate-site.sh ${session.siteId} --build --docker`
  );

  // 5. Save to customer_sites (permanent)
  const customerSite = await this.createCustomerSite({
    customerId: session.userId,
    name: session.siteName,
    siteConfig: this.transformToProductionConfig(session.wizardData),
    content: this.extractContent(session.wizardData),
    deploymentUrl: `https://${session.siteId}.logen.com`
  });

  // 6. Mark wizard complete
  session.status = 'completed';
  session.generatedSiteId = customerSite.id;
  await this.wizardSessionRepository.save(session);

  return customerSite;
}

transformToProductionConfig(wizardData) {
  return {
    email: this.transformEmailConfig(wizardData.step6?.emailConfig),
    features: {
      n8n: { enabled: wizardData.step6?.n8n?.enabled || false },
      analytics: { enabled: wizardData.step6?.analytics?.enabled || false },
      recaptcha: { enabled: wizardData.step6?.recaptcha?.enabled || false }
    },
    branding: { ... },
    seo: { ... }
  };
}
```

---

## 📐 Step 6 Implementation Plan

### Backend Architecture:

```
apps/backend/src/
├── customer/
│   ├── services/
│   │   ├── wizard-session.service.ts     # Existing - stores step6 data
│   │   ├── customer-wizard.service.ts    # Add completeWizard with V1 integration
│   │   ├── customer-sites.service.ts     # Existing - manages deployed sites
│   │   └── oauth2.service.ts             # NEW - Google OAuth2 flow
│   ├── controllers/
│   │   ├── oauth2.controller.ts          # NEW - OAuth2 endpoints
│   │   └── customer-wizard.controller.ts # Existing - add complete endpoint
│   └── dto/
│       └── oauth2.dto.ts                  # NEW - OAuth2 DTOs
├── common/
│   ├── services/
│   │   └── encryption.service.ts         # NEW - Token encryption
│   └── utils/
│       └── v1-integration.util.ts        # NEW - V1 script executor
└── config/
    └── oauth2.config.ts                  # NEW - Google OAuth2 config
```

### API Endpoints:

```typescript
// OAuth2 Flow
POST   /customer/oauth2/authorize      # Start OAuth2 flow
GET    /customer/oauth2/callback       # OAuth2 callback
POST   /customer/oauth2/revoke         # Revoke access
GET    /customer/oauth2/status         # Check connection status

// Wizard Completion
POST   /customer/wizard/:id/complete   # Complete wizard + generate site
```

### Data Flow:

```
1. User clicks "Utiliser mon Gmail" in Step 6
   ↓
2. Frontend calls POST /customer/oauth2/authorize
   ↓
3. Backend redirects to Google OAuth consent screen
   ↓
4. User approves, Google redirects to /oauth2/callback
   ↓
5. Backend exchanges code for tokens
   ↓
6. Backend encrypts tokens and stores in wizard_sessions.wizardData.step6.oauth
   ↓
7. Frontend shows "✓ Connected: user@gmail.com"
   ↓
8. User completes wizard, clicks "Générer"
   ↓
9. Backend POST /customer/wizard/:id/complete
   ↓
10. Transform wizard data → V1 config + customer_sites
   ↓
11. Execute V1 generate-site.sh
   ↓
12. Deploy Docker container
   ↓
13. Return deployment URL to user
```

---

## ✅ Next Steps

1. ✅ **DONE**: Restore V1 code to `/var/apps/logen/legacy/`
2. ✅ **DONE**: Document complete architecture
3. **TODO**: Implement OAuth2 backend service
4. **TODO**: Create V1 integration utility
5. **TODO**: Test end-to-end flow
6. **TODO**: Deploy to production

---

## 📚 Key Resources

### V1 System:
- Generation script: `/var/apps/logen/legacy/v1-tools/scripts/legacy/core/generate-site.sh`
- Template structure: `/var/apps/logen/legacy/v1-data/templates/`
- Example sites: `/var/apps/logen/legacy/v1-data/generated-sites/`

### V2 System:
- Wizard frontend: `/var/apps/logen/apps/frontend/src/components/wizard/`
- Wizard backend: `/var/apps/logen/apps/backend/src/customer/`
- Database entities: `/var/apps/logen/apps/backend/src/customer/entities/`

### Documentation:
- V1 Legacy README: `/var/apps/logen/legacy/README.md`
- This architecture doc: `/var/apps/logen/ARCHITECTURE_COMPLETE.md`

---

**Maintained by**: Claude Code
**Last Updated**: October 2025
**Version**: 2.0 (V1 + V2 Integration)
