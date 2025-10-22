#!/bin/bash

# SSL Deployment Validation Script for logen.locod-ai.com
# Issue #61 - HTTPS/SSL Production Deployment
# Comprehensive testing and validation procedures

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="logen.locod-ai.com"
TEST_RESULTS_FILE="/tmp/ssl_validation_results_$(date +%Y%m%d_%H%M%S).log"
OVERALL_STATUS="PASS"

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_WARNING=0

# Functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$TEST_RESULTS_FILE"
}

error() {
    echo -e "${RED}❌ FAIL: $1${NC}" | tee -a "$TEST_RESULTS_FILE"
    TESTS_FAILED=$((TESTS_FAILED + 1))
    OVERALL_STATUS="FAIL"
}

success() {
    echo -e "${GREEN}✅ PASS: $1${NC}" | tee -a "$TEST_RESULTS_FILE"
    TESTS_PASSED=$((TESTS_PASSED + 1))
}

warning() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}" | tee -a "$TEST_RESULTS_FILE"
    TESTS_WARNING=$((TESTS_WARNING + 1))
}

info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}" | tee -a "$TEST_RESULTS_FILE"
}

critical() {
    echo -e "${PURPLE}🚨 CRITICAL: $1${NC}" | tee -a "$TEST_RESULTS_FILE"
    OVERALL_STATUS="CRITICAL"
}

test_start() {
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -e "${CYAN}🧪 TEST ${TESTS_RUN}: $1${NC}" | tee -a "$TEST_RESULTS_FILE"
}

# Test DNS resolution
test_dns_resolution() {
    test_start "DNS Resolution for ${DOMAIN}"
    
    local domain_ip=$(dig +short "$DOMAIN" | tail -n1)
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "unknown")
    
    if [[ -n "$domain_ip" ]]; then
        success "Domain ${DOMAIN} resolves to ${domain_ip}"
        
        if [[ "$domain_ip" == "$server_ip" ]]; then
            success "Domain points to this server (${server_ip})"
        else
            warning "Domain points to ${domain_ip}, but server IP is ${server_ip}"
        fi
    else
        error "Failed to resolve domain ${DOMAIN}"
    fi
}

# Test HTTP to HTTPS redirect
test_http_redirect() {
    test_start "HTTP to HTTPS Redirect"
    
    local redirect_response=$(curl -s -o /dev/null -w "%{http_code}:%{url_effective}" "http://${DOMAIN}" 2>/dev/null || echo "000:")
    local status_code=$(echo "$redirect_response" | cut -d: -f1)
    local final_url=$(echo "$redirect_response" | cut -d: -f2-)
    
    if [[ "$status_code" == "301" ]] || [[ "$status_code" == "302" ]]; then
        if [[ "$final_url" == "https://${DOMAIN}/"* ]]; then
            success "HTTP correctly redirects to HTTPS (${status_code})"
        else
            warning "HTTP redirects but not to HTTPS URL: ${final_url}"
        fi
    else
        error "HTTP to HTTPS redirect not working (got ${status_code})"
    fi
}

# Test SSL certificate validity
test_ssl_certificate() {
    test_start "SSL Certificate Validity"
    
    # Check if certificate is accessible
    local cert_info=$(echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -text 2>/dev/null)
    
    if [[ -n "$cert_info" ]]; then
        success "SSL certificate is accessible"
        
        # Check certificate expiry
        local expiry_date=$(echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
        local current_epoch=$(date +%s)
        local days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))
        
        if [[ $days_until_expiry -gt 30 ]]; then
            success "Certificate expires in ${days_until_expiry} days (${expiry_date})"
        elif [[ $days_until_expiry -gt 7 ]]; then
            warning "Certificate expires in ${days_until_expiry} days (${expiry_date}) - renewal needed soon"
        else
            error "Certificate expires in ${days_until_expiry} days (${expiry_date}) - urgent renewal needed"
        fi
        
        # Check certificate issuer
        local issuer=$(echo "$cert_info" | grep "Issuer:" | head -1)
        info "Certificate issuer: $issuer"
        
        if echo "$issuer" | grep -qi "let's encrypt"; then
            success "Certificate issued by Let's Encrypt"
        else
            info "Certificate not from Let's Encrypt: $issuer"
        fi
        
        # Check SAN (Subject Alternative Names)
        local san=$(echo "$cert_info" | grep -A1 "Subject Alternative Name" | tail -1)
        if echo "$san" | grep -q "$DOMAIN"; then
            success "Certificate includes correct domain in SAN"
        else
            warning "Domain not found in certificate SAN: $san"
        fi
        
    else
        error "Unable to retrieve SSL certificate"
    fi
}

# Test SSL security configuration
test_ssl_security() {
    test_start "SSL Security Configuration"
    
    # Test TLS version support
    local tls12_support=$(echo | openssl s_client -tls1_2 -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | grep -o "Protocol.*TLS" || echo "not supported")
    local tls13_support=$(echo | openssl s_client -tls1_3 -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | grep -o "Protocol.*TLS" || echo "not supported")
    
    if [[ "$tls12_support" != "not supported" ]]; then
        success "TLS 1.2 supported: $tls12_support"
    else
        warning "TLS 1.2 not supported"
    fi
    
    if [[ "$tls13_support" != "not supported" ]]; then
        success "TLS 1.3 supported: $tls13_support"
    else
        info "TLS 1.3 not supported (optional)"
    fi
    
    # Test cipher strength
    local cipher=$(echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | grep "Cipher" | head -1)
    info "Cipher in use: $cipher"
    
    if echo "$cipher" | grep -E "(AES256|CHACHA20)"; then
        success "Strong cipher in use"
    else
        warning "Weak cipher detected: $cipher"
    fi
}

# Test security headers
test_security_headers() {
    test_start "Security Headers"
    
    local headers=$(curl -s -I "https://${DOMAIN}" 2>/dev/null || echo "")
    
    # Check HSTS
    if echo "$headers" | grep -qi "strict-transport-security"; then
        local hsts_header=$(echo "$headers" | grep -i "strict-transport-security")
        success "HSTS header present: $hsts_header"
        
        if echo "$hsts_header" | grep -q "includeSubDomains"; then
            success "HSTS includes subdomains"
        else
            warning "HSTS does not include subdomains"
        fi
        
        if echo "$hsts_header" | grep -q "preload"; then
            success "HSTS preload enabled"
        else
            info "HSTS preload not enabled (optional)"
        fi
    else
        error "HSTS header missing"
    fi
    
    # Check X-Frame-Options
    if echo "$headers" | grep -qi "x-frame-options"; then
        local xfo_header=$(echo "$headers" | grep -i "x-frame-options")
        success "X-Frame-Options header present: $xfo_header"
    else
        error "X-Frame-Options header missing"
    fi
    
    # Check X-Content-Type-Options
    if echo "$headers" | grep -qi "x-content-type-options"; then
        local xcto_header=$(echo "$headers" | grep -i "x-content-type-options")
        success "X-Content-Type-Options header present: $xcto_header"
    else
        error "X-Content-Type-Options header missing"
    fi
    
    # Check X-XSS-Protection
    if echo "$headers" | grep -qi "x-xss-protection"; then
        local xxp_header=$(echo "$headers" | grep -i "x-xss-protection")
        success "X-XSS-Protection header present: $xxp_header"
    else
        warning "X-XSS-Protection header missing"
    fi
    
    # Check CSP
    if echo "$headers" | grep -qi "content-security-policy"; then
        local csp_header=$(echo "$headers" | grep -i "content-security-policy")
        success "Content-Security-Policy header present"
        info "CSP: $(echo "$csp_header" | cut -c1-100)..."
    else
        warning "Content-Security-Policy header missing"
    fi
}

# Test frontend accessibility
test_frontend_access() {
    test_start "Frontend Accessibility"
    
    # Test main page
    local main_response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}" 2>/dev/null || echo "000")
    if [[ "$main_response" == "200" ]]; then
        success "Frontend main page accessible (HTTP 200)"
    else
        error "Frontend main page not accessible (HTTP ${main_response})"
    fi
    
    # Test staff dashboard
    local staff_response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/staff" 2>/dev/null || echo "000")
    if [[ "$staff_response" == "200" ]] || [[ "$staff_response" == "401" ]] || [[ "$staff_response" == "302" ]]; then
        success "Staff dashboard accessible (HTTP ${staff_response})"
    else
        error "Staff dashboard not accessible (HTTP ${staff_response})"
    fi
    
    # Test admin dashboard
    local admin_response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/admin-dashboard" 2>/dev/null || echo "000")
    if [[ "$admin_response" == "200" ]] || [[ "$admin_response" == "401" ]] || [[ "$admin_response" == "302" ]]; then
        success "Admin dashboard accessible (HTTP ${admin_response})"
    else
        error "Admin dashboard not accessible (HTTP ${admin_response})"
    fi
}

# Test backend API
test_backend_api() {
    test_start "Backend API"
    
    # Test health endpoint
    local health_response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/health" 2>/dev/null || echo "000")
    if [[ "$health_response" == "200" ]]; then
        success "API health endpoint accessible (HTTP 200)"
        
        # Get health data
        local health_data=$(curl -s "https://${DOMAIN}/api/health" 2>/dev/null || echo "{}")
        if echo "$health_data" | grep -q "status"; then
            success "Health endpoint returns valid data"
        else
            warning "Health endpoint accessible but returns unexpected data"
        fi
    else
        error "API health endpoint not accessible (HTTP ${health_response})"
    fi
    
    # Test auth endpoints existence (should return 401 or 400, not 404)
    local auth_response=$(curl -s -o /dev/null -w "%{http_code}" "https://${DOMAIN}/api/auth/login" 2>/dev/null || echo "000")
    if [[ "$auth_response" == "400" ]] || [[ "$auth_response" == "401" ]] || [[ "$auth_response" == "405" ]]; then
        success "Auth endpoint exists (HTTP ${auth_response})"
    elif [[ "$auth_response" == "404" ]]; then
        error "Auth endpoint not found (HTTP 404)"
    else
        warning "Auth endpoint unexpected response (HTTP ${auth_response})"
    fi
}

# Test Docker services
test_docker_services() {
    test_start "Docker Services Status"
    
    # Check if services are running
    local backend_status=$(docker ps --filter "name=locod-backend-prod" --format "{{.Status}}" 2>/dev/null || echo "not running")
    local frontend_status=$(docker ps --filter "name=locod-frontend-prod" --format "{{.Status}}" 2>/dev/null || echo "not running")
    local nginx_status=$(docker ps --filter "name=locod-nginx-prod" --format "{{.Status}}" 2>/dev/null || echo "not running")
    local postgres_status=$(docker ps --filter "name=locod-postgres-prod" --format "{{.Status}}" 2>/dev/null || echo "not running")
    
    if echo "$backend_status" | grep -q "Up"; then
        success "Backend service is running: $backend_status"
    else
        error "Backend service not running: $backend_status"
    fi
    
    if echo "$frontend_status" | grep -q "Up"; then
        success "Frontend service is running: $frontend_status"
    else
        error "Frontend service not running: $frontend_status"
    fi
    
    if echo "$nginx_status" | grep -q "Up"; then
        success "Nginx service is running: $nginx_status"
    else
        error "Nginx service not running: $nginx_status"
    fi
    
    if echo "$postgres_status" | grep -q "Up"; then
        success "PostgreSQL service is running: $postgres_status"
    else
        error "PostgreSQL service not running: $postgres_status"
    fi
}

# Test performance
test_performance() {
    test_start "Performance Testing"
    
    # Test response time
    local start_time=$(date +%s%N)
    curl -s "https://${DOMAIN}" > /dev/null 2>&1
    local end_time=$(date +%s%N)
    local response_time=$(( ($end_time - $start_time) / 1000000 ))  # Convert to milliseconds
    
    if [[ $response_time -lt 2000 ]]; then
        success "Frontend response time: ${response_time}ms (acceptable)"
    elif [[ $response_time -lt 5000 ]]; then
        warning "Frontend response time: ${response_time}ms (slow)"
    else
        error "Frontend response time: ${response_time}ms (too slow)"
    fi
    
    # Test API response time
    start_time=$(date +%s%N)
    curl -s "https://${DOMAIN}/api/health" > /dev/null 2>&1
    end_time=$(date +%s%N)
    local api_response_time=$(( ($end_time - $start_time) / 1000000 ))
    
    if [[ $api_response_time -lt 1000 ]]; then
        success "API response time: ${api_response_time}ms (excellent)"
    elif [[ $api_response_time -lt 3000 ]]; then
        success "API response time: ${api_response_time}ms (acceptable)"
    else
        warning "API response time: ${api_response_time}ms (slow)"
    fi
}

# Test SSL Labs rating (external service)
test_ssl_labs_rating() {
    test_start "SSL Labs Rating (External)"
    
    info "SSL Labs test URL: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
    info "Manual verification recommended for complete SSL analysis"
    
    # Note: We don't automatically test SSL Labs as it requires external API access
    # and can take several minutes to complete
    warning "SSL Labs test should be performed manually for comprehensive analysis"
}

# Test monitoring and logging
test_monitoring() {
    test_start "Monitoring and Logging"
    
    # Check if monitoring script exists
    if [[ -f "/usr/local/bin/monitor-logen-ssl.sh" ]]; then
        success "SSL monitoring script installed"
        
        # Test monitoring script
        if /usr/local/bin/monitor-logen-ssl.sh; then
            success "Monitoring script executed successfully"
        else
            warning "Monitoring script execution failed"
        fi
    else
        warning "SSL monitoring script not found"
    fi
    
    # Check log files
    if [[ -f "/var/log/ssl-monitoring.log" ]]; then
        success "SSL monitoring log file exists"
    else
        info "SSL monitoring log file not created yet (normal for new deployment)"
    fi
    
    # Check cron job
    if crontab -l 2>/dev/null | grep -q "monitor-logen-ssl.sh"; then
        success "SSL monitoring cron job configured"
    else
        warning "SSL monitoring cron job not found"
    fi
}

# Generate test report
generate_test_report() {
    log "=== SSL Deployment Validation Report ==="
    log "Domain: ${DOMAIN}"
    log "Test Date: $(date)"
    log "Test Results File: ${TEST_RESULTS_FILE}"
    log ""
    log "Summary:"
    log "  Tests Run: ${TESTS_RUN}"
    log "  Passed: ${TESTS_PASSED}"
    log "  Failed: ${TESTS_FAILED}"
    log "  Warnings: ${TESTS_WARNING}"
    log "  Overall Status: ${OVERALL_STATUS}"
    log ""
    
    if [[ "$OVERALL_STATUS" == "PASS" ]] && [[ $TESTS_FAILED -eq 0 ]]; then
        success "=== ALL TESTS PASSED - SSL DEPLOYMENT SUCCESSFUL ==="
        info "The staff system is ready for production use at https://${DOMAIN}/staff"
    elif [[ $TESTS_FAILED -eq 0 ]] && [[ $TESTS_WARNING -gt 0 ]]; then
        warning "=== DEPLOYMENT SUCCESSFUL WITH WARNINGS ==="
        warning "Review warnings above and consider addressing them"
    else
        error "=== DEPLOYMENT HAS ISSUES - REVIEW FAILED TESTS ==="
        critical "Failed tests must be addressed before production use"
    fi
    
    log ""
    log "Next Steps:"
    log "1. Review test results in: ${TEST_RESULTS_FILE}"
    log "2. Address any failed tests or warnings"
    log "3. Run SSL Labs test manually"
    log "4. Configure staff user accounts"
    log "5. Monitor system logs"
    log "6. Set up regular backups"
    
    echo ""
    echo "Test results saved to: ${TEST_RESULTS_FILE}"
}

# Main validation process
main() {
    log "=== Starting SSL Deployment Validation for ${DOMAIN} ==="
    log "Issue #61 - HTTPS/SSL Production Deployment Validation"
    
    test_dns_resolution
    test_http_redirect
    test_ssl_certificate
    test_ssl_security
    test_security_headers
    test_frontend_access
    test_backend_api
    test_docker_services
    test_performance
    test_ssl_labs_rating
    test_monitoring
    
    generate_test_report
}

# Parse command line arguments
case "${1:-all}" in
    "all")
        main
        ;;
    "ssl")
        test_ssl_certificate
        test_ssl_security
        test_ssl_labs_rating
        ;;
    "security")
        test_security_headers
        test_ssl_security
        ;;
    "services")
        test_frontend_access
        test_backend_api
        test_docker_services
        ;;
    "performance")
        test_performance
        ;;
    "monitoring")
        test_monitoring
        ;;
    "quick")
        test_dns_resolution
        test_http_redirect
        test_frontend_access
        test_backend_api
        ;;
    *)
        echo "Usage: $0 {all|ssl|security|services|performance|monitoring|quick}"
        echo "  all         - Run all validation tests (default)"
        echo "  ssl         - Test SSL certificate and security"
        echo "  security    - Test security headers and configuration"
        echo "  services    - Test frontend, backend, and Docker services"
        echo "  performance - Test response times"
        echo "  monitoring  - Test monitoring setup"
        echo "  quick       - Run essential tests only"
        exit 1
        ;;
esac