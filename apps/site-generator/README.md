# 🚀 Logen Site Generator

**Version:** 2.0.0
**Migrated from:** V1 legacy tools
**Purpose:** Generate React websites from wizard configurations

---

## 📂 Directory Structure

```
apps/site-generator/
├── package.json           # Dependencies
├── bin/
│   └── generate.sh       # Main generation script
├── generators/
│   ├── config-generator.js       # Transform wizard → site-config.json
│   ├── image-controller.js       # Unified image processing
│   ├── n8n-workflow-generator.js # N8N workflow creation
│   ├── logo-processor.js         # Logo cropping/optimization
│   ├── ai-image-generator.js     # AI image generation
│   └── placeholder-generator.js  # Placeholder images
├── maintenance/
│   ├── inject-html-config.js     # HTML placeholder injection
│   ├── generate-layout-css.js    # CSS variable generation
│   ├── inject-nginx-webhook.js   # Nginx webhook config
│   └── generate-blog-index.js    # Blog index generation
└── utils/
    └── logo-config-optimizer.js  # Logo config optimization
```

---

## 🔧 Usage

### Standalone Generation

```bash
cd /var/apps/logen
bash apps/site-generator/bin/generate.sh <site-name> [options]
```

**Options:**
- `--build` - Build React application (npm run build)
- `--docker` - Build Docker image
- `--images MODE` - Image processing mode:
  - `none` - Skip image processing
  - `copy` - Copy images without processing
  - `process` - Process logos (cropping/sizing)
  - `ai` - AI image generation for missing images
  - `placeholder` - Generate placeholder images (debug)

**Examples:**
```bash
# Generate with AI images and Docker
bash apps/site-generator/bin/generate.sh my-site --build --docker --images ai

# Generate without images (use pre-uploaded)
bash apps/site-generator/bin/generate.sh my-site --build --no-images

# Quick generation for testing
bash apps/site-generator/bin/generate.sh test-site --images placeholder
```

### From Backend (NestJS)

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

// In SiteGenerationOrchestratorService
const scriptPath = '/var/apps/logen/apps/site-generator/bin/generate.sh';
const { stdout, stderr } = await execAsync(
  `bash ${scriptPath} ${siteId} --build --docker --images ai`,
  {
    cwd: '/var/apps/logen',
    timeout: 600000, // 10 minutes
    maxBuffer: 50 * 1024 * 1024 // 50MB
  }
);
```

---

## 📋 Prerequisites

### Required Directories

The script expects these directories at `/var/apps/logen/`:

```
/var/apps/logen/
├── logen-templates/       # React templates
│   └── template-basic/
├── logen-site-configs/    # Site configurations + assets
│   └── {siteId}/
│       ├── site-config.json
│       ├── assets/
│       └── content/
└── logen-generated-sites/ # Generated sites (output)
    └── {siteId}/
```

### Configuration Format

`logen-site-configs/{siteId}/site-config.json` must follow V1 format:

```json
{
  "meta": {
    "siteId": "my-site",
    "domain": "my-site.locod-ai.com",
    "language": "fr",
    "timezone": "Europe/Paris",
    "template": "template-basic"
  },
  "brand": {
    "name": "My Business",
    "slogan": "We are awesome",
    "colors": {
      "primary": "#4F46E5",
      "secondary": "#7C3AED"
    },
    "logos": {
      "navbar": "my-site-logo-clair.png",
      "footer": "my-site-logo-sombre.png"
    }
  },
  "content": {
    "hero": {
      "title": "Welcome",
      "subtitle": "Best service ever"
    },
    "services": [],
    "about": {},
    "testimonials": [],
    "faq": []
  },
  "contact": {
    "email": "contact@mysite.com",
    "phone": "+33123456789"
  },
  "integrations": {
    "n8n": {
      "enabled": true,
      "instance": "https://automation.locod-ai.com"
    }
  }
}
```

---

## 🎯 Generation Workflow

1. **Validation** (5%)
   - Verify config file exists
   - Validate JSON syntax
   - Check template availability

2. **Template Copy** (15%)
   - Copy template from `logen-templates/{templateName}/`
   - Create output directory in `logen-generated-sites/{siteId}/`

3. **Content Injection** (25%)
   - Copy `site-config.json` → `public/config.json`
   - Copy markdown content → `public/content/`
   - Copy assets → `public/assets/`

4. **CSS Generation** (35%)
   - Generate color CSS variables
   - Generate layout CSS variables
   - Inject HTML placeholders

5. **Logo Optimization** (45%)
   - Optimize logo configuration
   - Process logo images (cropping, sizing)

6. **Image Processing** (55%)
   - Generate missing images (AI or placeholder)
   - Process service images
   - Process blog images

7. **N8N Configuration** (65%)
   - Create N8N workflow (if enabled)
   - Retrieve webhook URL
   - Update config with webhook

8. **Nginx Config** (70%)
   - Generate nginx proxy config (for N8N webhook)

9. **Build React** (80%)
   - Run `npm install`
   - Run `npm run build`
   - Verify `dist/` directory created

10. **Docker Build** (95%)
    - Build Docker image: `{siteId}-website:latest`
    - Tag image

11. **Complete** (100%)
    - Output summary
    - Display image verification info

---

## 🔍 Output

After successful generation:

```
============================================
🎉 GÉNÉRATION TERMINÉE
============================================
📋 Résumé:
  • Site: my-site
  • Configuration: logen-site-configs/my-site/site-config.json
  • Output: logen-generated-sites/my-site
  • Markdown: ✅ Site-specific content copied to public/content/
  • Docker: ✅ Image created (my-site-website)
```

The generated site is ready to:
1. Run in Docker container
2. Deploy to production
3. Access via Nginx reverse proxy

---

## 🐛 Troubleshooting

### Script fails with "Template not found"

**Cause:** Template doesn't exist in `logen-templates/`

**Fix:**
```bash
# Copy template from legacy
cp -r legacy/v1-data/templates/template-basic logen-templates/
```

### Script fails with "Config file not found"

**Cause:** No `site-config.json` in `logen-site-configs/{siteId}/`

**Fix:**
```bash
# Create config directory
mkdir -p logen-site-configs/my-site

# Create site-config.json (from wizard or manually)
echo '{"meta": {...}, "brand": {...}}' > logen-site-configs/my-site/site-config.json
```

### N8N workflow creation fails

**Cause:** N8N instance unreachable or credentials invalid

**Fix:**
- Check N8N instance is running: `https://automation.locod-ai.com`
- Verify credentials in config
- Generation continues without N8N (not critical)

### Docker build fails

**Cause:** npm build errors or Dockerfile issues

**Fix:**
```bash
# Check build logs
cd logen-generated-sites/my-site
npm install
npm run build
```

---

## 📚 References

- **V1 Source:** `legacy/v1-tools/scripts/legacy/core/generate-site.sh`
- **Architecture:** `docs/STEP7_SITE_GENERATION_ARCHITECTURE.md`
- **Issue:** #137 - Step 7: Review & Site Generation

---

## 🔄 Migration Notes

This is a **direct migration** from V1 with path updates:

**Changed Paths:**
- `configs/` → `/var/apps/logen/logen-site-configs/`
- `templates/` → `/var/apps/logen/logen-templates/`
- `generated-sites/` → `/var/apps/logen/logen-generated-sites/`
- `scripts/generators/` → `apps/site-generator/generators/`
- `scripts/maintenance/` → `apps/site-generator/maintenance/`

**Unchanged:**
- Generation logic (shell script + Node.js)
- N8N workflow creation
- Image processing
- Docker build process

**Future Improvements:**
- Migrate to TypeScript (NestJS service)
- Add WebSocket for real-time progress
- Parallelize build steps
- Add retry logic for failed steps
