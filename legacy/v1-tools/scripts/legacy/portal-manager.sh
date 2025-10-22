#!/bin/bash

# 🌐 Portal Management Script v1.1.1.9.2.4.2.3
# Centralized script for managing Customer Portal with Database and Wizard
# Usage: ./scripts/portal-manager.sh [start|stop|restart|status|deploy|update|health]

set -e

PORTAL_SERVICE="customer-portal-db.js"
PORTAL_PORT="3080"
PORTAL_DIR="/var/apps/website-generator"
PORTAL_LOG="portal-service.log"
PID_FILE="portal.pid"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🌐 $1${NC}"
}

# Check if running as root on production
check_environment() {
    if [[ "$HOSTNAME" == *"162.55.213.90"* ]] || [[ "$PWD" == "/var/apps/website-generator" ]]; then
        if [[ $EUID -ne 0 ]]; then
            log_error "This script must be run as root on production server"
            exit 1
        fi
        PRODUCTION=true
        PORTAL_DIR="/var/apps/website-generator"
    else
        PRODUCTION=false
        PORTAL_DIR="$(pwd)"
    fi
}

# Get portal process ID
get_portal_pid() {
    if [[ -f "$PID_FILE" ]]; then
        local pid=$(cat "$PID_FILE")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "$pid"
            return 0
        else
            rm -f "$PID_FILE"
        fi
    fi
    
    # Fallback: search by process name
    pgrep -f "$PORTAL_SERVICE" | head -1
}

# Start portal service
start_portal() {
    log_header "Starting Customer Portal with Database and Wizard"
    
    local existing_pid=$(get_portal_pid)
    if [[ -n "$existing_pid" ]]; then
        log_warning "Portal already running (PID: $existing_pid)"
        return 0
    fi
    
    log_info "Starting portal service on port $PORTAL_PORT..."
    
    cd "$PORTAL_DIR"
    
    # Ensure database is initialized
    if [[ ! -f "database/website-generator.db" ]]; then
        log_info "Initializing database..."
        node database/database-manager.js init
    fi
    
    # Start portal service
    nohup node "api/$PORTAL_SERVICE" > "$PORTAL_LOG" 2>&1 &
    local pid=$!
    echo "$pid" > "$PID_FILE"
    
    # Wait for service to start
    sleep 3
    
    if ps -p "$pid" > /dev/null 2>&1; then
        log_success "Portal started successfully (PID: $pid)"
        log_info "Portal URL: http://localhost:$PORTAL_PORT/"
        log_info "Wizard URL: http://localhost:$PORTAL_PORT/wizard"
        log_info "Admin URL: http://localhost:$PORTAL_PORT/admin"
        log_info "Logs: $PORTAL_DIR/$PORTAL_LOG"
    else
        log_error "Failed to start portal service"
        log_info "Check logs: tail -f $PORTAL_DIR/$PORTAL_LOG"
        return 1
    fi
}

# Stop portal service
stop_portal() {
    log_header "Stopping Customer Portal"
    
    local pid=$(get_portal_pid)
    if [[ -z "$pid" ]]; then
        log_info "Portal is not running"
        return 0
    fi
    
    log_info "Stopping portal service (PID: $pid)..."
    
    # Graceful shutdown
    kill "$pid" 2>/dev/null || true
    
    # Wait for graceful shutdown
    for i in {1..10}; do
        if ! ps -p "$pid" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    # Force kill if still running
    if ps -p "$pid" > /dev/null 2>&1; then
        log_warning "Forcing portal shutdown..."
        kill -9 "$pid" 2>/dev/null || true
    fi
    
    # Clean up
    rm -f "$PID_FILE"
    
    log_success "Portal stopped successfully"
}

# Restart portal service
restart_portal() {
    log_header "Restarting Customer Portal"
    stop_portal
    sleep 2
    start_portal
}

# Check portal status
check_status() {
    log_header "Portal Status Check"
    
    local pid=$(get_portal_pid)
    if [[ -n "$pid" ]]; then
        log_success "Portal is running (PID: $pid)"
        
        # Check HTTP health
        if command -v curl >/dev/null 2>&1; then
            log_info "Checking HTTP health..."
            if curl -s "http://localhost:$PORTAL_PORT/api/health" >/dev/null; then
                log_success "Portal HTTP service is healthy"
            else
                log_warning "Portal process running but HTTP service not responding"
            fi
        fi
        
        # Show resource usage
        if command -v ps >/dev/null 2>&1; then
            log_info "Resource usage:"
            ps -p "$pid" -o pid,ppid,pcpu,pmem,cmd --no-headers || true
        fi
        
    else
        log_warning "Portal is not running"
        return 1
    fi
}

# Deploy latest code
deploy_portal() {
    log_header "Deploying Latest Portal Code"
    
    cd "$PORTAL_DIR"
    
    # Check if git repository
    if [[ ! -d ".git" ]]; then
        log_error "Not a git repository. Cannot deploy."
        return 1
    fi
    
    log_info "Pulling latest code from GitHub..."
    git pull origin main
    
    log_info "Installing/updating dependencies..."
    npm install --production
    
    log_success "Code deployment completed"
    log_info "Run 'restart' to apply changes"
}

# Update portal (deploy + restart)
update_portal() {
    log_header "Updating Customer Portal"
    
    deploy_portal
    restart_portal
    
    log_success "Portal updated successfully"
}

# Health check with detailed information
health_check() {
    log_header "Portal Health Check"
    
    cd "$PORTAL_DIR"
    
    # Process status
    local pid=$(get_portal_pid)
    if [[ -n "$pid" ]]; then
        log_success "Process: Running (PID: $pid)"
    else
        log_error "Process: Not running"
        return 1
    fi
    
    # Port status
    if command -v netstat >/dev/null 2>&1; then
        if netstat -tln | grep -q ":$PORTAL_PORT "; then
            log_success "Port: $PORTAL_PORT is listening"
        else
            log_error "Port: $PORTAL_PORT is not listening"
        fi
    fi
    
    # HTTP endpoints
    if command -v curl >/dev/null 2>&1; then
        log_info "Testing HTTP endpoints..."
        
        # Health endpoint
        if curl -s -f "http://localhost:$PORTAL_PORT/api/health" >/dev/null; then
            log_success "API Health: ✅"
        else
            log_error "API Health: ❌"
        fi
        
        # Portal page
        if curl -s -f "http://localhost:$PORTAL_PORT/" >/dev/null; then
            log_success "Portal Page: ✅"
        else
            log_error "Portal Page: ❌"
        fi
        
        # Wizard page
        if curl -s -f "http://localhost:$PORTAL_PORT/wizard" >/dev/null; then
            log_success "Wizard Page: ✅"
        else
            log_error "Wizard Page: ❌"
        fi
        
        # Business types API
        if curl -s -f "http://localhost:$PORTAL_PORT/api/config/business-types" >/dev/null; then
            log_success "Business Types API: ✅"
        else
            log_error "Business Types API: ❌"
        fi
    fi
    
    # Database status
    if [[ -f "database/website-generator.db" ]]; then
        log_success "Database: ✅ Found"
    else
        log_warning "Database: ⚠️  Not found"
    fi
    
    # Log file status
    if [[ -f "$PORTAL_LOG" ]]; then
        local log_size=$(du -h "$PORTAL_LOG" | cut -f1)
        log_info "Log file: $PORTAL_LOG ($log_size)"
        log_info "Recent log entries:"
        tail -5 "$PORTAL_LOG" | sed 's/^/  /'
    else
        log_warning "Log file not found: $PORTAL_LOG"
    fi
}

# Show usage
show_usage() {
    echo "🌐 Portal Management Script v1.1.1.9.2.4.2.3"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start    - Start the Customer Portal service"
    echo "  stop     - Stop the Customer Portal service"
    echo "  restart  - Restart the Customer Portal service"
    echo "  status   - Show portal process status"
    echo "  deploy   - Pull latest code from GitHub"
    echo "  update   - Deploy latest code and restart service"
    echo "  health   - Comprehensive health check"
    echo "  help     - Show this help message"
    echo ""
    echo "Features:"
    echo "  • Customer Portal with Database v1.1.1.9.2.4.2.1.1"
    echo "  • Enhanced 6-Step Wizard v1.1.1.9.2.4.2.3"
    echo "  • Multi-tenant database management"
    echo "  • CLI integration support"
    echo "  • Automated service management"
    echo ""
    echo "URLs (when running):"
    echo "  • Portal: http://localhost:3080/"
    echo "  • Wizard: http://localhost:3080/wizard"
    echo "  • Admin:  http://localhost:3080/admin"
    echo ""
}

# Main script logic
main() {
    check_environment
    
    case "${1:-help}" in
        "start")
            start_portal
            ;;
        "stop")
            stop_portal
            ;;
        "restart")
            restart_portal
            ;;
        "status")
            check_status
            ;;
        "deploy")
            deploy_portal
            ;;
        "update")
            update_portal
            ;;
        "health")
            health_check
            ;;
        "help"|"-h"|"--help"|"")
            show_usage
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"