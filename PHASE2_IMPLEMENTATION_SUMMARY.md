# PHASE 2 Implementation Summary

## Overview
Completed comprehensive fix for wizard-to-site-config transformation to properly generate sites from wizard data.

## Changes Made

### 1. wizard-data-mapper.service.ts
**File:** `apps/backend/src/customer/services/wizard-data-mapper.service.ts`

**Problem:** V1 format (flat wizard data) was detected and returned early without proper transformation, resulting in missing critical config objects.

**Solution:** Implemented comprehensive V1-to-structured transformation

#### Key Changes:

**A. Modified `transformToSiteConfig()` method (lines 19-47)**
- Changed V1 format handling to call new `transformV1ToStructured()` instead of returning early
- Added `wizardData.siteName` as additional businessName source
- Improved logging for V1 format detection

**B. Added `transformV1ToStructured()` method (lines 189-423)**
Complete transformation that creates all required config objects:

**Config Structure Generated:**
- ✅ `meta` - siteId, domain, language, timezone, template
- ✅ `deployment` - port, server
- ✅ `api` - openai key
- ✅ `brand` - name, slogan, logos (navbar, footer, default), favicons (light, dark, default), colors (primary, secondary, accent)
- ✅ `design` - pageHeaders, textColors
- ✅ `sections` - hero, services, about, testimonials, faq, cta, values, blog, courses, contact with backgrounds/textColors
- ✅ `layout` - pageHeader and section spacing/sizing
- ✅ `routing` - scrollBehavior, scrollOffset, routes config
- ✅ `navbar` - contrast, tone, background, textColor, accentColor
- ✅ `footer` - background, textColor
- ✅ `navigation` - links array, cta object
- ✅ `content` - hero, services (with slug/icon/image), images, servicesSection, servicesPage, contactPage, about, aboutCta, valuesSection, testimonials, faq, blog
- ✅ `contact` - email, phone, address, hours, social
- ✅ `features` - blog, testimonials, faq, newsletter, darkMode, adaptiveLogos, adaptiveFavicons, blogSearch
- ✅ `seo` - title, description, keywords, ogImage, analytics
- ✅ `integrations` - n8n, captcha

**Image Path Normalization:**
- Extracts filename from `/uploads/sessions/{sessionId}/filename.png?t=timestamp`
- Strips directory prefix and query parameters
- Returns clean filename: `filename.png`

**C. Added Helper Methods:**

1. **`generateSectionStyles(primaryColor, secondaryColor)`** (lines 428-462)
   - Generates consistent section styling based on brand colors
   - Creates alternating light/alternate backgrounds
   - Applies primary color to all section text

2. **`lightenColor(hex, percent)`** (lines 467-483)
   - Lightens hex color by percentage for alternate backgrounds
   - Used for subtle background variations

3. **`transformServices(services, images)`** (lines 488-504)
   - Adds missing service fields: slug, icon, image
   - Generates slug from title (URL-safe)
   - Maps service images from `images.service_N`

4. **`extractServiceImages(images)`** (lines 509-524)
   - Extracts service images into `content.images` structure
   - Converts `service_0`, `service_1` to `image-1`, `image-2`

5. **`generateSlug(text)`** (lines 529-538)
   - Creates URL-safe slug from text
   - Removes diacritics, special chars
   - Replaces spaces with hyphens

---

### 2. site-generation-orchestrator.service.ts
**File:** `apps/backend/src/customer/services/site-generation-orchestrator.service.ts`

**Problem:** No code to copy wizard session images from backend container to site-config directory.

**Solution:** Added image copying logic between config save and generation script execution

#### Key Changes:

**A. Added Image Copy Step (lines 130-136)**
```typescript
// Step 4.5: Copy wizard session images to site-config assets (35%)
await this.updateTaskProgress(taskId, 35, 'Copying images to site config...');
await this.copyWizardImagesToSiteConfig(
  session.sessionId,
  configDir,
  session.wizardData,
);
```

**B. Added `copyWizardImagesToSiteConfig()` method (lines 411-489)**

**Functionality:**
1. Creates `assets` directory in site-config
2. Locates wizard session images at `/app/public/uploads/sessions/{sessionId}/`
3. Extracts all image paths from wizardData
4. Copies each image to `/var/apps/logen/logen-site-configs/{siteId}/assets/`
5. Handles errors gracefully (logs warnings, continues generation)
6. Reports copy statistics (successful/errors)

**C. Added `extractAllImagePaths()` method (lines 494-530)**

**Supports Both Formats:**
- **V1 Format:** Reads `wizardData.images` object
- **V2 Format:** Reads step-based fields (step1.logo, step3.hero.image, step5.images, etc.)

**Filters:**
- Only includes paths starting with `/uploads/sessions/`
- Ignores empty/null paths

---

## File Changes Summary

### Modified Files:
1. `/var/apps/logen/apps/backend/src/customer/services/wizard-data-mapper.service.ts`
   - Added 360+ lines of transformation logic
   - Added 6 new helper methods
   - Fixed V1 format handling

2. `/var/apps/logen/apps/backend/src/customer/services/site-generation-orchestrator.service.ts`
   - Added 124 lines of image copying logic
   - Added 2 new methods
   - Integrated image copy into generation workflow

### Created Files:
1. `/var/apps/logen/PHASE2_MISSING_FIELDS_ANALYSIS.md` - Detailed analysis of missing fields
2. `/var/apps/logen/PHASE2_IMPLEMENTATION_SUMMARY.md` - This file

---

## Expected Behavior After Fix

### Before Fix:
```json
{
  "hero": {...},          // Flat V1 format
  "services": [...],
  "faq": [...],
  "meta": { "siteId": "..." }
  // ❌ Missing: brand, content, navigation, routing, layout, design, sections, navbar, footer, features
}
```

### After Fix:
```json
{
  "meta": { "siteId": "...", "domain": "...", ... },
  "brand": { "name": "...", "logos": {...}, "colors": {...}, ... },
  "content": {
    "hero": {...},
    "services": [{ "title": "...", "slug": "...", "image": "filename.png", ... }],
    "images": { "image-1": "filename.png", ... },
    "faq": [...],
    ...
  },
  "navigation": { "links": [...], "cta": {...} },
  "routing": { "scrollBehavior": "smooth", "routes": {...} },
  "layout": { "components": {...} },
  "design": { "pageHeaders": {...}, "textColors": {...} },
  "sections": { "hero": {...}, "services": {...}, ... },
  "navbar": { "background": "#FFF", "textColor": "#...", ... },
  "footer": { "background": "#...", "textColor": "#..." },
  "features": { "blog": true, "faq": true, ... },
  "seo": { "title": "...", "description": "...", ... },
  "integrations": { "n8n": {...}, "captcha": {...} }
}
```

---

## Testing Required

### 1. Backend Rebuild
```bash
cd /var/apps/logen
docker-compose -f docker-compose.prod.yml build backend
docker-compose -f docker-compose.prod.yml up -d backend
```

### 2. Test Site Generation
```bash
# Using existing cycle17 wizard session
curl -X POST http://localhost:4000/api/customer/sites/generate \
  -H "Authorization: Bearer {customer-token}" \
  -H "Content-Type: application/json" \
  -d '{"wizardSessionId": "f81ebfbf-85a8-42be-b918-09e7679178ba"}'

# Monitor generation progress
curl http://localhost:4000/api/customer/sites/generate/{taskId}
```

### 3. Verify Results
```bash
# Check generated site-config.json structure
cat /var/apps/logen/logen-site-configs/cycle17-step7-1759748351651/site-config.json | jq 'keys'

# Check copied images
ls -lh /var/apps/logen/logen-site-configs/cycle17-step7-1759748351651/assets/

# Check site accessibility
curl http://162.55.213.90:{port}/
```

### 4. End-to-End Wizard Test
1. Complete full wizard flow (Steps 0-6)
2. Upload images in Step 5
3. Generate site in Step 7
4. Verify site displays all content and images correctly

---

## Success Criteria

- [ ] Wizard config transformed to proper structure with all required objects
- [ ] Image paths normalized (no /uploads/sessions/ prefix or ?t= query)
- [ ] Images copied from session to site-config assets directory
- [ ] Generated site includes all content (hero, services, faq, testimonials, about)
- [ ] All images display correctly (logos, favicons, hero, service images)
- [ ] Site accessible on public IP address
- [ ] No missing fields or placeholder errors in browser console

---

## Related Issues

- Issue #137 - Step 7: Review & Site Generation
- PHASE 1: V2 folder structure and qalyjap-3006 generation (completed)
- PHASE 2: Wizard-to-site-config transformation (completed)

---

## Next Steps (Post-Testing)

1. If tests pass: Commit changes with comprehensive commit message
2. If tests fail: Debug specific failure points and iterate
3. Test with multiple wizard sessions (different business types)
4. Test V2 format (step-based) if any sessions exist
5. Document any additional edge cases discovered during testing
