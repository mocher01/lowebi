# Logen System Architecture - Complete Understanding

## 🏗️ GENERATOR SYSTEM

### How Site Generation Works

**Generator Script**: `/var/apps/logen/apps/site-generator/bin/generate.sh`

**Process Flow**:
```bash
generate.sh <site-name> [--build] [--docker]
```

1. **Configuration Loading**:
   - Reads: `/var/apps/logen/logen-site-configs/<site-name>/site-config.json`
   - Extracts `meta.template` field (default: "template-base")

2. **Template Selection**:
   - Template dir: `/var/apps/logen/logen-templates/<template-name>/`
   - Available templates: `template-base` and `template-basic`
   - Line 115: `TEMPLATE_DIR="/var/apps/logen/logen-templates/$TEMPLATE_NAME"`

3. **Site Generation** (Line 182):
   - Creates: `/var/apps/logen/logen-generated-sites/<site-name>/`
   - Copies: `cp -r "$TEMPLATE_DIR"/* "$OUTPUT_DIR/"`
   - **This is where template CSS is copied!**

4. **Configuration Injection**:
   - Injects site-config.json → `public/config.json`
   - Generates CSS variables (colors) → `src/styles/site-variables.css`
   - Updates package.json with site name

5. **Image Processing**:
   - Copies from: `/var/apps/logen/logen-site-configs/<site-name>/assets/`
   - Generates to: `/var/apps/logen/logen-generated-sites/<site-name>/public/assets/`

---

## 🎨 TEMPLATE SYSTEM

### Template Structure

```
/var/apps/logen/logen-templates/
├── template-base/          ← DEFAULT template (used by most sites)
│   ├── src/
│   │   ├── index.css       ← MAIN CSS FILE (THIS IS WHAT GETS COPIED!)
│   │   └── styles/
│   ├── public/
│   ├── package.json
│   └── Dockerfile
│
├── template-basic/         ← Alternative template
│   └── src/
│       └── index.css
│
└── src/                   ← NOT USED BY GENERATOR!
    └── index.css          ← This is just a source file
```

### **CRITICAL DISCOVERY**:
- ❌ `/var/apps/logen/logen-templates/src/index.css` - NOT used by generator
- ✅ `/var/apps/logen/logen-templates/template-base/src/index.css` - THIS is what gets copied!
- ✅ `/var/apps/logen/logen-templates/template-basic/src/index.css` - Alternative template

### Where CSS Updates Need To Go

**For test21 and future sites**:
1. Check `site-config.json` → `meta.template` field
2. Update CSS in: `/var/apps/logen/logen-templates/<template-name>/src/index.css`
3. Regenerate site → CSS gets copied from template

**Current Status**:
- ✅ Updated: `/var/apps/logen/logen-templates/src/index.css` (wrong location!)
- ✅ Updated: `/var/apps/logen/logen-templates/template-basic/src/index.css` (I copied it)
- ❌ NOT updated: `/var/apps/logen/logen-templates/template-base/src/index.css` (THIS IS THE ONE!)

---

## 🧪 TESTING SYSTEM

### Test Structure

**Location**: `/var/apps/logen/tests/browser-automation/tests/`

**Naming Pattern**: `cycle{number}-{description}.spec.ts`
- Example: `cycle21-color-verification.spec.ts`
- 34 total cycle tests currently

### Test Components

1. **Test File Structure**:
```typescript
import { test, expect } from '@playwright/test';

test('Cycle {N}: {Description}', async ({ page, browser }) => {
  test.setTimeout(600000); // 10 minutes

  // Test flow:
  // 1. Login (customer)
  // 2. Create new site
  // 3. Go through wizard (Steps 1-7)
  // 4. Switch to admin (for AI processing)
  // 5. Return to customer (verify content)
  // 6. Generate site
  // 7. Verify deployed site
});
```

2. **Admin Login Pattern** (from Cycle 21):
```typescript
const adminPage = await page.context().newPage();
await adminPage.goto('https://admin.logen.locod-ai.com'); // NOT /admin/login!

// Robust selector finding
const emailSelectors = [
  '#email',
  'input[type="email"]',
  'input[name="email"]',
  '[placeholder*="email"]'
];

for (const selector of emailSelectors) {
  const count = await adminPage.locator(selector).count();
  if (count > 0) {
    await adminPage.fill(selector, 'admin@example.com');
    break;
  }
}
```

3. **Test Execution**:
```bash
npx playwright test tests/cycle{N}-{name}.spec.ts --project=chromium
```

### Generated Sites Naming

Tests create sites with unique names:
- `test20-color-check` (from Cycle 21)
- `test21` (for new cycle)
- Pattern: `test{number}` or descriptive names

---

## 🔧 CONFIG SYSTEM

### Site Configuration

**Location**: `/var/apps/logen/logen-site-configs/<site-name>/`

**Structure**:
```
logen-site-configs/test21/
├── site-config.json       ← Main configuration
├── assets/                ← Images (copied to generated site)
│   ├── site-hero.png
│   ├── site-logo-clair.png
│   └── site-blog-1.png
└── content/              ← Markdown content (optional)
    └── blog/
```

### site-config.json Structure

```json
{
  "meta": {
    "siteId": "test21",
    "domain": "test21.locod-ai.com",
    "template": "template-base"    ← THIS determines which template!
  },
  "brand": {
    "name": "Café des Arts",
    "colors": {
      "primary": "#2C1810",        ← Converted to HSL
      "secondary": "#8B4513",
      "accent": "#D4AF37"
    }
  },
  // ... rest of config
}
```

---

## 🎯 THE COLOR IMPROVEMENT ISSUE

### What Happened

1. **I updated CSS in WRONG location**:
   - ✅ `/var/apps/logen/logen-templates/src/index.css` (not used!)
   - ✅ `/var/apps/logen/logen-templates/template-basic/src/index.css` (wrong template!)

2. **But test21 uses**:
   - `meta.template: "template-base"`
   - Generator copies from: `/var/apps/logen/logen-templates/template-base/src/index.css`
   - This file was NEVER updated!

3. **Result**:
   - Backend has access to updated template files (via `/var/apps/logen` mount)
   - But wrong template directory was updated
   - Generated sites still have OLD CSS

### The Fix

**Need to update**:
```bash
cp /var/apps/logen/logen-templates/src/index.css \
   /var/apps/logen/logen-templates/template-base/src/index.css
```

Then regenerate test21:
```bash
bash /var/apps/logen/apps/site-generator/bin/generate.sh test21 --build --docker
```

---

## 📊 DEPLOYMENT SYSTEM

### Generated Site Deployment

1. **Build**:
   - `npm install` - Install dependencies
   - `npm run build` - Create `dist/` folder

2. **Docker**:
   - Creates image: `<site-name>-website`
   - Based on Dockerfile in template
   - Runs nginx serving `dist/` folder

3. **Container**:
   - Name: `<site-name>-current`
   - Port: Auto-assigned (3000, 3001, etc.)
   - Check: `docker ps | grep <site-name>`

---

## ✅ CORRECT WORKFLOW FOR NEW TEST

### To Create Cycle 22 Test for test21:

1. **Fix Template** (ONE TIME):
```bash
cp /var/apps/logen/logen-templates/src/index.css \
   /var/apps/logen/logen-templates/template-base/src/index.css
```

2. **Copy Working Test**:
```bash
cp tests/cycle21-color-verification.spec.ts \
   tests/cycle22-test21-verification.spec.ts
```

3. **Edit Only**:
- Line 28: Change `const siteName = "test20-color-check"` to `"test21"`
- Line 5: Update description to "Cycle 22"
- That's it! Use ALL the working admin login code

4. **Run Test**:
```bash
npx playwright test tests/cycle22-test21-verification.spec.ts --project=chromium
```

5. **Verify**:
```bash
# Check container
docker ps | grep test21

# Check CSS in generated site
grep "UX PROFESSIONAL" /var/apps/logen/logen-generated-sites/test21/src/index.css
```

---

## 📝 KEY LEARNINGS

1. **Template System**:
   - `logen-templates/src/` is just a source folder
   - Real templates are in `logen-templates/template-base/` and `template-basic/`

2. **Config Matters**:
   - `site-config.json` → `meta.template` determines which template
   - Most sites use "template-base"

3. **Generator Copies Everything**:
   - Line 182: `cp -r "$TEMPLATE_DIR"/* "$OUTPUT_DIR/"`
   - Whatever is in template directory gets copied

4. **Test Pattern**:
   - Use existing working tests (like Cycle 21)
   - Only change site name
   - DON'T rewrite admin login code!

---

**Date**: 2025-10-09
**Status**: System fully mapped
**Next**: Fix template-base and rerun test
