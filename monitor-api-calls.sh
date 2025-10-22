#!/bin/bash

echo "🔍 Real-time API Call Monitor"
echo "=============================="
echo ""
echo "Monitoring backend logs for wizard session API calls..."
echo "Clear the logs and perform your OAuth test, then watch what happens:"
echo ""

# Clear existing logs
docker logs logen-backend --tail 0 -f 2>&1 | grep -E "\[getSession\]|\[updateSession\]|GET /customer/wizard-sessions|PUT /customer/wizard-sessions|Mapped \{/customer" --line-buffered
