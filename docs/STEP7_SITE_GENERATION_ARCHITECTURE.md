# Step 7: Site Generation Architecture

**Document Version:** 1.0
**Date:** 2025-10-05
**Status:** Architecture Design

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [V1 Generator Analysis](#v1-generator-analysis)
3. [V2 Directory Structure](#v2-directory-structure)
4. [Data Transformation](#data-transformation)
5. [Generation Workflow](#generation-workflow)
6. [Template System](#template-system)
7. [N8N Integration](#n8n-integration)
8. [Deployment Process](#deployment-process)

---

## Overview

Step 7 is the final wizard step where users:
1. **Review** all their selections from Steps 0-6
2. **Edit** any section before generation
3. **Generate** their website with one click
4. **Deploy** the site to production

This document describes the complete architecture for integrating V1 generators into V2 backend.

---

## V1 Generator Analysis

### V1 Directory Structure

V1 uses **3 distinct directories**:

```
/var/apps/logen/legacy/v1-data/
│
├── templates/                    # React templates (source code)
│   └── (template-basic only)
│       ├── package.json
│       ├── vite.config.js
│       ├── src/
│       │   ├── App.jsx
│       │   ├── components/
│       │   └── config/
│       │       └── config-loader.js
│       └── public/
│           └── config.json (empty template)
│
├── site-templates/              # Config + assets per site (intermediate)
│   ├── qalyjap-3006/
│   │   ├── site-config.json    # 13KB configuration
│   │   ├── assets/
│   │   │   ├── qalyjap-logo.png
│   │   │   ├── qalyjap-hero.png
│   │   │   └── blog/
│   │   └── content/
│   │       └── blog/*.md
│   ├── kalyarab/
│   └── ...
│
└── generated-sites/            # Built sites ready for deployment
    ├── qalyjap-3006/
    │   ├── package.json        # Copied from template
    │   ├── src/                # React code
    │   ├── public/
    │   │   ├── config.json     # ← Injected from site-config.json
    │   │   └── assets/         # ← Copied from site-templates
    │   ├── dist/               # After npm run build
    │   └── Dockerfile
    └── ...
```

### V1 Key Components

1. **ConfigGenerator** (`/legacy/v1-tools/generators/config-generator.js`)
   - Transforms wizard data → site-config.json
   - Saves config + assets to `site-templates/{siteId}/`
   - Handles image encoding (base64 → PNG files)
   - Saves blog articles as markdown

2. **N8NWorkflowGenerator** (`/legacy/v1-tools/scripts/legacy/generators/n8n-workflow-generator.js`)
   - Creates contact form workflows
   - N8N instance: `https://automation.locod-ai.com`
   - Default credential: `bUu8Wj3fYXqnn2nZ` (locodai.sas@gmail.com)

3. **Template System**
   - Single template: `template-basic`
   - React + Vite + TailwindCSS
   - Loads config from `public/config.json`

---

## V2 Directory Structure

### Proposed Structure (Improved Naming)

```
/var/apps/logen-templates/
├── template-basic/              # Current React template
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── src/
│   └── public/
├── template-modern/             # Future template
└── template-minimal/            # Future template

/var/apps/logen-site-configs/
└── {siteId}/                    # Intermediate storage
    ├── site-config.json         # Full configuration (V1 format)
    ├── assets/
    │   ├── {siteId}-logo.png
    │   ├── {siteId}-hero.png
    │   ├── {siteId}-favicon.ico
    │   └── {siteId}-image-*.png
    └── content/
        └── blog/
            └── *.md

/var/apps/logen-generated-sites/
└── {siteId}/                    # Built site ready to deploy
    ├── package.json             # From template
    ├── vite.config.js
    ├── Dockerfile
    ├── src/                     # React code from template
    ├── public/
    │   ├── config.json          # ← Injected from site-config.json
    │   └── assets/              # ← Copied from site-configs
    ├── dist/                    # After npm run build
    └── docker/
        └── nginx.conf
```

### Directory Roles

| Directory | Purpose | Created When | Contains |
|-----------|---------|--------------|----------|
| **logen-templates/** | React template source code | By developer | Template React apps |
| **logen-site-configs/** | Config + assets intermediate storage | After Step 7 generation | site-config.json + images |
| **logen-generated-sites/** | Buildable site with injected config | Before deployment | Complete React app ready to build |

---

## Data Transformation

### wizardData → site-config.json Mapping

```typescript
// V2 PostgreSQL JSONB (wizardData)
{
  step0: { sessionId, email },
  step1: { businessName, businessType, slogan },
  step2: {
    services: [],
    selectedTemplate: 'template-basic'  // ← Template selection
  },
  step3: { about, contact },
  step4: { selectedFeatures: [] },
  step5: {
    images: { logo, hero, favicon, services },
    imagesDraft: { ... }
  },
  step6: {
    emailConfig: {
      scenario: 'oauth2' | 'locodai-default' | 'no-form',
      oauth: { connected, email, oauthCredentialId }
    },
    n8n: { enabled: true/false },
    analytics: { enabled: true/false },
    recaptcha: { enabled: true/false }
  }
}

// ↓ Transformation ↓

// V1 site-config.json format
{
  meta: {
    siteId: generateSiteId(step1.businessName),
    domain: `${siteId}.locod-ai.com`,
    language: 'fr',
    timezone: 'Europe/Paris'
  },
  brand: {
    name: step1.businessName,
    slogan: step1.slogan,
    logos: {
      navbar: `${siteId}-logo-clair.png`,
      footer: `${siteId}-logo-sombre.png`
    },
    favicons: {
      light: `${siteId}-favicon-clair.png`,
      dark: `${siteId}-favicon-sombre.png`
    },
    colors: step1.colors || businessTypeDefaults[step1.businessType].colors
  },
  content: {
    hero: step3.hero,
    services: step2.services,
    about: step3.about,
    testimonials: step4.testimonials,
    faq: step4.faq
  },
  contact: {
    email: step3.contact.email,
    phone: step3.contact.phone,
    address: step3.contact.address
  },
  features: {
    blog: step4.selectedFeatures.includes('blog'),
    testimonials: step4.selectedFeatures.includes('testimonials'),
    faq: step4.selectedFeatures.includes('faq'),
    newsletter: step4.selectedFeatures.includes('newsletter')
  },
  integrations: {
    n8n: {
      enabled: step6.n8n?.enabled || false,
      instance: "https://automation.locod-ai.com",
      workflows: {} // Populated during generation
    },
    analytics: {
      googleAnalytics: step6.analytics?.enabled ? 'GA4_ID' : ''
    },
    security: {
      captcha: {
        enabled: step6.recaptcha?.enabled || false,
        provider: 'recaptcha-v3',
        siteKey: ''
      }
    }
  }
}
```

### Step 6 Email Configuration Mapping

```typescript
// step6.emailConfig scenarios:

1. scenario = 'oauth2'
   → Use customer's OAuth2 credential
   → Create N8N workflow with oauthCredentialId
   → Enable all advanced features

2. scenario = 'locodai-default'
   → Use Locod.ai default credential (bUu8Wj3fYXqnn2nZ)
   → Create N8N workflow with default credential
   → Send emails to businessEmail

3. scenario = 'no-form'
   → No contact form
   → Display phone + address in contact section
   → No N8N workflow
```

---

## Generation Workflow

### Complete Process Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Step 7: User clicks "Générer mon site"                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 1. Validate wizardData (all required fields)                │
│    ✓ businessName, businessType                             │
│    ✓ At least 1 service                                     │
│    ✓ Contact information                                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Transform wizardData → site-config.json                  │
│    Service: WizardDataMapperService                         │
│    Input: wizardData (JSONB)                                │
│    Output: siteConfig (V1 format)                           │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Save Config + Assets                                     │
│    Location: /var/apps/logen-site-configs/{siteId}/        │
│    Files:                                                    │
│      - site-config.json                                     │
│      - assets/*.png (logos, hero, favicons, services)       │
│      - content/blog/*.md (if blog enabled)                  │
│    Progress: 20%                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Copy React Template                                      │
│    Source: /var/apps/logen-templates/{selectedTemplate}/   │
│    Dest: /var/apps/logen-generated-sites/{siteId}/         │
│    Template: step2.selectedTemplate || 'template-basic'     │
│    Progress: 40%                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Inject Config + Assets                                   │
│    - Copy site-config.json → public/config.json            │
│    - Copy assets/* → public/assets/                         │
│    - Copy content/blog/* → public/content/blog/             │
│    Progress: 50%                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Create N8N Workflow (if enabled)                         │
│    IF step6.n8n.enabled:                                    │
│      - Determine credential:                                │
│        • OAuth2: use oauthCredentialId                      │
│        • Locod.ai: use bUu8Wj3fYXqnn2nZ                     │
│      - Call N8NWorkflowGenerator.createContactWorkflow()   │
│      - Get webhook URL                                       │
│      - Update config.json with webhook                      │
│    Progress: 60%                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. Build React Application                                  │
│    Command: npm run build                                   │
│    Location: /var/apps/logen-generated-sites/{siteId}/     │
│    Output: dist/ directory                                  │
│    Progress: 80%                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. Docker Build & Deploy                                    │
│    - Build Docker image: logen-site-{siteId}:latest        │
│    - Run container on auto-assigned port                    │
│    - Configure Nginx reverse proxy                          │
│    - Create /var/apps/nginx-reverse/nginx/conf.d/{siteId}.conf │
│    - Reload Nginx                                            │
│    Progress: 95%                                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. Save Site Record to Database                             │
│    Table: customer_sites                                    │
│    Fields:                                                   │
│      - customer_id                                           │
│      - site_id                                               │
│      - domain: {siteId}.locod-ai.com                        │
│      - status: 'active'                                      │
│      - config: site-config.json (JSONB)                     │
│    Progress: 100%                                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. Return Success                                           │
│     {                                                        │
│       siteUrl: "https://{siteId}.locod-ai.com",             │
│       status: "deployed",                                   │
│       siteId: "{siteId}"                                    │
│     }                                                        │
└─────────────────────────────────────────────────────────────┘
```

### Progress Tracking

Generation process provides real-time progress updates via WebSocket or polling:

```typescript
interface GenerationProgress {
  taskId: string;
  progress: number;        // 0-100
  currentStep: string;     // "Validating configuration", "Building React app", etc.
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
  siteUrl?: string;        // Only when completed
}
```

---

## Template System

### Current Template: template-basic

**Technology Stack:**
- React 18
- Vite
- TailwindCSS
- React Router

**Key Features:**
- Dynamic config loading from `public/config.json`
- Adaptive logos/favicons (light/dark mode)
- Responsive design
- SEO optimized
- Blog system (markdown)
- Contact form integration

**Config Loading Mechanism:**

```javascript
// src/config/config-loader.js
export async function loadSiteConfig() {
  const response = await fetch('/config.json');
  return await response.json();
}

// Components use the config
const config = loadSiteConfig();
<h1>{config.brand.name}</h1>
```

### Future Templates (Step 2 Selection)

When implementing template selection in Step 2:

```typescript
// wizardData.step2
{
  selectedTemplate: 'template-basic' | 'template-modern' | 'template-minimal'
}

// During generation
const templatePath = `/var/apps/logen-templates/${wizardData.step2.selectedTemplate}`;
await copyTemplate(templatePath, generatedSitePath);
```

**Template Requirements:**
- Must load config from `public/config.json`
- Must follow same directory structure
- Must have `package.json`, `vite.config.js`, `Dockerfile`
- Must use TailwindCSS for consistency

---

## N8N Integration

### Workflow Creation Logic

```typescript
// When step6.n8n.enabled = true

async function createN8NWorkflow(
  siteConfig: SiteConfig,
  step6: Step6Data
): Promise<string> {

  // 1. Determine email credential
  let credentialId: string;
  let recipientEmail: string;

  if (step6.emailConfig.scenario === 'oauth2') {
    credentialId = step6.emailConfig.oauth.oauthCredentialId;
    recipientEmail = step6.emailConfig.oauth.email;
  } else if (step6.emailConfig.scenario === 'locodai-default') {
    credentialId = 'bUu8Wj3fYXqnn2nZ'; // Locod.ai default
    recipientEmail = step6.emailConfig.locodaiDefault.businessEmail;
  } else {
    throw new Error('N8N requires email configuration');
  }

  // 2. Call V1 N8NWorkflowGenerator
  const N8NWorkflowGenerator = require('/var/apps/logen/legacy/v1-tools/scripts/legacy/generators/n8n-workflow-generator.js');
  const generator = new N8NWorkflowGenerator();

  const workflow = await generator.createContactWorkflow({
    siteId: siteConfig.meta.siteId,
    siteName: siteConfig.brand.name,
    credentialId: credentialId,
    recipientEmail: recipientEmail
  });

  // 3. Return webhook URL
  // Format: https://automation.locod-ai.com/webhook/{uniqueId}
  return workflow.webhookUrl;
}
```

### N8N Workflow Structure

```json
{
  "id": "generated-workflow-id",
  "name": "Contact Form - {siteName}",
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "webhookUrl": "/webhook/{uniqueId}",
      "httpMethod": "POST"
    },
    {
      "type": "n8n-nodes-base.emailSend",
      "credentials": {
        "smtp": "{credentialId}"
      },
      "parameters": {
        "fromEmail": "{recipientEmail}",
        "toEmail": "{recipientEmail}",
        "subject": "Contact Form - {siteName}",
        "text": "Name: {{$json.name}}\nEmail: {{$json.email}}\nMessage: {{$json.message}}"
      }
    }
  ]
}
```

### Config Injection

After workflow creation, update site-config.json:

```json
{
  "integrations": {
    "n8n": {
      "enabled": true,
      "instance": "https://automation.locod-ai.com",
      "workflows": {
        "contact": {
          "webhookUrl": "https://automation.locod-ai.com/webhook/abc123xyz"
        }
      }
    }
  }
}
```

---

## Deployment Process

### Docker Container Setup

**Dockerfile** (from template):
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy built files
COPY dist/ /app/public/
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

**Build & Run:**
```bash
# Build image
docker build -t logen-site-{siteId}:latest /var/apps/logen-generated-sites/{siteId}/

# Run container
docker run -d \
  --name logen-site-{siteId} \
  -p {auto-port}:3000 \
  logen-site-{siteId}:latest
```

### Nginx Reverse Proxy

**Config file:** `/var/apps/nginx-reverse/nginx/conf.d/{siteId}.conf`

```nginx
server {
    listen 80;
    server_name {siteId}.locod-ai.com;

    location / {
        proxy_pass http://localhost:{container-port};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Reload Nginx:**
```bash
docker exec nginx-reverse nginx -s reload
```

### Port Assignment

Ports are auto-assigned sequentially:
- First site: 3001
- Second site: 3002
- Third site: 3003
- ...

**Port tracking** in database:
```sql
SELECT MAX(deployment_port) FROM customer_sites;
-- Next port = MAX + 1
```

---

## Implementation Checklist

### Backend Services (NestJS)

- [ ] **WizardDataMapperService**
  - Transform wizardData → site-config.json
  - Handle all Step 0-6 mappings
  - Validate required fields

- [ ] **ConfigStorageService**
  - Save site-config.json to `/logen-site-configs/`
  - Save images (base64 → PNG files)
  - Save blog articles (markdown)

- [ ] **TemplateService**
  - Copy template from `/logen-templates/`
  - Inject config.json + assets
  - Handle template selection

- [ ] **N8NIntegrationService**
  - Call V1 N8NWorkflowGenerator
  - Determine credential (OAuth2 vs default)
  - Update config with webhook URL

- [ ] **BuildService**
  - Run `npm install && npm run build`
  - Handle build errors
  - Monitor build progress

- [ ] **DeploymentService**
  - Build Docker image
  - Run Docker container
  - Configure Nginx reverse proxy
  - Assign port automatically

- [ ] **SiteGenerationOrchestrator**
  - Coordinate all services
  - Track progress (0-100%)
  - Handle errors gracefully
  - Update database

### Frontend Components (React/Next.js)

- [ ] **ReviewStep Component**
  - Display all wizard data
  - Edit buttons for each section
  - Navigate back to specific steps

- [ ] **GenerationButton**
  - Trigger site generation
  - Disable during generation
  - Show progress

- [ ] **ProgressModal**
  - Real-time progress display
  - Current step indicator
  - Estimated time remaining

- [ ] **SuccessModal**
  - Display site URL
  - Link to visit site
  - Link to dashboard

- [ ] **ErrorModal**
  - Display error message
  - Retry button
  - Support contact

### Database Schema

- [ ] **customer_sites table**
  ```sql
  CREATE TABLE customer_sites (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES customers(id),
    site_id VARCHAR(255) UNIQUE NOT NULL,
    domain VARCHAR(255) NOT NULL,
    deployment_port INTEGER,
    status VARCHAR(50) DEFAULT 'pending',
    config JSONB,
    wizard_session_id UUID REFERENCES wizard_sessions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );
  ```

- [ ] **generation_tasks table**
  ```sql
  CREATE TABLE generation_tasks (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    wizard_session_id UUID NOT NULL,
    site_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    current_step VARCHAR(255),
    error TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```

---

## Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| **Config validation failed** | Missing required fields | Show which fields are missing, allow edit |
| **Template not found** | Invalid selectedTemplate | Fallback to template-basic |
| **N8N workflow creation failed** | N8N instance unreachable | Queue for retry, continue without N8N |
| **Build failed** | npm dependencies error | Log error, provide manual build option |
| **Docker build failed** | Dockerfile syntax error | Use fallback Docker image |
| **Port already in use** | Port conflict | Auto-assign next available port |
| **Nginx config failed** | Invalid domain | Validate domain format before deploy |

### Retry Strategy

- **Validation errors:** Fix immediately, no retry
- **N8N errors:** Retry 3 times with 5s delay
- **Build errors:** Retry 1 time with fresh install
- **Docker errors:** Retry 2 times with cleanup
- **Nginx errors:** Retry 3 times with reload

---

## Testing Strategy

### Unit Tests

- [ ] WizardDataMapper transformation logic
- [ ] Config validation
- [ ] Image processing (base64 → PNG)
- [ ] Port assignment logic

### Integration Tests

- [ ] Full generation workflow (mock external calls)
- [ ] N8N workflow creation
- [ ] Docker build process
- [ ] Nginx configuration

### E2E Tests

- [ ] Complete wizard flow → site generation
- [ ] Generated site accessibility
- [ ] Contact form with N8N webhook
- [ ] Multiple sites deployment

---

## Performance Considerations

### Build Optimization

- **Parallel builds:** Queue system for multiple generations
- **Caching:** Cache npm dependencies per template
- **Pre-built images:** Pre-build base Docker images

### Resource Limits

- **Max concurrent builds:** 3
- **Build timeout:** 5 minutes
- **Queue size:** 10 pending generations

### Monitoring

- **Track metrics:**
  - Generation time (target: <2 minutes)
  - Success rate (target: >95%)
  - Build failures
  - Container health

---

## Future Enhancements

1. **Multiple Templates**
   - Add template-modern, template-minimal
   - Template marketplace
   - Custom template upload

2. **Advanced Features**
   - Custom domain support
   - SSL certificate automation
   - CDN integration
   - Performance optimization

3. **CI/CD Integration**
   - Git repository per site
   - Automated deployments
   - Version control

4. **Monitoring & Analytics**
   - Site uptime monitoring
   - Traffic analytics
   - Error tracking

---

## References

- **V1 ConfigGenerator:** `/legacy/v1-tools/generators/config-generator.js`
- **V1 N8N Generator:** `/legacy/v1-tools/scripts/legacy/generators/n8n-workflow-generator.js`
- **Template Base:** `/legacy/v1-data/templates/`
- **Issue #121:** Original Step 7 specification (to be replaced)

---

**Document Status:** Ready for Implementation
**Next Steps:** Create GitHub issue with detailed design
