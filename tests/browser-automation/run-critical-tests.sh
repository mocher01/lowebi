#!/bin/bash

# LOGEN Admin Portal - Critical Issues Test Runner
# This script runs the most important tests to catch the reported issues

echo "🚀 LOGEN Admin Portal - Critical Browser Automation Tests"
echo "=========================================================="
echo ""
echo "This test suite addresses the reported critical issues:"
echo "1. ❌ Login error: 'Cannot read properties of undefined (reading 'accessToken')'"
echo "2. ❌ Form width issue: inputs taking full page width despite max-w-xs class"
echo ""

# Change to test directory
cd "$(dirname "$0")"

# Check if admin frontend is running
echo "🔍 Checking if admin frontend is running on localhost:7602..."
if curl -s http://localhost:7602 > /dev/null; then
    echo "✅ Admin frontend is running"
else
    echo "❌ Admin frontend is not running on localhost:7602"
    echo "Please start it with: cd /var/apps/logen/apps/admin-frontend && npm run dev"
    exit 1
fi

# Check if backend is running
echo "🔍 Checking if backend is running on localhost:7600..."
if curl -s http://localhost:7600 > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running on localhost:7600"
    echo "Please start it with: cd /var/apps/logen/apps/backend && npm run start:dev"
    exit 1
fi

echo ""
echo "🧪 Running Critical Issue Tests..."
echo "=================================="

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing test dependencies..."
    npm install
fi

# Ensure browsers are installed
echo "🌐 Ensuring Playwright browsers are installed..."
npx playwright install

echo ""
echo "🎯 CRITICAL TEST 1: Form Width Measurement"
echo "This test measures ACTUAL rendered widths in the browser"
npx playwright test admin-form-width.spec.ts --reporter=list

echo ""
echo "🎯 CRITICAL TEST 2: JavaScript Error Detection"
echo "This test captures the specific 'accessToken' error and analyzes API responses"
npx playwright test admin-javascript-errors.spec.ts --reporter=list

echo ""
echo "🎯 CRITICAL TEST 3: Network & API Validation"
echo "This test monitors actual network requests and validates API response structure"
npx playwright test admin-network-api.spec.ts --reporter=list

echo ""
echo "🎯 ADDITIONAL TEST: End-to-End Flow"
echo "This test performs complete login flow testing"
npx playwright test admin-e2e-flow.spec.ts --reporter=list

echo ""
echo "📊 Generating Comprehensive Report..."
echo "===================================="

# Run all critical tests with detailed reporting
npx playwright test admin-form-width admin-javascript-errors admin-network-api admin-e2e-flow \
    --reporter=html,junit,json \
    --output-dir=./test-results

echo ""
echo "📋 TEST EXECUTION COMPLETE"
echo "=========================="
echo ""
echo "📁 Results are available in:"
echo "   - HTML Report: ./test-results/html-report/index.html"
echo "   - Screenshots: ./test-results/artifacts/"
echo "   - JUnit XML: ./test-results/junit-results.xml"
echo ""
echo "🔍 To view the HTML report, run:"
echo "   npx playwright show-report"
echo ""

if [ -f "./test-results/test-results.json" ]; then
    echo "📈 Quick Test Summary:"
    echo "====================="
    
    # Extract basic stats from the JSON report (requires jq if available)
    if command -v jq &> /dev/null; then
        TOTAL_TESTS=$(jq '.suites[].specs | length' ./test-results/test-results.json 2>/dev/null | head -1)
        echo "Total tests executed: ${TOTAL_TESTS:-'N/A'}"
    else
        echo "Install 'jq' for detailed test statistics"
    fi
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "============="
echo "1. Open the HTML report to see detailed results and screenshots"
echo "2. Check the artifacts folder for actual width measurements"
echo "3. Review console error logs for the specific accessToken issue"
echo "4. Analyze API response structure findings"
echo ""
echo "This test suite provides REAL browser data, not just HTML parsing!"
echo "Use these findings to fix the actual issues in the admin portal."