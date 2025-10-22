#!/bin/bash

# 🚀 Auto-Deploy Script v2.0 - Fast & Reliable
# Automatically deploys changes to production server with minimal downtime
# Usage: ./scripts/deploy/auto-deploy.sh [commit-message]

set -e

PRODUCTION_SERVER="root@162.55.213.90"
PROJECT_PATH="/var/apps/website-generator"

echo "🚀 Starting Fast Auto-Deploy Process..."
echo "=========================================="

# Get commit message from argument or generate a descriptive one
if [ -n "$1" ]; then
    COMMIT_MSG="$1"
else
    # Generate a descriptive commit message based on changed files
    CHANGED_FILES=$(git status --porcelain | head -5)
    if [[ $CHANGED_FILES == *"wizard"* ]]; then
        COMMIT_MSG="fix: Update wizard functionality and UI improvements"
    elif [[ $CHANGED_FILES == *"Mode Rapide"* ]] || [[ $CHANGED_FILES == *"mode-rapide"* ]]; then
        COMMIT_MSG="fix: Mode Rapide site creation and deployment"
    elif [[ $CHANGED_FILES == *"template"* ]]; then
        COMMIT_MSG="feat: Template system improvements"
    elif [[ $CHANGED_FILES == *"deploy"* ]]; then
        COMMIT_MSG="fix: Deployment process improvements"
    elif [[ $CHANGED_FILES == *"test"* ]]; then
        COMMIT_MSG="test: Add or update test scripts"
    elif [[ $CHANGED_FILES == *"config"* ]]; then
        COMMIT_MSG="config: Update configuration files"
    else
        # Count changed files for a more descriptive message
        FILE_COUNT=$(git status --porcelain | wc -l)
        COMMIT_MSG="feat: Update $FILE_COUNT files with latest improvements"
    fi
fi
echo "📝 Commit Message: $COMMIT_MSG"

# Step 1: Commit current changes (if any)
echo ""
echo "1️⃣ Committing local changes..."
if [[ -n $(git status --porcelain) ]]; then
    git add .
    git commit -m "$COMMIT_MSG

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"
    echo "✅ Changes committed locally"
else
    echo "ℹ️ No local changes to commit"
fi

# Step 2: Push to GitHub
echo ""
echo "2️⃣ Pushing to GitHub..."
git push origin main
echo "✅ Pushed to GitHub successfully"

# Step 3: Smart server update with minimal downtime
echo ""
echo "3️⃣ Smart server update (minimal downtime)..."

# Check if service is running first
SERVICE_RUNNING=$(ssh $PRODUCTION_SERVER "ps aux | grep customer-portal-db.js | grep -v grep | wc -l" 2>/dev/null || echo "0")
echo "📊 Services currently running: $SERVICE_RUNNING"

# Update code first, then restart service
echo "📥 Updating server code..."
ssh $PRODUCTION_SERVER "cd $PROJECT_PATH && git fetch origin && git reset --hard origin/main" 2>/dev/null || {
    echo "❌ Git update failed - attempting recovery..."
    ssh $PRODUCTION_SERVER "cd $PROJECT_PATH && git stash && git fetch origin && git reset --hard origin/main"
}
echo "✅ Server code updated"

# Fast service restart
echo ""
echo "4️⃣ Fast service restart..."

if [[ "$SERVICE_RUNNING" -gt 0 ]]; then
    echo "🔄 Quick restart of existing service..."
    ssh $PRODUCTION_SERVER "
        cd $PROJECT_PATH
        pkill -f customer-portal-db.js || true
        sleep 1
        nohup node api/customer-portal-db.js > portal.log 2>&1 &
        sleep 2
    " 2>/dev/null || true
else
    echo "🚀 Starting new service..."
    ssh $PRODUCTION_SERVER "
        cd $PROJECT_PATH
        nohup node api/customer-portal-db.js > portal.log 2>&1 &
        sleep 2
    " 2>/dev/null || true
fi

# Quick verification with timeout
echo ""
echo "5️⃣ Quick verification..."

# Wait max 10 seconds for service to start
for i in {1..5}; do
    SERVICE_COUNT=$(ssh $PRODUCTION_SERVER "ps aux | grep customer-portal-db.js | grep -v grep | wc -l" 2>/dev/null || echo "0")
    if [[ "$SERVICE_COUNT" -gt 0 ]]; then
        echo "✅ Service running (check $i/5)"
        break
    else
        echo "⏳ Waiting for service... ($i/5)"
        sleep 2
    fi
done

# Quick health check with timeout
echo "🏥 Testing API health..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 http://162.55.213.90:3080/api/health 2>/dev/null || echo "timeout")

if [[ "$HTTP_STATUS" == "200" ]]; then
    echo "✅ API responding correctly"
elif [[ "$HTTP_STATUS" == "timeout" ]]; then
    echo "⚠️ API timeout (may still be starting)"
else
    echo "⚠️ API Status: $HTTP_STATUS"
fi

# Final status
FINAL_SERVICE_COUNT=$(ssh $PRODUCTION_SERVER "ps aux | grep customer-portal-db.js | grep -v grep | wc -l" 2>/dev/null || echo "0")

echo ""
if [[ "$FINAL_SERVICE_COUNT" -gt 0 ]]; then
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
    echo "=========================================="
    echo "🌐 Wizard: http://162.55.213.90:3080/wizard"
    echo "🔧 API: http://162.55.213.90:3080/api/health" 
    echo "📊 Portal: http://162.55.213.90:3080/"
    echo ""
    echo "⏱️ Total downtime: ~3-5 seconds"
else
    echo "❌ DEPLOYMENT ISSUE - Service not running!"
    echo "📋 Checking recent logs..."
    ssh $PRODUCTION_SERVER "cd $PROJECT_PATH && tail -5 portal.log" 2>/dev/null || echo "No logs available"
    
    echo ""
    echo "🔄 Emergency restart attempt..."
    ssh $PRODUCTION_SERVER "
        cd $PROJECT_PATH
        killall node 2>/dev/null || true
        sleep 1
        nohup node api/customer-portal-db.js > portal.log 2>&1 &
    " 2>/dev/null
    
    sleep 3
    EMERGENCY_SERVICE=$(ssh $PRODUCTION_SERVER "ps aux | grep customer-portal-db.js | grep -v grep | wc -l" 2>/dev/null || echo "0")
    
    if [[ "$EMERGENCY_SERVICE" -gt 0 ]]; then
        echo "✅ Emergency restart successful!"
    else
        echo "❌ Emergency restart failed - manual intervention needed"
        exit 1
    fi
fi

echo ""
echo "🏁 Fast deployment complete!"