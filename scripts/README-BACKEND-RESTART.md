# Backend Restart - Permanent Fix for OAuth Credentials

## 🐛 Problem: OAuth Credentials Keep Getting Lost

### Root Cause
Every time the backend container was restarted (for updates, fixes, etc.), we used manual `docker run` commands that only included SOME environment variables. The `GOOGLE_OAUTH_*` variables were stored in `.env` files but weren't being passed to the container.

### The Cycle
1. ✅ Fix OAuth → Add vars manually → Works!
2. 🔧 Update backend code → Rebuild image
3. 🔄 Restart container → **Use manual command** → Forgets OAuth vars ❌
4. 💥 OAuth breaks again → Error: "Google OAuth2 is not configured"

---

## ✅ Permanent Solution

### Use the Restart Script

**Always use this script to restart the backend:**

```bash
bash /var/apps/logen/scripts/restart-backend.sh
```

### What It Does

1. **Stops** the existing backend container
2. **Starts** a new container using `--env-file` (secure method)
3. **Loads ALL variables** from:
   - `/var/apps/logen/apps/backend/.env` (OAuth, etc.)
   - `/var/apps/logen/config/.env` (DB, Redis, etc.)
4. **Verifies** critical variables are loaded
5. **Checks** backend health

### Security Features

✅ **Secrets NOT visible** in `docker inspect`
✅ **Secrets NOT visible** in process list (`ps aux`)
✅ **File permissions** protect secrets
✅ **No manual enumeration** of variables needed

---

## 🚀 When to Use This Script

Use the restart script whenever you need to:

1. **After rebuilding the backend image**
   ```bash
   cd /var/apps/logen/apps/backend
   docker build -f Dockerfile.prod -t logen-backend:latest .
   bash /var/apps/logen/scripts/restart-backend.sh
   ```

2. **After changing environment variables**
   ```bash
   vim /var/apps/logen/apps/backend/.env  # Edit variables
   bash /var/apps/logen/scripts/restart-backend.sh
   ```

3. **After server reboot**
   ```bash
   bash /var/apps/logen/scripts/restart-backend.sh
   ```

4. **For any troubleshooting**
   ```bash
   bash /var/apps/logen/scripts/restart-backend.sh
   ```

---

## ❌ NEVER Do This Again

**DON'T use manual docker run commands:**

```bash
# ❌ BAD - Variables will be forgotten
docker run -d \
  --name logen-backend \
  -e DB_HOST="..." \
  -e JWT_SECRET="..." \
  # ❌ Forgot GOOGLE_OAUTH_* variables!
  logen-backend:latest
```

**Instead, ALWAYS use the script:**

```bash
# ✅ GOOD - All variables automatically loaded
bash /var/apps/logen/scripts/restart-backend.sh
```

---

## 🔍 Verifying OAuth is Configured

After restart, check if OAuth credentials are loaded:

```bash
docker exec logen-backend env | grep GOOGLE_OAUTH
```

**Expected output:**
```
GOOGLE_OAUTH_CLIENT_ID=113858871957-ddvd011oqpc1o7esqkl36nhigje6b5tm.apps.googleusercontent.com
GOOGLE_OAUTH_CLIENT_SECRET=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
GOOGLE_OAUTH_REDIRECT_URI=https://logen.locod-ai.com/api/customer/oauth2/callback
```

If any are missing, the script will show an error during verification.

---

## 📝 Environment Files Structure

```
/var/apps/logen/
├── apps/backend/.env          # Backend-specific (OAuth, encryption)
├── config/.env                # Infrastructure (DB, Redis)
└── scripts/
    ├── restart-backend.sh     # Use this to restart!
    └── README-BACKEND-RESTART.md
```

---

## 🔧 Docker Compose Alternative (Future)

For even better management, update `docker-compose.yml`:

```yaml
services:
  backend:
    image: logen-backend:latest
    env_file:
      - ../../apps/backend/.env
      - ../../config/.env
    # ... rest of config
```

Then use:
```bash
docker compose -f config/docker/prod/docker-compose.yml up -d backend
```

---

## ✅ Success Criteria

After running the restart script, you should see:

```
✅ Backend container started
✅ GOOGLE_OAUTH_CLIENT_ID: Loaded
✅ GOOGLE_OAUTH_CLIENT_SECRET: Loaded
✅ ENCRYPTION_KEY: Loaded
✅ Backend is healthy and responding
```

If OAuth still doesn't work after this, the problem is elsewhere (not missing credentials).

---

## 📞 Troubleshooting

**Problem:** Script shows "❌ GOOGLE_OAUTH_CLIENT_ID: MISSING"

**Solution:** Check that `/var/apps/logen/apps/backend/.env` contains:
```bash
GOOGLE_OAUTH_CLIENT_ID=your-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-secret
GOOGLE_OAUTH_REDIRECT_URI=https://logen.locod-ai.com/api/customer/oauth2/callback
```

**Problem:** Backend won't start

**Solution:** Check logs:
```bash
docker logs logen-backend --tail 50
```

---

**Last Updated:** October 13, 2025
**Issue:** Recurring OAuth credentials loss
**Fix:** Permanent restart script with --env-file
