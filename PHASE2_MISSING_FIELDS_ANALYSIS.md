# PHASE 2: Missing Fields Analysis

## Overview
Comparison between **working qalyjap-3006** config and **wizard-generated cycle17step71759748351651** config reveals critical structural differences.

## Root Cause
- Wizard session has NO `step0` field in database
- `wizard-data-mapper.service.ts` detects this as V1 flat format
- Returns early without proper transformation (lines 22-49)
- Result: Flat structure missing essential nested objects

---

## Critical Missing Objects

### 1. ❌ `brand` Object
**Required fields:**
```json
{
  "name": "QalyJap",
  "slogan": "L'art de la calligraphie japonaise",
  "logos": {
    "navbar": "qalyjap-logo-clair.png",
    "footer": "qalyjap-logo-sombre.png",
    "default": "qalyjap-logo.png"
  },
  "favicons": {
    "light": "qalyjap-favicon-clair.png",
    "dark": "qalyjap-favicon-sombre.png",
    "default": "qalyjap-favicon.ico"
  },
  "colors": {
    "primary": "#8B4513",
    "secondary": "#D2691E",
    "accent": "#DAA520"
  }
}
```

**Wizard has:** siteName, slogan (at root), images.logo, images.logoFooter, images.faviconDark, images.faviconLight
**Needs mapping:** Extract from wizard data and restructure into brand object

---

### 2. ❌ `content` Object
**Working structure:**
```json
{
  "content": {
    "hero": { "title": "...", "subtitle": "...", "description": "...", "image": "...", "cta": {} },
    "services": [...],
    "images": { "image-1": "qalyjap-1.jpg", "image-2": "...", "image-3": "..." },
    "servicesSection": { "viewAllText": "...", "learnMoreText": "..." },
    "servicesPage": { "subtitle": "...", "ctaTitle": "...", "ctaDescription": "...", "ctaButton": "..." },
    "contactPage": { "title": "...", "description": "...", "formTitle": "...", "infoTitle": "..." },
    "about": { "title": "...", "subtitle": "...", "description": "...", "values": [...] },
    "aboutCta": { "title": "...", "description": "...", "buttonText": "..." },
    "valuesSection": { "title": "...", "description": "..." },
    "testimonials": [...],
    "faq": [...],
    "blog": { "title": "...", "description": "...", "filters": [...], "searchEnabled": true, "searchPlaceholder": "..." }
  }
}
```

**Wizard has:** hero, services, faq, testimonials, about, blog (all at root level, not inside content)
**Needs mapping:** Move these to content object and add missing sub-objects

---

### 3. ❌ `navigation` Object
**Required fields:**
```json
{
  "navigation": {
    "links": [
      { "name": "Accueil", "path": "/" },
      { "name": "Cours", "path": "/services" },
      { "name": "Blog", "path": "/blog" },
      { "name": "À propos", "path": "/about" }
    ],
    "cta": {
      "text": "Nous contacter",
      "path": "/contact"
    }
  }
}
```

**Wizard has:** Nothing
**Needs generation:** Create default navigation based on enabled features (blog, services, about, contact)

---

### 4. ❌ `routing` Object
**Required fields:**
```json
{
  "routing": {
    "scrollBehavior": "smooth",
    "scrollOffset": 80,
    "routes": {
      "/": { "scroll": "top" },
      "/services": { "scroll": "top" },
      "/service/*": { "scroll": "top" },
      "/blog": { "scroll": "top" },
      "/contact": { "scroll": "top", "anchor": "contact-form" },
      "/about": { "scroll": "top" }
    }
  }
}
```

**Wizard has:** Nothing
**Needs generation:** Create default routing based on navigation links

---

### 5. ❌ `layout` Object
**Required fields:**
```json
{
  "layout": {
    "components": {
      "pageHeader": {
        "spacing": "pt-16 pb-8 md:pt-20 md:pb-12",
        "titleSize": "text-3xl md:text-4xl lg:text-5xl",
        "subtitleSize": "text-lg md:text-xl",
        "titleMargin": "mb-4",
        "subtitleMargin": "mb-6"
      },
      "section": {
        "spacing": "py-20",
        "spacingSmall": "py-16"
      }
    }
  }
}
```

**Wizard has:** Nothing
**Needs generation:** Create default layout configuration

---

### 6. ❌ `design` Object
**Required fields:**
```json
{
  "design": {
    "pageHeaders": {
      "background": { "type": "solid", "color": "#A0522D" },
      "title": { "color": "#FFFFFF", "size": "text-3xl md:text-4xl", "weight": "font-bold", "margin": "mb-4" },
      "subtitle": { "color": "#FFFFFF", "size": "text-lg md:text-xl", "weight": "font-medium", "margin": "mb-6" }
    },
    "textColors": {
      "primary": "#3E2723",
      "secondary": "#5D4037",
      "muted": "#8D6E63"
    }
  }
}
```

**Wizard has:** Nothing (though it might have colors in images or other places)
**Needs generation:** Derive from brand.colors or create defaults

---

### 7. ❌ `sections` Object
**Required fields:**
```json
{
  "sections": {
    "hero": { "background": "#FFFFFF", "textColor": "#8B4513" },
    "services": { "background": "#FDF5E6", "textColor": "#8B4513", "cardBackground": "#FFFFFF" },
    "about": { "background": "#FFFFFF", "textColor": "#8B4513", "cardBackground": "#FDF5E6" },
    "testimonials": { "background": "#FDF5E6", "textColor": "#8B4513" },
    "faq": { "background": "#FFFFFF", "textColor": "#8B4513" },
    "cta": { "background": "#FDF5E6", "textColor": "#8B4513" },
    "values": { "background": "#FFFFFF", "textColor": "#8B4513", "cardBackground": "#FDF5E6" },
    "blog": { "background": "#FFFFFF", "titleBackground": "#A0522D", "titleTextColor": "#FFFFFF", "subtitleTextColor": "#FFFFFF", "textColor": "#8B4513" },
    "courses": { "background": "#FFFFFF", "titleBackground": "#A0522D", "titleTextColor": "#FFFFFF", "subtitleTextColor": "#FFFFFF", "textColor": "#8B4513" },
    "contact": { "background": "#FFFFFF", "titleBackground": "#A0522D", "titleTextColor": "#FFFFFF", "subtitleTextColor": "#FFFFFF", "textColor": "#8B4513" }
  }
}
```

**Wizard has:** Nothing
**Needs generation:** Create section styling based on brand.colors

---

### 8. ❌ `navbar` Object
**Required fields:**
```json
{
  "navbar": {
    "contrast": "medium",
    "tone": "elegant",
    "background": "#FAF0E6",
    "textColor": "#8B4513",
    "accentColor": "#8B4513"
  }
}
```

**Wizard has:** Nothing
**Needs generation:** Derive from brand.colors or create defaults

---

### 9. ❌ `footer` Object
**Required fields:**
```json
{
  "footer": {
    "background": "#8B4513",
    "textColor": "#F5DEB3"
  }
}
```

**Wizard has:** Nothing
**Needs generation:** Derive from brand.colors (inverted from navbar)

---

### 10. ❌ `features` Object
**Required fields:**
```json
{
  "features": {
    "blog": true,
    "testimonials": true,
    "faq": true,
    "newsletter": false,
    "darkMode": false,
    "adaptiveLogos": true,
    "adaptiveFavicons": true,
    "blogSearch": true
  }
}
```

**Wizard has:** enableBlog, enableNewsletter (at root)
**Needs mapping:** Convert to features object with defaults

---

### 11. ⚠️ `deployment` Object
**Required fields:**
```json
{
  "deployment": {
    "port": 3006,
    "server": "162.55.213.90"
  }
}
```

**Wizard has:** Nothing (generated by backend during site creation)
**Needs:** Backend must add this when creating generation task

---

### 12. ⚠️ `api` Object
**Required fields:**
```json
{
  "api": {
    "openai": "sk-proj-..."
  }
}
```

**Wizard has:** Nothing (should come from integrations in Step 5)
**Needs investigation:** Check if Step 5 OAuth2 stores API keys

---

## Structural Issues

### Issue 1: Flat vs Nested
**Wizard output (WRONG):**
```json
{
  "hero": {...},
  "services": [...],
  "faq": [...],
  "testimonials": [...]
}
```

**Should be (CORRECT):**
```json
{
  "content": {
    "hero": {...},
    "services": [...],
    "faq": [...],
    "testimonials": [...]
  }
}
```

---

### Issue 2: Image Paths
**Wizard has:**
```json
{
  "images": {
    "hero": "/uploads/sessions/f81ebfbf.../site-hero.png?t=1759748422606",
    "logo": "/uploads/sessions/f81ebfbf.../site-logo-clair.png?t=1759748417483",
    "service_0": "/uploads/sessions/f81ebfbf.../site-service-conseil-strat_gique.png?t=1759748430266"
  }
}
```

**Should be (local filenames only):**
```json
{
  "brand": {
    "logos": {
      "navbar": "site-logo-clair.png",
      "footer": "site-logo-sombre.png"
    }
  },
  "content": {
    "hero": {
      "image": "site-hero.png"
    },
    "images": {
      "image-1": "site-service-0.png",
      "image-2": "site-service-1.png"
    }
  }
}
```

**Needs:** Strip `/uploads/sessions/.../` prefix and `?t=timestamp` query string

---

### Issue 3: Services Structure
**Wizard has:**
```json
{
  "services": [
    {
      "title": "Conseil Stratégique",
      "features": ["Audit complet", "Plan d'action détaillé"],
      "description": "Accompagnement personnalisé..."
    }
  ]
}
```

**Should also have (missing fields):**
```json
{
  "content": {
    "services": [
      {
        "title": "Conseil Stratégique",
        "slug": "conseil-strategique",          // ❌ Missing
        "description": "Accompagnement...",
        "icon": "brush",                         // ❌ Missing
        "image": "site-service-0.png",          // ❌ Missing (needs mapping from images.service_0)
        "features": ["Audit complet", ...]
      }
    ]
  }
}
```

---

## Summary: Required Fixes

### 1. wizard-data-mapper.service.ts
**Fix V1 format detection logic (lines 22-49):**
- Don't return early for V1 format
- Apply full transformation even without step0
- Map flat structure to nested structure

### 2. Add Field Mappers
Create mappers for:
- `brand` object from siteName, slogan, images
- `content` object from hero, services, faq, testimonials, about
- `navigation` object from enabled features
- `routing` object from navigation links
- `layout` object with defaults
- `design` object from brand.colors
- `sections` object from brand.colors
- `navbar` object from brand.colors
- `footer` object from brand.colors
- `features` object from enableBlog, enableNewsletter

### 3. Image Path Normalization
Strip `/uploads/sessions/.../` and `?t=...` to get clean filenames

### 4. Services Enhancement
Add missing fields: slug (kebab-case from title), icon (default), image (from images.service_N)

### 5. Default Value Generation
Provide sensible defaults for all missing required fields

---

## 🔍 Image Storage Investigation Results

### Wizard Image Storage Location
**Backend saves images to:**
```
/app/public/uploads/sessions/{sessionId}/{filename}
```
**Code:** `apps/backend/src/common/utils/file-storage.util.ts` line 175-182

**Public URL format:**
```
/uploads/sessions/{sessionId}/{filename}
```

### Example from Cycle17 Session:
```json
{
  "images": {
    "hero": "/uploads/sessions/f81ebfbf-85a8-42be-b918-09e7679178ba/site-hero.png?t=1759748422606",
    "logo": "/uploads/sessions/f81ebfbf-85a8-42be-b918-09e7679178ba/site-logo-clair.png?t=1759748417483",
    "service_0": "/uploads/sessions/f81ebfbf-85a8-42be-b918-09e7679178ba/site-service-conseil-strat_gique.png?t=1759748430266"
  }
}
```

### ⚠️ CRITICAL ISSUE: No Image Copying Logic

**Missing Step:** There is NO code that copies images from wizard session to site-config directory!

**Current Flow:**
1. ✅ Wizard uploads images → `/app/public/uploads/sessions/{sessionId}/`
2. ✅ Wizard saves paths in wizard_data.images
3. ❌ **MISSING:** Copy images to `/var/apps/logen/logen-site-configs/{siteId}/assets/`
4. ❌ **MISSING:** Transform paths from `/uploads/sessions/.../file.png?t=...` to just `file.png`
5. ✅ Generator expects images at `logen-site-configs/{siteId}/assets/`

**Required Implementation:**
Add image copying logic in `site-generation-orchestrator.service.ts` between steps 4 and 5:
1. After saving site-config.json (line 128)
2. Before calling generate.sh (line 137)
3. Copy all images from `/app/public/uploads/sessions/{sessionId}/` to `{configDir}/assets/`
4. Update site-config paths to use clean filenames

---

## Next Steps

1. ✅ Document all missing fields (this file)
2. ✅ Check where wizard images are saved (uploads/sessions → needs copying to logen-site-configs)
3. ⏳ Fix wizard-data-mapper.service.ts to:
   - Handle V1 format properly (don't return early)
   - Transform flat structure to nested structure
   - Map all missing objects (brand, content, navigation, routing, layout, design, sections, navbar, footer, features)
   - Normalize image paths (strip /uploads/sessions/ and ?t= query params)
4. ⏳ Fix site-generation-orchestrator.service.ts to copy images from session to site-config directory
5. ⏳ Test end-to-end: wizard → generate → working site
