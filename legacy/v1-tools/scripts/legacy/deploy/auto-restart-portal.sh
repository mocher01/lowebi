#!/bin/bash

# 🔄 Auto-restart portal after changes
# Usage: Run on server automatically after git pull

PORTAL_DIR="/var/apps/website-generator"
LOG_FILE="$PORTAL_DIR/portal.log"
PID_FILE="$PORTAL_DIR/portal.pid"

cd "$PORTAL_DIR"

echo "🔄 Auto-restart portal script started at $(date)"

# Kill existing portal process
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if ps -p "$OLD_PID" > /dev/null 2>&1; then
        echo "🛑 Stopping existing portal (PID: $OLD_PID)"
        kill "$OLD_PID"
        sleep 2
    fi
    rm -f "$PID_FILE"
fi

# Kill any remaining node processes for portal
pkill -f "customer-portal-db.js" 2>/dev/null || true

echo "🚀 Starting new portal instance..."

# Start portal and save PID
nohup node api/customer-portal-db.js > "$LOG_FILE" 2>&1 &
PORTAL_PID=$!
echo "$PORTAL_PID" > "$PID_FILE"

echo "✅ Portal started with PID: $PORTAL_PID"

# Wait and test
sleep 3
if curl -s -I http://localhost:3080 > /dev/null; then
    echo "✅ Portal is responding on port 3080"
else
    echo "❌ Portal failed to start properly"
    if [ -f "$LOG_FILE" ]; then
        echo "Last 5 lines of log:"
        tail -5 "$LOG_FILE"
    fi
fi

echo "🏁 Auto-restart completed at $(date)"