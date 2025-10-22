# Git Backup Process

This document outlines the standard process for backing up work to GitHub before continuing development.

## 📋 Process Overview

1. **Commit current changes** with descriptive message
2. **Create backup branch** and push to GitHub  
3. **Push main branch** to GitHub (overwrite remote main)
4. **Return to local main** to continue work

## 🔧 Commands Template

```bash
# 1. Commit current fixes
git add .
git commit -m "[DESCRIPTIVE_MESSAGE]

[DETAILED_DESCRIPTION_OF_CHANGES]

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 2. Create and push backup branch
git checkout -b backup-[FEATURE_NAME]-$(date +%Y-%m-%d)
git push origin backup-[FEATURE_NAME]-$(date +%Y-%m-%d)

# 3. Switch back to main and push (overwrite GitHub main)
git checkout main  
git push origin main --force-with-lease

# 4. Confirm we're on local main
git status
```

## 📝 Example Usage

```bash
# Example for wizard session fixes
git add .
git commit -m "🔧 Fix wizard session 400 errors and authentication issues

- Fix My Sites empty page due to JWT expiration
- Replace manual POST/PUT logic with get-or-create endpoint
- Add automatic token refresh for wizard sessions
- Improve error handling and user experience

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git checkout -b backup-wizard-auth-fixes-2025-09-04
git push origin backup-wizard-auth-fixes-2025-09-04
git checkout main
git push origin main --force-with-lease
git status
```

## ⚠️ Safety Notes

- **`--force-with-lease`** is safer than `--force` as it checks for upstream changes
- **Backup branch** preserves work in case rollback is needed
- **Always confirm git status** after completion
- **Branch naming convention**: `backup-[feature]-[date]`

## 🎯 What This Accomplishes

- ✅ Preserves current work in a backup branch
- ✅ Updates GitHub main to match local main
- ✅ Keeps you on local main to continue working
- ✅ Safe backup available if needed later
- ✅ Clean commit history with descriptive messages

## 📁 File Location

This process document is saved at: `/var/apps/logen/BACKUP_PROCESS.md`