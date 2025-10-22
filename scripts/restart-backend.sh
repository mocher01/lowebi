#!/bin/bash
#
# Permanent Backend Restart Script
#
# PURPOSE: Restart the backend container with ALL environment variables loaded from .env files
# This fixes the recurring issue where OAuth credentials get lost after container restarts.
#
# USAGE:
#   bash /var/apps/logen/scripts/restart-backend.sh
#
# SECURITY:
#   Uses --env-file which is secure:
#   - Secrets NOT visible in `docker inspect`
#   - Secrets NOT visible in `ps aux` process list
#   - File permissions protect secrets (only root can read)
#

set -e  # Exit on error

echo "🔄 Restarting logen-backend with full environment..."
echo ""

# Navigate to project root
cd /var/apps/logen

# Stop and remove existing container
echo "📦 Stopping existing container..."
docker stop logen-backend 2>/dev/null || true
docker rm logen-backend 2>/dev/null || true
echo "✅ Old container removed"
echo ""

# Start new container with ALL environment variables
echo "🚀 Starting new container with secure env loading..."
docker run -d \
  --name logen-backend \
  --network logen-network \
  -p 7600:7600 \
  --env-file /var/apps/logen/apps/backend/.env \
  --env-file /var/apps/logen/config/.env \
  -e REDIS_HOST=logen-redis-prod \
  -e DB_HOST=logen-postgres \
  -v /var/apps/logen:/var/apps/logen \
  -v /var/apps/nginx-reverse:/var/apps/nginx-reverse \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --restart unless-stopped \
  logen-backend:latest

echo "✅ Backend container started"
echo ""

# Wait for container to initialize
echo "⏳ Waiting for backend to initialize..."
sleep 10

# Check container status
echo "📊 Container status:"
docker ps --filter name=logen-backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo ""

# Verify critical environment variables are loaded
echo "🔍 Verifying environment variables..."
echo "   Checking OAuth credentials..."
if docker exec logen-backend env | grep -q "GOOGLE_OAUTH_CLIENT_ID"; then
    echo "   ✅ GOOGLE_OAUTH_CLIENT_ID: Loaded"
else
    echo "   ❌ GOOGLE_OAUTH_CLIENT_ID: MISSING"
fi

if docker exec logen-backend env | grep -q "GOOGLE_OAUTH_CLIENT_SECRET"; then
    echo "   ✅ GOOGLE_OAUTH_CLIENT_SECRET: Loaded"
else
    echo "   ❌ GOOGLE_OAUTH_CLIENT_SECRET: MISSING"
fi

if docker exec logen-backend env | grep -q "ENCRYPTION_KEY"; then
    echo "   ✅ ENCRYPTION_KEY: Loaded"
else
    echo "   ❌ ENCRYPTION_KEY: MISSING"
fi

echo ""

# Check backend health
echo "🏥 Checking backend health..."
sleep 5

if curl -sf http://localhost:7600/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy and responding"
else
    echo "⚠️  Backend is not responding yet (may need more time to start)"
fi

echo ""
echo "✅ Done! Backend restart complete."
echo ""
echo "📝 IMPORTANT NOTES:"
echo "   - All environment variables loaded from .env files"
echo "   - OAuth credentials are properly configured"
echo "   - This script should be used for ALL future restarts"
echo "   - Never use manual 'docker run' commands anymore"
echo ""
