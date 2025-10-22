#!/bin/bash

# Emergency Nginx Fix for Next.js Client-Side Routing
# This script fixes the 404 errors on /staff and /admin routes
# Issue: nginx not properly handling Next.js client-side routing

set -e

echo "=========================================="
echo "EMERGENCY NGINX FIX FOR NEXT.JS ROUTING"
echo "=========================================="
echo ""
echo "Fixing nginx configuration to properly handle Next.js client-side routing"
echo "This will fix 404 errors on /staff and /admin routes"
echo ""

# Backup current nginx config
echo "1. Creating backup of current nginx configuration..."
if [ -f "/var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf" ]; then
    sudo cp /var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf /var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Backup created"
else
    echo "❌ Nginx config file not found at expected location"
    echo "Please verify the nginx configuration path on the server"
    exit 1
fi

# Copy the fixed nginx configuration
echo ""
echo "2. Applying fixed nginx configuration..."
sudo cp "$(dirname "$0")/../docker/nginx/nginx-prod.conf" "/var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf"
echo "✅ Fixed configuration applied"

# Test nginx configuration
echo ""
echo "3. Testing nginx configuration..."
if sudo nginx -t; then
    echo "✅ Nginx configuration test passed"
else
    echo "❌ Nginx configuration test failed"
    echo "Restoring backup..."
    sudo cp "/var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf.backup.$(date +%Y%m%d_%H%M%S)" "/var/apps/nginx-reverse/nginx/conf.d/logen.locod-ai.com.conf"
    exit 1
fi

# Reload nginx
echo ""
echo "4. Reloading nginx..."
if sudo systemctl reload nginx; then
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Failed to reload nginx"
    echo "Attempting to restart nginx..."
    if sudo systemctl restart nginx; then
        echo "✅ Nginx restarted successfully"
    else
        echo "❌ Failed to restart nginx"
        exit 1
    fi
fi

# Test the routes
echo ""
echo "5. Testing routes..."
echo "Testing root route..."
if curl -s -I https://logen.locod-ai.com/ | grep -q "200\|301\|302"; then
    echo "✅ Root route (/) working"
else
    echo "⚠️  Root route may have issues"
fi

echo "Testing staff route..."
if curl -s -I https://logen.locod-ai.com/staff | grep -q "200\|301\|302"; then
    echo "✅ Staff route (/staff) working"
else
    echo "⚠️  Staff route may still have issues"
fi

echo "Testing admin route..."
if curl -s -I https://logen.locod-ai.com/admin | grep -q "200\|301\|302"; then
    echo "✅ Admin route (/admin) working"
else
    echo "⚠️  Admin route may still have issues"
fi

echo ""
echo "=========================================="
echo "NGINX FIX DEPLOYMENT COMPLETE"
echo "=========================================="
echo ""
echo "Next.js routing should now work properly!"
echo ""
echo "Test these URLs in your browser:"
echo "• https://logen.locod-ai.com/ (should work)"
echo "• https://logen.locod-ai.com/staff (should now work)"
echo "• https://logen.locod-ai.com/admin (should now work)"
echo ""
echo "If routes still don't work, check:"
echo "1. Frontend service is running on port 7601"
echo "2. Backend service is running on port 7600"
echo "3. Check nginx error logs: sudo tail -f /var/log/nginx/error.log"
echo "4. Check frontend logs for any errors"
echo ""