# NGINX Next.js Routing Fix - Technical Documentation

## Problem Summary

**Issue**: Staff and admin routes (`/staff`, `/admin`) return 404 errors from the Next.js frontend
**Root Cause**: nginx configuration not properly handling Next.js client-side routing
**Status**: FIXED - Updated nginx configuration deployed

## Root Cause Analysis

### The Problem
Next.js uses client-side routing, meaning:
1. The browser requests `/staff` 
2. nginx tries to find that exact path on the server
3. Since `/staff` doesn't exist as a physical file, nginx returns 404
4. Next.js never gets a chance to handle the routing client-side

### Previous Configuration Issues
The original nginx config had separate `location` blocks for `/staff` and `/admin-dashboard`, which created conflicts and didn't properly handle Next.js routing patterns.

### The Solution
Modified nginx configuration to:
1. Remove separate location blocks for `/staff` and `/admin`
2. Handle all frontend routes through the main `/` location block
3. Let Next.js handle all routing internally
4. Added proper handling for Next.js static assets (`/_next/`)

## Technical Implementation

### Before (Problematic Configuration)
```nginx
# PROBLEMATIC - These separate blocks interfered with Next.js routing
location /staff {
    proxy_pass http://staff_frontend_upstream;
    # ... other config
}

location /admin-dashboard {
    proxy_pass http://staff_frontend_upstream;
    # ... other config
}

location / {
    proxy_pass http://staff_frontend_upstream;
    # ... other config
}
```

### After (Fixed Configuration)
```nginx
# FIXED - Single location block handles all frontend routes
location ~ ^/_next/ {
    # Handle Next.js internal routes
    proxy_pass http://staff_frontend_upstream;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location ~ ^/_next/static/ {
    # Handle Next.js static files
    proxy_pass http://staff_frontend_upstream;
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {
    # Handle ALL frontend routes: /, /staff, /admin, etc.
    proxy_pass http://staff_frontend_upstream;
    # Enhanced configuration for Next.js
    proxy_buffering off;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    # ... standard proxy headers
}
```

## Deployment Instructions

### Quick Deployment (Recommended)
1. Run the deployment script:
   ```bash
   # On Windows
   cd v2/scripts
   fix-nginx-nextjs-routing.bat
   
   # On Linux/Mac
   cd v2/scripts
   chmod +x fix-nginx-nextjs-routing.sh
   ./fix-nginx-nextjs-routing.sh
   ```

### Manual Deployment
1. **Backup current config:**
   ```bash
   sudo cp /var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf \
          /var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf.backup
   ```

2. **Deploy fixed config:**
   ```bash
   sudo cp v2/docker/nginx/nginx-prod.conf \
          /var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf
   ```

3. **Test configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   ```

## Verification Steps

### Test Routes
After deployment, verify these URLs work:
- ✅ https://logen.locod-ai.com/ (root)
- ✅ https://logen.locod-ai.com/staff (staff portal)
- ✅ https://logen.locod-ai.com/admin (admin dashboard)
- ✅ https://logen.locod-ai.com/api/health (backend API)

### Command Line Testing
```bash
# Test status codes
curl -I https://logen.locod-ai.com/
curl -I https://logen.locod-ai.com/staff
curl -I https://logen.locod-ai.com/admin

# All should return 200 OK (or 3xx redirect)
```

## Troubleshooting

### If Routes Still Don't Work

1. **Check service status:**
   ```bash
   # Verify frontend is running on port 7601
   sudo netstat -tlnp | grep 7601
   
   # Verify backend is running on port 7600
   sudo netstat -tlnp | grep 7600
   ```

2. **Check nginx logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

3. **Check frontend logs:**
   ```bash
   # If using PM2
   pm2 logs frontend
   
   # If using Docker
   docker logs website-generator-frontend
   ```

4. **Verify nginx config:**
   ```bash
   sudo nginx -t
   sudo nginx -T | grep -A 20 "server_name logen.locod-ai.com"
   ```

### Common Issues

**Issue**: Still getting 404 errors
**Solution**: Ensure frontend service is actually running on port 7601

**Issue**: 502 Bad Gateway
**Solution**: Backend service may be down or not accessible on port 7600

**Issue**: SSL certificate errors
**Solution**: Verify Let's Encrypt certificates are valid and not expired

## Architecture Notes

### Service Ports
- **Frontend (Next.js)**: Port 7601
- **Backend (NestJS)**: Port 7600
- **Database (PostgreSQL)**: Port 5432

### Upstream Configuration
```nginx
upstream staff_frontend_upstream {
    server frontend:7601 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

upstream staff_backend_upstream {
    server backend:7600 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

## Future Considerations

### Performance Optimizations
1. **CDN Integration**: Consider using CloudFlare for static asset caching
2. **HTTP/3**: Upgrade to HTTP/3 when available
3. **Brotli Compression**: Add Brotli compression alongside gzip

### Monitoring
1. **Health Checks**: Implement automated health checks for frontend routes
2. **Alerting**: Set up alerts for 404 errors on critical routes
3. **Performance Monitoring**: Monitor response times for frontend routes

### Security Enhancements
1. **CSP Headers**: Fine-tune Content Security Policy headers
2. **Rate Limiting**: Adjust rate limiting for different route patterns
3. **DDoS Protection**: Consider additional DDoS protection measures

## Related Files

- **Main nginx config**: `v2/docker/nginx/nginx-prod.conf`
- **Deployment script**: `v2/scripts/fix-nginx-nextjs-routing.sh`
- **Frontend routes**: `v2/frontend/src/app/` (Next.js App Router)
- **Backend API**: `v2/backend/src/` (NestJS)

---

**Status**: ✅ RESOLVED
**Date**: 2025-08-17
**Priority**: HIGH (Production Critical)
**Impact**: Staff and admin access restored