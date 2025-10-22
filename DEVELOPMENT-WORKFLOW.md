# Logen Development Workflow Guide

## 🎯 Daily Development Process

### Morning Startup
```bash
# 1. Get latest changes
git pull origin main

# 2. Verify system health
./scripts/health-check.sh

# 3. If health check passes, you're ready to develop!
# If it fails, check the golden master:
git reset --hard golden-master-working
./scripts/start-services.sh
```

### Starting a New Feature
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Backup current state (safety first!)
git tag "backup-$(date +%Y%m%d-%H%M%S)"

# 3. Start developing
```

### During Development (THE IRON RULES)
```bash
# After EVERY significant change:
1. ./scripts/health-check.sh     # Must pass ✅
2. git add .
3. git commit -m "Small descriptive change"

# If health check fails:
# - Don't commit broken code
# - Fix the issue or rollback
# - Never let the system stay broken
```

### End of Day
```bash
# 1. Final health check
./scripts/health-check.sh

# 2. Push your work
git push origin feature/your-feature-name

# 3. Create PR when feature is complete
```

## 🚨 When Things Break

### Level 1: Quick Issues (Use this 90% of the time)
```bash
# If something stops working:
git stash                                    # Save your work
git reset --hard golden-master-working      # Reset to working state
./scripts/start-services.sh                 # Start fresh
git stash pop                               # Restore your work
# Now fix the issue incrementally
```

### Level 2: System Won't Start
```bash
./scripts/stop-services.sh
./scripts/start-services.sh
./scripts/health-check.sh
```

### Level 3: Complete Nuclear Reset
```bash
git tag "emergency-$(date +%Y%m%d-%H%M%S)"  # Save broken state
git reset --hard golden-master-working      # Nuclear reset
./scripts/stop-services.sh
docker stop $(docker ps -q --filter "name=logen")
rm -rf apps/*/node_modules apps/*/.next
./scripts/start-services.sh
```

## 📋 Available Commands

### Health & Testing
```bash
./scripts/health-check.sh      # Full system validation
./scripts/regression-test.sh   # Core functionality tests
./scripts/check-logs.sh        # Log analysis and troubleshooting
```

### Service Management
```bash
./scripts/start-services.sh    # Start all services with proper setup
./scripts/stop-services.sh     # Clean shutdown of all services
```

### Git Workflow
```bash
git checkout golden-master-working  # Go to always-working state
git tag "backup-$(date +%Y%m%d-%H%M%S)"  # Create backup point
```

## 🎨 Code Quality

The pre-commit hook now runs:
1. **Health check** (required to pass)
2. **Linting** (warnings only, non-blocking)

To fix linting issues:
```bash
cd apps/frontend && npm run lint --fix
cd apps/backend && npm run lint --fix
```

## 🔧 Troubleshooting

### Common Issues & Quick Fixes

**"Port already in use":**
```bash
./scripts/stop-services.sh
./scripts/start-services.sh
```

**"Database connection failed":**
```bash
docker restart logen-postgres
./scripts/health-check.sh
```

**"Module not found":**
```bash
cd apps/frontend && rm -rf node_modules && npm install
cd apps/backend && rm -rf node_modules && npm install
```

**"404 on wizard pages":**
```bash
# This should never happen again, but if it does:
git reset --hard golden-master-working
./scripts/start-services.sh
```

## 📚 Documentation

- **Setup Issues**: `docs/troubleshooting/setup-guide.md`
- **Common Problems**: `docs/troubleshooting/common-issues.md`
- **Debugging Help**: `docs/troubleshooting/debugging-guide.md`
- **Recovery Procedures**: `docs/troubleshooting/rollback-guide.md`

## 🎯 Success Indicators

**You're doing it right when:**
- Health checks always pass ✅
- You commit small, incremental changes ✅
- You never spend more than 30 minutes debugging ✅
- You can rollback to working state in 2 minutes ✅
- All critical pages work (no 404s) ✅

## 🚫 Anti-Patterns (Don't Do This)

❌ Making large changes without testing  
❌ Committing code that fails health checks  
❌ Spending hours debugging instead of rolling back  
❌ Working on multiple features in one branch  
❌ Skipping the backup tags  
❌ Not running health checks after changes  

## 💡 Pro Tips

1. **Commit early, commit often** - Small commits are easier to debug
2. **Health check before commit** - Always, no exceptions
3. **Use the 30-minute rule** - If stuck debugging, rollback and try differently
4. **Tag before risky changes** - Better safe than sorry
5. **Trust the system** - The golden master is always working

---

**Remember: A working system is the foundation of everything else. Protect it at all costs.**