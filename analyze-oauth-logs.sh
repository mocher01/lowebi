#!/bin/bash

echo "🔍 OAuth Flow Log Analyzer"
echo "=================================="
echo ""
echo "This script analyzes backend logs to identify the OAuth timestamp update bug."
echo ""
echo "Instructions:"
echo "1. Clear the logs first"
echo "2. Then manually: Click Continue on test66 > Go to Step 6 > Connect Gmail"
echo "3. After OAuth redirect completes, run this script"
echo ""
echo "Press ENTER when you're ready to analyze the logs..."
read

echo ""
echo "📋 Analyzing backend logs..."
echo ""

# Get logs and filter for OAuth and session-related entries
docker logs logen-backend 2>&1 | grep -E "\[OAuth Callback\]|\[getSession\]|\[updateSession\]" | tail -100 > /tmp/oauth-analysis.log

echo "🔐 OAuth Callback Steps:"
echo "------------------------"
grep "\[OAuth Callback\]" /tmp/oauth-analysis.log

echo ""
echo "📥 Session Access (getSession calls):"
echo "--------------------------------------"
grep "\[getSession\]" /tmp/oauth-analysis.log | grep -E "sessionId=|siteName="

echo ""
echo "📝 Session Updates (updateSession calls):"
echo "------------------------------------------"
grep "\[updateSession\]" /tmp/oauth-analysis.log | grep -E "sessionId=|siteName="

echo ""
echo "🔍 Summary Analysis:"
echo "--------------------"

# Count unique sessions accessed
SESSIONS_ACCESSED=$(grep "\[getSession\]" /tmp/oauth-analysis.log | grep -oP 'sessionId="[^"]+' | sort -u | wc -l)
echo "  Sessions accessed: $SESSIONS_ACCESSED"

# List them
echo "  Sessions:"
grep "\[getSession\]" /tmp/oauth-analysis.log | grep -oP 'sessionId="[^"]+' | sed 's/sessionId="/  - /' | sort -u

echo ""
if [ "$SESSIONS_ACCESSED" -gt 1 ]; then
  echo "❌ BUG DETECTED: Multiple sessions were accessed during OAuth flow!"
  echo "   Expected: Only the OAuth session (test66) should be accessed"
  echo "   Actual: $SESSIONS_ACCESSED sessions were accessed"
else
  echo "✅ No issue detected: Only 1 session was accessed"
fi

echo ""
echo "Full log saved to: /tmp/oauth-analysis.log"
