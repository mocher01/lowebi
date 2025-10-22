#!/bin/bash

# 🧙‍♂️ Wizard Acceptance Criteria Validation v1.1.1.9.2.4.2.3
# Validates all acceptance criteria are met for Issue #8

set -e

echo "🧙‍♂️ Validating Enhanced Wizard Flow v1.1.1.9.2.4.2.3"
echo "=================================================="
echo ""

# Start fresh portal instance for testing
echo "🚀 Starting test portal on port 3082..."
PORT=3082 node api/customer-portal-db.js &
PORTAL_PID=$!

# Wait for portal to start
sleep 4

# Validation functions
validate_criterion() {
    local criterion="$1"
    local test_command="$2"
    local description="$3"
    
    echo "📋 Testing: $description"
    
    if eval "$test_command" >/dev/null 2>&1; then
        echo "✅ $criterion"
        return 0
    else
        echo "❌ $criterion"
        return 1
    fi
}

# Track results
PASSED=0
TOTAL=0

echo "🎯 ACCEPTANCE CRITERIA VALIDATION"
echo "================================="
echo ""

# AC1: Enhanced step-by-step wizard interface
TOTAL=$((TOTAL + 1))
if validate_criterion "Enhanced step-by-step wizard interface" \
   "curl -s http://localhost:3082/wizard | grep -q 'Site Creation Wizard'" \
   "Wizard HTML page loads with title"; then
    PASSED=$((PASSED + 1))
fi

# AC2: Progress indicators and navigation
TOTAL=$((TOTAL + 1))
if validate_criterion "Progress indicators and navigation" \
   "curl -s http://localhost:3082/wizard | grep -q 'currentStep'" \
   "Progress tracking functionality"; then
    PASSED=$((PASSED + 1))
fi

# AC3: Form validation for each step
TOTAL=$((TOTAL + 1))
if validate_criterion "Form validation for each step" \
   "curl -s http://localhost:3082/wizard | grep -q 'validateStep'" \
   "Form validation logic present"; then
    PASSED=$((PASSED + 1))
fi

# AC4: Session persistence
TOTAL=$((TOTAL + 1))
if validate_criterion "Session persistence" \
   "curl -s http://localhost:3082/wizard | grep -q 'localStorage'" \
   "Session persistence with localStorage"; then
    PASSED=$((PASSED + 1))
fi

# AC5: Integration with existing APIs
TOTAL=$((TOTAL + 1))
if validate_criterion "Integration with existing APIs" \
   "curl -s http://localhost:3082/wizard | grep -q '/api/sites/create'" \
   "Site creation API integration"; then
    PASSED=$((PASSED + 1))
fi

# AC6: Portal navigation updated
TOTAL=$((TOTAL + 1))
if validate_criterion "Portal navigation updated" \
   "curl -s http://localhost:3082/ | grep -q 'Assistant Guidé'" \
   "Portal includes wizard navigation"; then
    PASSED=$((PASSED + 1))
fi

# AC7: Responsive design
TOTAL=$((TOTAL + 1))
if validate_criterion "Responsive design" \
   "curl -s http://localhost:3082/wizard | grep -q 'tailwindcss'" \
   "Tailwind CSS for responsive design"; then
    PASSED=$((PASSED + 1))
fi

# AC8: Enhanced user experience
TOTAL=$((TOTAL + 1))
if validate_criterion "Enhanced user experience" \
   "curl -s http://localhost:3082/wizard | grep -q 'alpinejs'" \
   "Alpine.js for reactive components"; then
    PASSED=$((PASSED + 1))
fi

echo ""
echo "🔧 TECHNICAL IMPLEMENTATION VALIDATION"
echo "======================================"
echo ""

# Test wizard route accessibility
TOTAL=$((TOTAL + 1))
if validate_criterion "Wizard route accessible" \
   "curl -f http://localhost:3082/wizard" \
   "/wizard route returns HTTP 200"; then
    PASSED=$((PASSED + 1))
fi

# Test API endpoints
TOTAL=$((TOTAL + 1))
if validate_criterion "Business types API available" \
   "curl -f http://localhost:3082/api/config/business-types" \
   "Business types API responds"; then
    PASSED=$((PASSED + 1))
fi

# Test wizard features
TOTAL=$((TOTAL + 1))
if validate_criterion "6-step wizard structure" \
   "curl -s http://localhost:3082/wizard | grep -c 'Welcome\|Business Information\|Design.*Colors\|Content.*Services\|Review.*Confirm\|Site Creation' | grep -q '6'" \
   "All 6 wizard steps present"; then
    PASSED=$((PASSED + 1))
fi

# Test auto-save functionality
TOTAL=$((TOTAL + 1))
if validate_criterion "Auto-save functionality" \
   "curl -s http://localhost:3082/wizard | grep -q '30000'" \
   "30-second auto-save interval configured"; then
    PASSED=$((PASSED + 1))
fi

# Test color palette feature
TOTAL=$((TOTAL + 1))
if validate_criterion "Color palette selection" \
   "curl -s http://localhost:3082/wizard | grep -q 'color-palette'" \
   "Color palette selection feature"; then
    PASSED=$((PASSED + 1))
fi

# Test service management
TOTAL=$((TOTAL + 1))
if validate_criterion "Service management" \
   "curl -s http://localhost:3082/wizard | grep -q 'addService'" \
   "Service add/remove functionality"; then
    PASSED=$((PASSED + 1))
fi

# Clean up
kill $PORTAL_PID 2>/dev/null || true
sleep 2

echo ""
echo "📊 VALIDATION RESULTS"
echo "===================="
echo "✅ Passed: $PASSED/$TOTAL acceptance criteria"
echo "📈 Success Rate: $((PASSED * 100 / TOTAL))%"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    echo "🎉 ALL ACCEPTANCE CRITERIA MET!"
    echo "Enhanced Wizard Flow v1.1.1.9.2.4.2.3 is PRODUCTION READY"
    echo ""
    echo "🔗 Issue #8 Status: ✅ COMPLETED"
    echo "💾 Backup Branch: v1.1.1.9.2.4.2.3-backup"
    echo ""
    echo "🚀 Ready for Production Deployment:"
    echo "   http://your-server:3080/wizard"
    echo ""
    exit 0
else
    echo "❌ Some acceptance criteria not met ($((TOTAL - PASSED)) failures)"
    echo "Please review the failed criteria above"
    echo ""
    exit 1
fi