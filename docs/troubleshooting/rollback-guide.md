# Rollback and Recovery Guide

This guide covers how to safely recover from broken states and rollback problematic changes.

## 🎯 Recovery Philosophy

**Golden Rule:** It's better to lose a few hours of work than to spend days debugging a broken system.

## 🏷️ Tagging Strategy

### Before Making Major Changes

**Always create a backup tag:**
```bash
# Before starting work
git tag "backup-$(date +%Y%m%d-%H%M%S)"

# Before risky operations
git tag "pre-migration-$(date +%Y%m%d-%H%M%S)"

# Before major refactoring
git tag "pre-refactor-$(date +%Y%m%d-%H%M%S)"
```

### Emergency Tagging

**When things go wrong:**
```bash
# Tag the broken state (don't lose the work!)
git tag "broken-$(date +%Y%m%d-%H%M%S)"

# Document what was being attempted
git tag -a "broken-login-refactor-$(date +%Y%m%d-%H%M%S)" \
  -m "Login system broke during auth service refactor"
```

## 🔄 Rollback Procedures

### Level 1: Quick Rollback (Service Issues)

**When:** Services won't start, configuration issues, environment problems

```bash
# Stop broken services
./scripts/stop-services.sh

# Reset to last known good state  
git reset --hard golden-master-working

# Clean environment
rm -rf apps/*/node_modules apps/*/.next

# Fresh start
./scripts/start-services.sh
```

**Recovery Time:** 2-5 minutes

### Level 2: Selective Rollback (Partial Issues)

**When:** Some features broken, database issues, specific component failures

```bash
# Identify the problematic commit
git log --oneline -10
git bisect start
git bisect bad HEAD
git bisect good golden-master-working

# Follow git bisect process to find the breaking commit
# Then revert specific commits:
git revert <problematic-commit-hash>

# Or reset to specific commit:
git reset --hard <last-good-commit>
```

**Recovery Time:** 5-15 minutes

### Level 3: Nuclear Rollback (Complete System Failure)

**When:** Database corrupted, major architectural changes failed, multiple systems broken

```bash
# 1. Preserve the broken state
git tag "nuclear-rollback-$(date +%Y%m%d-%H%M%S)"
git stash push -m "Work in progress during nuclear rollback"

# 2. Stop everything
./scripts/stop-services.sh
docker stop $(docker ps -q --filter "name=logen")

# 3. Clean slate
rm -rf apps/*/node_modules
rm -rf apps/*/.next
rm -rf apps/*/dist
docker rm logen-postgres logen-redis 2>/dev/null || true

# 4. Reset to golden master
git reset --hard golden-master-working

# 5. Fresh installation
./scripts/start-services.sh
```

**Recovery Time:** 5-20 minutes

## 🗄️ Database Rollback

### Safe Database Reset

```bash
# 1. Backup current database (even if broken)
docker exec logen-postgres pg_dump -U logen_user logen_db \
  > "backup-broken-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || true

# 2. Stop database
docker stop logen-postgres

# 3. Remove database container (data will be lost!)
docker rm logen-postgres

# 4. Start fresh database
docker-compose -f config/docker/docker-compose.yml up -d postgres

# 5. Wait for database to be ready
sleep 10
docker exec logen-postgres pg_isready -U logen_user

# 6. Run migrations
cd apps/backend
npm run typeorm migration:run
```

### Restore from Backup

```bash
# If you have a good database backup
docker exec -i logen-postgres psql -U logen_user -d logen_db \
  < backup-good-state.sql
```

## 📊 Gradual Recovery

### After Nuclear Rollback

**Step 1: Verify Golden Master Works**
```bash
./scripts/health-check.sh
./scripts/regression-test.sh
```

**Step 2: Analyze What Went Wrong**
```bash
# Compare broken state with golden master
git diff golden-master-working nuclear-rollback-$(date +%Y%m%d-%H%M%S)

# Review commits that caused issues
git log golden-master-working..nuclear-rollback-$(date +%Y%m%d-%H%M%S)
```

**Step 3: Reapply Changes Incrementally**
```bash
# Create new feature branch
git checkout -b recovery/incremental-fixes

# Cherry-pick specific commits that were good
git cherry-pick <good-commit-hash>

# Test after each cherry-pick
./scripts/health-check.sh
```

**Step 4: Update Golden Master**
```bash
# When everything works again
git checkout golden-master-working
git merge recovery/incremental-fixes
git push origin golden-master-working
```

## 🔍 Root Cause Analysis

### Post-Rollback Investigation

```bash
# 1. Create analysis workspace
mkdir -p analysis/rollback-$(date +%Y%m%d-%H%M%S)
cd analysis/rollback-$(date +%Y%m%d-%H%M%S)

# 2. Extract information
git log --oneline golden-master-working..broken-$(date +%Y%m%d-%H%M%S) > commits.log
git diff golden-master-working broken-$(date +%Y%m%d-%H%M%S) > changes.diff
cp /tmp/logen-*.log . 2>/dev/null || true

# 3. Document findings
cat > analysis.md << 'EOF'
# Rollback Analysis

## What Happened
- [Describe the failure symptoms]

## Timeline
- [When did it start failing]
- [What changes were made]

## Root Cause
- [Technical reason for failure]

## Prevention
- [How to avoid this in future]
EOF
```

### Common Failure Patterns

**1. Package Dependency Issues**
```bash
# Identify: package.json changes in commits
git show --name-only <commit> | grep package

# Prevention: Lock versions, test in isolation
```

**2. Database Schema Changes**
```bash
# Identify: Migration files, entity changes
git diff --name-only | grep -E "(migration|entity)"

# Prevention: Test migrations on backup data first
```

**3. Configuration Changes**
```bash
# Identify: Environment, config file changes
git diff --name-only | grep -E "(config|env|\.json|\.yaml)"

# Prevention: Document configuration dependencies
```

**4. API Contract Changes**
```bash
# Identify: Controller, DTO changes
git diff --name-only | grep -E "(controller|dto)"

# Prevention: Backward compatibility checks
```

## 🛡️ Prevention Strategies

### Pre-Commit Safety

```bash
# Our pre-commit hook already runs health checks
# Make sure it's working:
git commit -m "test commit" --allow-empty

# Should trigger health check automatically
```

### Incremental Development

```bash
# Work in small commits
git add -p  # Add parts of files
git commit -m "Small focused change"
./scripts/health-check.sh
```

### Feature Flags

```typescript
// Use environment variables for risky features
const ENABLE_NEW_FEATURE = process.env.ENABLE_NEW_FEATURE === 'true';

if (ENABLE_NEW_FEATURE) {
  // New risky code
} else {
  // Existing stable code
}
```

### Database Migration Safety

```bash
# Always test migrations
npm run typeorm migration:create -n TestMigration
# Edit migration to be idempotent
npm run typeorm migration:run
npm run typeorm migration:revert
npm run typeorm migration:run
```

## 📈 Recovery Metrics

### Track Recovery Times

```bash
# Log rollback events
echo "$(date): Level 3 rollback completed in X minutes" >> rollback-log.txt

# Monthly review
grep "rollback completed" rollback-log.txt | tail -10
```

### Success Indicators

- System back online within target time
- All health checks pass
- No data loss (if expected)
- Clear understanding of root cause

## 🚨 Emergency Contacts

### When to Escalate

- **Level 1 rollback fails** - Something is fundamentally wrong
- **Data integrity concerns** - Potential corruption
- **Multiple rollback attempts** - Pattern of instability

### Emergency Procedures

```bash
# Create emergency snapshot
git bundle create emergency-backup.bundle --all
tar -czf emergency-filesystem.tar.gz /var/apps/logen

# Document the emergency
cat > emergency-report.txt << EOF
Date: $(date)
Issue: [Brief description]
Attempts: [What was tried]
Current State: [System status]
Next Steps: [What needs to happen]
EOF
```

## ✅ Recovery Checklist

After any rollback:

- [ ] System passes health checks
- [ ] All critical pages load (wizard, login, dashboard)
- [ ] Database is accessible and consistent
- [ ] Services are running on correct ports
- [ ] No error messages in logs
- [ ] Authentication works end-to-end
- [ ] Critical user journeys work
- [ ] Golden master updated (if needed)
- [ ] Post-mortem completed
- [ ] Prevention measures identified

## 📚 Learning from Rollbacks

### Document Lessons Learned

```bash
# After each rollback, update common issues
echo "## $(date +%Y-%m-%d): [Issue Description]" >> docs/troubleshooting/lessons-learned.md
echo "**Cause:** [Root cause]" >> docs/troubleshooting/lessons-learned.md
echo "**Solution:** [How it was fixed]" >> docs/troubleshooting/lessons-learned.md
echo "**Prevention:** [How to avoid next time]" >> docs/troubleshooting/lessons-learned.md
echo "" >> docs/troubleshooting/lessons-learned.md
```

### Update Automation

```bash
# If rollback revealed a gap in health checks
# Update ./scripts/health-check.sh to catch similar issues

# If rollback revealed missing documentation
# Update troubleshooting guides
```

**Remember:** Every rollback is a learning opportunity to make the system more robust.