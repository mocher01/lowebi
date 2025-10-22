#!/bin/bash

# V2 Wizard Comprehensive Test Runner
# Tests the live V2 wizard at https://logen.locod-ai.com/wizard-v2

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🧙‍♂️ LOGEN V2 Wizard Comprehensive Test Suite"
echo "=============================================="
echo "Testing: https://logen.locod-ai.com/wizard-v2"
echo "Time: $(date)"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if browsers are installed
if [ ! -d "node_modules/@playwright/test" ]; then
    echo "🌐 Installing Playwright browsers..."
    npx playwright install
fi

# Run the wizard tests with specific config
echo "🚀 Running V2 Wizard Comprehensive Tests..."
echo ""

# Test with different configurations
echo "🔍 Running core wizard functionality tests..."
npx playwright test wizard-v2-comprehensive.spec.ts \
    --config=playwright-wizard.config.ts \
    --reporter=list,html,json \
    --output=./test-results/wizard-v2-artifacts

TEST_EXIT_CODE=$?

echo ""
echo "📊 Test Execution Complete"
echo "=========================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All wizard tests PASSED!"
    echo ""
    echo "📋 Test Results Summary:"
    echo "- Step Navigation: ✅"
    echo "- Template Selection: ✅"
    echo "- Business Info Forms: ✅"
    echo "- Image & Logo Handling: ✅"
    echo "- Content & Services: ✅"
    echo "- Form Persistence: ✅"
    echo "- Responsive Design: ✅"
    echo "- Error Handling: ✅"
else
    echo "❌ Some wizard tests FAILED!"
    echo ""
    echo "📋 Check the detailed report for issues:"
fi

echo ""
echo "📈 View detailed results:"
echo "HTML Report: file://$SCRIPT_DIR/test-results/wizard-v2-report/index.html"
echo "JSON Results: $SCRIPT_DIR/test-results/wizard-v2-results.json"
echo ""

# Show quick summary if results exist
if [ -f "./test-results/wizard-v2-results.json" ]; then
    echo "🏁 Quick Summary:"
    node -e "
    try {
        const results = require('./test-results/wizard-v2-results.json');
        const { stats } = results;
        console.log(\`   Total Tests: \${stats.total}\`);
        console.log(\`   Passed: \${stats.passed}\`);
        console.log(\`   Failed: \${stats.failed}\`);
        console.log(\`   Skipped: \${stats.skipped}\`);
        console.log(\`   Duration: \${Math.round(stats.duration / 1000)}s\`);
    } catch (e) {
        console.log('   Results processing...');
    }
    " 2>/dev/null || echo "   Results processing..."
fi

echo ""
echo "🎯 Next Steps:"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "   • All wizard functionality is working correctly"
    echo "   • Ready for production validation"
    echo "   • Consider running performance tests"
else
    echo "   • Review failed tests in HTML report"
    echo "   • Fix identified issues"
    echo "   • Re-run tests to verify fixes"
fi

exit $TEST_EXIT_CODE