#!/bin/bash

# System Monitoring Script for Website Generator v2
# Provides comprehensive health checks and alerts

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
PROJECT_DIR="/root/website-generator/v2"
DOCKER_COMPOSE_FILE="docker/docker-compose.prod.yml"
LOG_FILE="/var/log/system-monitor.log"
ALERT_EMAIL="admin@locod.ai"
BACKEND_URL="http://162.55.213.90:7600"
FRONTEND_URL="http://162.55.213.90:7601"

# Thresholds
CPU_THRESHOLD=80
MEMORY_THRESHOLD=85
DISK_THRESHOLD=90
RESPONSE_TIME_THRESHOLD=5

# Functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}INFO: $1${NC}" | tee -a "$LOG_FILE"
}

send_alert() {
    local subject="$1"
    local message="$2"
    
    # Send email alert (if mail is configured)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "$subject" "$ALERT_EMAIL"
    fi
    
    # Log alert
    error "ALERT: $subject - $message"
}

# Check system resources
check_system_resources() {
    log "Checking system resources..."
    
    # CPU Usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    if (( $(echo "$cpu_usage > $CPU_THRESHOLD" | bc -l) )); then
        send_alert "High CPU Usage" "CPU usage is ${cpu_usage}% (threshold: ${CPU_THRESHOLD}%)"
    else
        info "CPU usage: ${cpu_usage}%"
    fi
    
    # Memory Usage
    local memory_info=$(free | grep Mem)
    local total_mem=$(echo $memory_info | awk '{print $2}')
    local used_mem=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $used_mem * 100 / $total_mem" | bc)
    
    if (( $(echo "$memory_usage > $MEMORY_THRESHOLD" | bc -l) )); then
        send_alert "High Memory Usage" "Memory usage is ${memory_usage}% (threshold: ${MEMORY_THRESHOLD}%)"
    else
        info "Memory usage: ${memory_usage}%"
    fi
    
    # Disk Usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    if [[ $disk_usage -gt $DISK_THRESHOLD ]]; then
        send_alert "High Disk Usage" "Disk usage is ${disk_usage}% (threshold: ${DISK_THRESHOLD}%)"
    else
        info "Disk usage: ${disk_usage}%"
    fi
}

# Check Docker containers
check_docker_containers() {
    log "Checking Docker containers..."
    
    cd "$PROJECT_DIR"
    local containers=("locod-backend-prod" "locod-frontend-prod" "locod-postgres-prod" "locod-redis-prod" "locod-nginx-prod")
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no-healthcheck")
            if [[ "$status" == "healthy" ]] || [[ "$status" == "no-healthcheck" ]]; then
                success "Container $container is running"
            else
                send_alert "Container Health Issue" "Container $container status: $status"
            fi
        else
            send_alert "Container Down" "Container $container is not running"
        fi
    done
}

# Check application endpoints
check_application_endpoints() {
    log "Checking application endpoints..."
    
    # Backend health check
    local backend_start_time=$(date +%s%N)
    if curl -f -s -k "$BACKEND_URL/api/health" > /dev/null; then
        local backend_end_time=$(date +%s%N)
        local backend_response_time=$(echo "scale=3; ($backend_end_time - $backend_start_time) / 1000000000" | bc)
        
        if (( $(echo "$backend_response_time > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            warning "Backend slow response: ${backend_response_time}s"
        else
            success "Backend health check passed (${backend_response_time}s)"
        fi
    else
        send_alert "Backend Down" "Backend health check failed at $BACKEND_URL/api/health"
    fi
    
    # Frontend health check
    local frontend_start_time=$(date +%s%N)
    if curl -f -s -k "$FRONTEND_URL" > /dev/null; then
        local frontend_end_time=$(date +%s%N)
        local frontend_response_time=$(echo "scale=3; ($frontend_end_time - $frontend_start_time) / 1000000000" | bc)
        
        if (( $(echo "$frontend_response_time > $RESPONSE_TIME_THRESHOLD" | bc -l) )); then
            warning "Frontend slow response: ${frontend_response_time}s"
        else
            success "Frontend health check passed (${frontend_response_time}s)"
        fi
    else
        send_alert "Frontend Down" "Frontend health check failed at $FRONTEND_URL"
    fi
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    if docker exec locod-postgres-prod pg_isready -U locod_user -d locod_prod > /dev/null 2>&1; then
        success "Database is accessible"
        
        # Check database size
        local db_size=$(docker exec locod-postgres-prod psql -U locod_user -d locod_prod -t -c "SELECT pg_size_pretty(pg_database_size('locod_prod'));" | xargs)
        info "Database size: $db_size"
        
        # Check active connections
        local active_connections=$(docker exec locod-postgres-prod psql -U locod_user -d locod_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
        info "Active database connections: $active_connections"
        
        if [[ $active_connections -gt 50 ]]; then
            warning "High number of active database connections: $active_connections"
        fi
    else
        send_alert "Database Connection Failed" "Cannot connect to PostgreSQL database"
    fi
}

# Check SSL certificates
check_ssl_certificates() {
    log "Checking SSL certificates..."
    
    local cert_file="/etc/nginx/ssl/cert.pem"
    if docker exec locod-nginx-prod test -f "$cert_file"; then
        local expiry_date=$(docker exec locod-nginx-prod openssl x509 -in "$cert_file" -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -lt 30 ]]; then
            send_alert "SSL Certificate Expiring" "SSL certificate expires in $days_until_expiry days"
        elif [[ $days_until_expiry -lt 7 ]]; then
            send_alert "SSL Certificate Critical" "SSL certificate expires in $days_until_expiry days - URGENT"
        else
            info "SSL certificate expires in $days_until_expiry days"
        fi
    else
        warning "SSL certificate file not found"
    fi
}

# Check log files for errors
check_logs_for_errors() {
    log "Checking logs for errors..."
    
    # Check Docker container logs for errors
    local containers=("locod-backend-prod" "locod-frontend-prod")
    
    for container in "${containers[@]}"; do
        local error_count=$(docker logs "$container" --since="1h" 2>&1 | grep -i "error" | wc -l)
        if [[ $error_count -gt 10 ]]; then
            warning "High error count in $container logs: $error_count errors in last hour"
        elif [[ $error_count -gt 0 ]]; then
            info "$container has $error_count errors in last hour"
        fi
    done
    
    # Check system logs
    local system_error_count=$(journalctl --since="1 hour ago" --priority=err | wc -l)
    if [[ $system_error_count -gt 5 ]]; then
        warning "High system error count: $system_error_count errors in last hour"
    fi
}

# Generate monitoring report
generate_report() {
    local report_file="/tmp/monitoring-report-$(date +%Y%m%d_%H%M%S).txt"
    
    cat > "$report_file" << EOF
=== Website Generator v2 Monitoring Report ===
Generated: $(date)

SYSTEM RESOURCES:
- CPU Usage: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')
- Memory Usage: $(free -h | grep Mem | awk '{print $3"/"$2}')
- Disk Usage: $(df -h / | tail -1 | awk '{print $5}')

DOCKER CONTAINERS:
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}")

APPLICATION STATUS:
- Backend: $(curl -s -k "$BACKEND_URL/api/health" | jq -r '.status' 2>/dev/null || echo "Failed")
- Frontend: $(curl -s -k "$FRONTEND_URL" >/dev/null 2>&1 && echo "Accessible" || echo "Failed")

DATABASE:
- Status: $(docker exec locod-postgres-prod pg_isready -U locod_user -d locod_prod >/dev/null 2>&1 && echo "Connected" || echo "Failed")
- Connections: $(docker exec locod-postgres-prod psql -U locod_user -d locod_prod -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "Unknown")

RECENT LOGS:
$(docker logs locod-backend-prod --since="1h" --tail=10 2>&1 | head -5)

=== End of Report ===
EOF
    
    info "Monitoring report generated: $report_file"
    
    # Email report if configured
    if command -v mail &> /dev/null; then
        mail -s "Website Generator v2 Monitoring Report" "$ALERT_EMAIL" < "$report_file"
    fi
}

# Comprehensive monitoring
full_monitoring() {
    log "=== Starting comprehensive system monitoring ==="
    
    check_system_resources
    check_docker_containers
    check_application_endpoints
    check_database
    check_ssl_certificates
    check_logs_for_errors
    
    success "=== Monitoring completed ==="
}

# Main script logic
case "${1:-full}" in
    "full"|"monitor")
        full_monitoring
        ;;
    "system")
        check_system_resources
        ;;
    "containers")
        check_docker_containers
        ;;
    "endpoints")
        check_application_endpoints
        ;;
    "database")
        check_database
        ;;
    "ssl")
        check_ssl_certificates
        ;;
    "logs")
        check_logs_for_errors
        ;;
    "report")
        generate_report
        ;;
    "install-cron")
        # Install as cron job
        (crontab -l 2>/dev/null; echo "*/5 * * * * $0 full") | crontab -
        info "Monitoring installed as cron job (runs every 5 minutes)"
        ;;
    *)
        echo "Website Generator v2 - System Monitoring Tool"
        echo "Usage: $0 {full|system|containers|endpoints|database|ssl|logs|report|install-cron}"
        echo ""
        echo "Commands:"
        echo "  full       - Complete monitoring check (default)"
        echo "  system     - System resource check"
        echo "  containers - Docker container check"
        echo "  endpoints  - Application endpoint check"
        echo "  database   - Database connectivity check"
        echo "  ssl        - SSL certificate check"
        echo "  logs       - Log file error check"
        echo "  report     - Generate monitoring report"
        echo "  install-cron - Install as cron job"
        exit 1
        ;;
esac