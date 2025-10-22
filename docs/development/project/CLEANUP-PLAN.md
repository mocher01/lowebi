# 🧹 Repository Cleanup Plan - Before v2.0

## 📋 Files and Directories to Remove

### 1. **Old/Deprecated API Files**
```bash
# Old version without database
api/customer-portal.js           # Replaced by customer-portal-db.js
api/server.js                    # Old server, not used
api/middleware/                  # Old middleware, not used
api/routes/                      # Old routes structure
```

### 2. **Test/Demo Configurations**
```bash
configs/testco/
configs/testmoderapide/
configs/wizard-e2e-test-site/
configs/wizarde2etes*/           # All test wizard configs
configs/wizard-test/
configs/finaltest*/              # All test deployments
configs/moderapide*/
configs/successtest*/
configs/pillowing*/              # Test sites
configs/test-site*/
```

### 3. **Archive/Old Scripts**
```bash
scripts/archive/                 # All archived scripts
scripts/test-*.sh                # Old test scripts
scripts/fix-*.js                 # One-time fix scripts
scripts/reorganize-steps.js      # One-time migration
scripts/create-github-issues*.   # One-time issue creation
```

### 4. **Test Files in Root**
```bash
test-error.png                   # Test screenshot
test-results/                    # Old test results
```

### 5. **Generated Sites (Not in Git)**
```bash
generated-sites/*/               # All generated sites (local only)
```

### 6. **Old Documentation**
```bash
docs/archive/                    # If exists
docs/old/                        # If exists
```

---

## 📋 Files to Keep but Review

### 1. **Configurations to Keep**
```bash
configs/translatepro/            # Production demo site
configs/qaly*/                   # Production sites
configs/education-academy/       # Template example
```

### 2. **API Files to Keep (for now)**
```bash
api/customer-portal-db.js        # Current working version
api/config-generator.js          # Reusable logic for v2
api/image-processor.js           # Reusable for v2
api/admin/                       # Admin queue system
api/portal-ui/                   # Current UI (reference for v2)
```

### 3. **Core Scripts to Keep**
```bash
scripts/core/                    # Core generation logic
scripts/deploy/                  # Deployment scripts
scripts/setup/                   # Setup utilities
scripts/generators/              # Generation utilities
```

---

## 📋 Files to Create/Update

### 1. **New Structure for v2**
```bash
.archive/                        # Move old files here before deletion
v2/                             # New v2 development
  ├── backend/                  # NestJS
  └── frontend/                 # Next.js
```

### 2. **Updated Documentation**
```bash
README.md                        # Update with v2 info
CHANGELOG.md                     # Document the transition
docs/MIGRATION.md               # v1 to v2 migration guide
```

---

## 🚀 Cleanup Commands

### Step 1: Create Archive
```bash
# Create archive directory
mkdir -p .archive/api
mkdir -p .archive/scripts
mkdir -p .archive/configs

# Move old files
mv api/customer-portal.js .archive/api/
mv api/server.js .archive/api/
mv api/middleware .archive/api/
mv api/routes .archive/api/
mv scripts/archive .archive/scripts/
```

### Step 2: Clean Test Configs
```bash
# Move test configs
mkdir -p .archive/configs-test
mv configs/test* .archive/configs-test/
mv configs/wizard* .archive/configs-test/
mv configs/final* .archive/configs-test/
mv configs/moderapide* .archive/configs-test/
mv configs/pillowing* .archive/configs-test/
mv configs/success* .archive/configs-test/
```

### Step 3: Clean Scripts
```bash
# Move old scripts
mv scripts/test-*.sh .archive/scripts/
mv scripts/fix-*.js .archive/scripts/
mv scripts/reorganize-steps.js .archive/scripts/
mv scripts/create-github-issues* .archive/scripts/
```

### Step 4: Clean Root
```bash
# Remove test files
rm test-error.png
rm -rf test-results/
```

### Step 5: Update .gitignore
```bash
# Add to .gitignore
.archive/
v2/node_modules/
v2/dist/
v2/.env
generated-sites/
configs/test*/
configs/*test*/
```

---

## ⚠️ Before Cleanup Checklist

- [ ] **Commit all current changes**
- [ ] **Create backup branch**: `git checkout -b v1-final-backup`
- [ ] **Tag current version**: `git tag v1.1.1.9.2.4.2.1-final`
- [ ] **Document production sites** that must be preserved
- [ ] **Verify no active deployments** depend on files to be removed

---

## 📊 Expected Results

### Before Cleanup:
- ~200+ files
- Many test configs
- Duplicate/old code
- Unclear structure

### After Cleanup:
- Clean repository
- Only production configs
- Clear v1 vs v2 separation
- Ready for v2 development

---

## 🔄 Rollback Plan

If anything goes wrong:
```bash
# Restore from archive
mv .archive/api/* api/
mv .archive/scripts/* scripts/
mv .archive/configs-test/* configs/

# Or restore from git
git checkout v1-final-backup
```

---

## ✅ Post-Cleanup Verification

1. **Test core generator still works**:
   ```bash
   ./init.sh translatepro --docker
   ```

2. **Verify portal still runs**:
   ```bash
   node api/customer-portal-db.js
   ```

3. **Check production sites configs exist**:
   ```bash
   ls configs/translatepro/
   ls configs/qaly*/
   ```

4. **Confirm git status is clean**:
   ```bash
   git status
   ```

---

**Ready to proceed with cleanup?** 

This will prepare the repository for v2.0 development while preserving everything needed for v1 maintenance.