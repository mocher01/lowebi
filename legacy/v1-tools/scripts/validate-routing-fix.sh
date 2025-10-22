#!/bin/bash

# Quick validation script to test if the nginx routing fix is working
# This can be run from anywhere to test the production deployment

echo "=========================================="
echo "TESTING NGINX ROUTING FIX"
echo "=========================================="
echo ""

BASE_URL="https://logen.locod-ai.com"
ROUTES=("/" "/staff" "/admin" "/api/health")

echo "Testing routes on $BASE_URL..."
echo ""

# Function to test a route
test_route() {
    local route=$1
    local url="${BASE_URL}${route}"
    
    echo -n "Testing $url... "
    
    # Get HTTP status code
    status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    # Check if status code indicates success (2xx or 3xx)
    if [[ $status_code =~ ^[23][0-9][0-9]$ ]]; then
        echo "✅ $status_code"
        return 0
    else
        echo "❌ $status_code"
        return 1
    fi
}

# Test all routes
all_passed=true
for route in "${ROUTES[@]}"; do
    if ! test_route "$route"; then
        all_passed=false
    fi
done

echo ""
echo "=========================================="

if $all_passed; then
    echo "✅ ALL TESTS PASSED"
    echo "Nginx routing fix is working correctly!"
else
    echo "❌ SOME TESTS FAILED"
    echo "There may still be routing issues."
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if services are running:"
    echo "   ssh root@162.55.213.90 'netstat -tlnp | grep -E \":(7600|7601)\"'"
    echo ""
    echo "2. Check nginx error logs:"
    echo "   ssh root@162.55.213.90 'tail -20 /var/log/nginx/error.log'"
    echo ""
    echo "3. Verify nginx config:"
    echo "   ssh root@162.55.213.90 'nginx -t'"
fi

echo "=========================================="
echo ""

# Additional detailed check for the main problematic routes
echo "Detailed check for previously broken routes:"
echo ""

# Test staff route specifically
echo -n "Staff route detailed test... "
staff_response=$(curl -s -I "$BASE_URL/staff" | head -1)
echo "$staff_response"

# Test admin route specifically
echo -n "Admin route detailed test... "
admin_response=$(curl -s -I "$BASE_URL/admin" | head -1)
echo "$admin_response"

echo ""
echo "If you see '200 OK' or '3xx redirect' above, the fix is working!"
echo "If you see '404 Not Found', there may still be configuration issues."
echo ""