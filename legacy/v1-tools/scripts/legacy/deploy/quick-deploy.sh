#!/bin/bash

# 🚀 Quick Deploy Script for Mode Rapide
# Non-interactive deployment for automated site creation
# Usage: ./scripts/deploy/quick-deploy.sh <site-name> <port>

set -e

SITE_NAME="$1"
PORT="${2:-3000}"

if [ -z "$SITE_NAME" ]; then
    echo "❌ Error: Site name required"
    echo "Usage: $0 <site-name> [port]"
    exit 1
fi

# Check if config exists
if [ ! -f "configs/$SITE_NAME/site-config.json" ]; then
    echo "❌ Error: Config not found for site $SITE_NAME"
    exit 1
fi

echo "🚀 Quick Deploy: $SITE_NAME on port $PORT"

# Set non-interactive environment variables
export IMAGE_MODE="none"  # Skip image processing for quick deploy
export AUTO_CONFIRM="yes"  # Skip confirmation prompts

# Generate the site
echo "📦 Generating site..."
./scripts/core/generate-site.sh "$SITE_NAME" --build --docker --images none

# Check if Docker image was built
if ! docker image inspect "${SITE_NAME}-website" > /dev/null 2>&1; then
    echo "❌ Docker image not found"
    exit 1
fi

# Stop and remove existing container if any
echo "🧹 Cleaning up existing containers..."
docker stop "${SITE_NAME}-current" 2>/dev/null || true
docker rm "${SITE_NAME}-current" 2>/dev/null || true

# Run the container
echo "🐳 Starting container on port $PORT..."
docker run -d \
    --name "${SITE_NAME}-current" \
    -p "${PORT}:80" \
    --restart unless-stopped \
    "${SITE_NAME}-website"

# Verify container is running
sleep 2
if docker ps | grep -q "${SITE_NAME}-current"; then
    echo "✅ Site deployed successfully!"
    echo "🌐 Accessible at: http://localhost:${PORT}"
    echo "🌐 External: http://$(hostname -I | awk '{print $1}'):${PORT}"
    exit 0
else
    echo "❌ Container failed to start"
    exit 1
fi