# Known Issues Tracking

## 🎯 Active Issues

### 1. Blog Page Test Selector Issue (Medium Priority)
- **Issue**: Automated test fails with "strict mode violation: locator('h1, h2') resolved to 2 elements" 
- **Location**: `tests/specs/site-regression.spec.js:83`
- **Impact**: Blog page test failure
- **Status**: Pending
- **Date**: 2025-01-08

### 2. Blog Article Images Test Discrepancy (Low Priority)  
- **Issue**: Automated test reports images not loading, but images are visible manually
- **Location**: `tests/specs/site-regression.spec.js:104`
- **Impact**: False negative in automated tests
- **Status**: Pending (investigation needed)
- **Date**: 2025-01-08

### 3. Mobile Responsive Overflow (Medium Priority)
- **Issue**: 4px horizontal overflow on mobile viewport (379px vs 375px limit)
- **Location**: Mobile responsive CSS
- **Impact**: Mobile user experience degradation
- **Status**: Pending
- **Date**: 2025-01-08

### 4. Generator Cross-Site Content Contamination (High Priority)
- **Issue**: Site templates can leak content between different site configurations
- **Location**: Template injection logic
- **Impact**: Incorrect content appears on wrong sites (e.g., qalyarab text on translatepro)
- **Status**: Pending
- **Date**: 2025-01-08

## ✅ Recently Fixed Issues

### Generator Cross-Site Content Contamination (Fixed - 2025-01-08)
- **Issue**: Templates contained hardcoded site-specific content that appeared on wrong sites
- **Solution**: Implemented Template Isolation System v1.1.1.9.2.4 with scanning and auto-fix
- **Result**: Reduced contamination from 2 critical issues to 1 minor, fixed hardcoded "TranslatePro" references

### Logo Cropping (Fixed - 2025-01-08)
- **Issue**: Logo 'o' was cut off on the right side in translatepro
- **Solution**: Adjusted V4.61 parameters from 90%x30% to 95%x30%+2.5%+10%
- **Result**: Width reduction improved from 10% to 5%

### Contact Form Popup Positioning (Fixed - 2025-01-08)
- **Issue**: Success/error messages appeared off-screen requiring manual scrolling
- **Solution**: Added scroll-to-form behavior for contact form messages
- **Result**: Messages now auto-scroll into view

### Incorrect Service Text Content (Fixed - 2025-01-08)
- **Issue**: Hardcoded qalyarab learning text appeared in translatepro services
- **Solution**: Made ServiceDetail template configurable with site-specific CTA
- **Result**: Translation-appropriate messaging for translatepro

### Image Naming Inconsistency (Fixed - 2025-01-08)
- **Issue**: translatepro images named "cours-X.png" instead of "services-X.png"
- **Solution**: Renamed all image files and updated config references
- **Result**: Consistent service-focused naming convention

## 📋 Test Results Summary (Latest: 2025-01-08)

**Automated Tests Status**: 9/12 tests passing ✅

**Passing Tests**:
- Logo visibility and dimensions ✅
- Contact form functionality ✅  
- N8N configuration ✅
- Performance (832ms load) ✅
- Asset loading ✅

**Failing Tests**:
- Blog page h1/h2 selector ❌
- Blog article images ❌ (visual inspection shows working)
- Mobile responsive overflow ❌ (4px)

## 🚀 New Features v1.1.1.9.2.4 (Added - 2025-01-08)

### Template Isolation System
- **Feature**: Automated scanning and fixing of cross-site content contamination
- **Usage**: `node scripts/core/template-isolation.js scan|fix|dry-run`
- **Impact**: Prevents hardcoded content from appearing on wrong sites

### Guided Generation System  
- **Feature**: Interactive site creation with step-by-step configuration
- **Usage**: `node scripts/core/guided-generation.js`
- **Impact**: Simplifies site creation for non-technical users

### Hot-Patch System
- **Feature**: Live updates to deployed sites without full rebuild
- **Usage**: `node scripts/core/hot-patch.js apply <site> <type> [options]`
- **Impact**: Enables rapid configuration and content updates

### Customer Portal Web Interface
- **Feature**: Browser-based interface for site creation and management
- **Usage**: `./start-portal.sh` → http://localhost:3080
- **Impact**: Foundation for customer self-service platform

---
**Last Updated**: 2025-01-08  
**Version**: 1.1.1.9.2.4  
**Sync Status**: Local ✅ | GitHub ⏳ | Server ⏳