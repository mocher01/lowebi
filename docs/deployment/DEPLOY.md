# 🚀 Auto-Deploy Scripts

## Quick Deploy Commands

### Windows (Recommended)
```cmd
scripts\deploy\quick-deploy.bat
```

### Linux/Mac
```bash
chmod +x scripts/deploy/auto-deploy.sh
./scripts/deploy/auto-deploy.sh "Your commit message"
```

## What These Scripts Do

1. **Commit local changes** (if any)
2. **Push to GitHub** 
3. **Pull on production server** (162.55.213.90)
4. **Restart services** (if needed)
5. **Verify deployment** (health checks)

## Manual Deploy (if scripts fail)

```bash
# 1. Commit and push
git add .
git commit -m "Your message"
git push origin main

# 2. Pull on server
ssh root@162.55.213.90 "cd /var/apps/website-generator && git pull origin main"

# 3. Restart portal (if needed)
ssh root@162.55.213.90 "cd /var/apps/website-generator && pkill -f customer-portal && nohup node api/customer-portal-db.js > portal.log 2>&1 &"
```

## Production URLs

- 🧙‍♂️ **Wizard**: http://162.55.213.90:3080/wizard
- 🔧 **API Health**: http://162.55.213.90:3080/api/health  
- 📊 **Portal**: http://162.55.213.90:3080/

## Notes

- Scripts automatically commit with Claude Code signature
- Health checks verify deployment success
- Windows `.bat` script is faster and simpler
- Linux script has more advanced features (service restart, tests)