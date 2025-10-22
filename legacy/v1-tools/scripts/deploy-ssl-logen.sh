#!/bin/bash

# SSL Production Deployment Script for logen.locod-ai.com
# Issue #61 - HTTPS/SSL Production Deployment
# This script handles the complete SSL deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/website-generator/v2"
DOMAIN="logen.locod-ai.com"
DOCKER_COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE=".env.logen-production"
BACKUP_DIR="/backups/website-generator-ssl"
LOG_FILE="/var/log/ssl-deployment.log"
NGINX_CONFIG_DIR="docker/nginx"

# Functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}ERROR: $1${NC}" | tee -a $LOG_FILE
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a $LOG_FILE
}

info() {
    echo -e "${BLUE}INFO: $1${NC}" | tee -a $LOG_FILE
}

critical() {
    echo -e "${PURPLE}CRITICAL: $1${NC}" | tee -a $LOG_FILE
}

# Pre-deployment safety checks
pre_deployment_safety_checks() {
    log "=== Starting Pre-Deployment Safety Checks ==="
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
    
    # Check if project directory exists
    if [[ ! -d "$PROJECT_DIR" ]]; then
        error "Project directory does not exist: $PROJECT_DIR"
    fi
    
    # Verify DNS resolution for domain
    info "Checking DNS resolution for ${DOMAIN}..."
    if ! nslookup "$DOMAIN" > /dev/null 2>&1; then
        warning "DNS resolution failed for ${DOMAIN}. Continuing anyway..."
    else
        success "DNS resolution successful for ${DOMAIN}"
    fi
    
    # Check domain points to this server
    DOMAIN_IP=$(dig +short "$DOMAIN" | tail -n1)
    SERVER_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
    
    if [[ "$DOMAIN_IP" != "$SERVER_IP" ]]; then
        warning "Domain ${DOMAIN} (${DOMAIN_IP}) does not point to this server (${SERVER_IP})"
        warning "SSL certificate generation may fail"
    else
        success "Domain ${DOMAIN} correctly points to this server"
    fi
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Verify environment file
    if [[ ! -f "$PROJECT_DIR/$ENV_FILE" ]]; then
        warning "Environment file not found: $PROJECT_DIR/$ENV_FILE"
        info "Creating from template..."
        cp "$PROJECT_DIR/.env.logen-production" "$PROJECT_DIR/$ENV_FILE"
        warning "IMPORTANT: Update secrets in $PROJECT_DIR/$ENV_FILE before continuing"
        echo "Press Enter when ready to continue..."
        read -r
    fi
    
    success "Pre-deployment safety checks completed"
}

# Backup existing configurations
backup_existing_configs() {
    log "Creating backup of existing configurations..."
    
    # Create backup directory with timestamp
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    mkdir -p "$backup_path"
    
    # Backup nginx configuration
    if [[ -d "$PROJECT_DIR/$NGINX_CONFIG_DIR" ]]; then
        cp -r "$PROJECT_DIR/$NGINX_CONFIG_DIR" "$backup_path/"
        info "Nginx configuration backed up"
    fi
    
    # Backup environment files
    cp "$PROJECT_DIR"/.env* "$backup_path/" 2>/dev/null || true
    
    # Backup existing SSL certificates if they exist
    if [[ -d "/etc/letsencrypt" ]]; then
        cp -r "/etc/letsencrypt" "$backup_path/" 2>/dev/null || true
        info "Existing SSL certificates backed up"
    fi
    
    # Backup docker-compose files
    cp "$PROJECT_DIR"/docker/*.yml "$backup_path/" 2>/dev/null || true
    
    success "Backup created at $backup_path"
    echo "$backup_path" > "/tmp/ssl_deployment_backup_path"
}

# Test nginx configuration syntax
test_nginx_config() {
    log "Testing nginx configuration syntax..."
    
    cd "$PROJECT_DIR"
    
    # Test the configuration using docker
    if docker run --rm -v "$PWD/$NGINX_CONFIG_DIR/nginx-prod.conf:/etc/nginx/nginx.conf:ro" nginx:1.25-alpine nginx -t; then
        success "Nginx configuration syntax is valid"
    else
        error "Nginx configuration syntax is invalid. Please check the configuration."
    fi
}

# Generate SSL certificates
generate_ssl_certificates() {
    log "Generating SSL certificates for ${DOMAIN}..."
    
    cd "$PROJECT_DIR/$NGINX_CONFIG_DIR"
    
    # Make SSL generation script executable
    chmod +x generate-ssl-letsencrypt.sh
    
    # Generate certificates
    info "Running Let's Encrypt certificate generation..."
    if ./generate-ssl-letsencrypt.sh generate; then
        success "SSL certificates generated successfully"
    else
        error "Failed to generate SSL certificates"
    fi
    
    # Verify certificates exist
    local ssl_dir="/etc/nginx/ssl/${DOMAIN}"
    if [[ -f "${ssl_dir}/fullchain.pem" ]] && [[ -f "${ssl_dir}/privkey.pem" ]]; then
        success "SSL certificate files verified"
        
        # Display certificate information
        info "Certificate information:"
        openssl x509 -in "${ssl_dir}/fullchain.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)" | sed 's/^/  /'
    else
        error "SSL certificate files not found after generation"
    fi
}

# Update docker-compose for SSL domain
update_docker_compose() {
    log "Updating docker-compose configuration for SSL domain..."
    
    cd "$PROJECT_DIR"
    
    # Create SSL-specific docker-compose override
    cat > "docker/docker-compose.logen-ssl.yml" << EOF
version: '3.8'

# SSL Override for logen.locod-ai.com deployment
# Issue #61 - HTTPS/SSL Production Deployment

services:
  backend:
    environment:
      - CORS_ORIGIN=https://logen.locod-ai.com
      - PRODUCTION_DOMAIN=logen.locod-ai.com
      - NEXT_PUBLIC_API_URL=https://logen.locod-ai.com/api
    
  frontend:
    environment:
      - NEXT_PUBLIC_API_URL=https://logen.locod-ai.com/api
      - NEXT_PUBLIC_APP_URL=https://logen.locod-ai.com
      - PRODUCTION_URL=https://logen.locod-ai.com
    
  nginx:
    volumes:
      - /etc/nginx/ssl/${DOMAIN}:/etc/nginx/ssl/${DOMAIN}:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    ports:
      - "443:443"
      - "80:80"
    environment:
      - SSL_DOMAIN=${DOMAIN}
EOF
    
    success "Docker-compose SSL configuration created"
}

# Deploy services with SSL
deploy_services_with_ssl() {
    log "Deploying services with SSL configuration..."
    
    cd "$PROJECT_DIR"
    
    # Stop any existing services
    info "Stopping existing services..."
    docker-compose -f $DOCKER_COMPOSE_FILE -f docker/docker-compose.logen-ssl.yml down || true
    
    # Build updated images
    info "Building Docker images with SSL support..."
    docker-compose -f $DOCKER_COMPOSE_FILE -f docker/docker-compose.logen-ssl.yml build --no-cache
    
    # Start services
    info "Starting services with SSL configuration..."
    docker-compose \
        --env-file "$ENV_FILE" \
        -f $DOCKER_COMPOSE_FILE \
        -f docker/docker-compose.logen-ssl.yml \
        up -d
    
    success "Services deployed with SSL"
}

# Comprehensive health checks
perform_health_checks() {
    log "Performing comprehensive health checks..."
    
    # Wait for services to start
    info "Waiting 60 seconds for services to fully initialize..."
    sleep 60
    
    # Check HTTP redirect
    info "Testing HTTP to HTTPS redirect..."
    local redirect_test=$(curl -s -o /dev/null -w "%{http_code}" "http://${DOMAIN}" || echo "000")
    if [[ "$redirect_test" == "301" ]] || [[ "$redirect_test" == "302" ]]; then
        success "HTTP to HTTPS redirect working"
    else
        warning "HTTP to HTTPS redirect not working (got ${redirect_test})"
    fi
    
    # Check HTTPS endpoints
    info "Testing HTTPS endpoints..."
    
    # Frontend health check
    if curl -k -f -s "https://${DOMAIN}" > /dev/null; then
        success "Frontend HTTPS endpoint accessible"
    else
        warning "Frontend HTTPS endpoint not accessible"
    fi
    
    # Backend API health check
    if curl -k -f -s "https://${DOMAIN}/api/health" > /dev/null; then
        success "Backend API HTTPS endpoint accessible"
    else
        warning "Backend API HTTPS endpoint not accessible"
    fi
    
    # Staff dashboard health check
    if curl -k -f -s "https://${DOMAIN}/staff" > /dev/null; then
        success "Staff dashboard HTTPS endpoint accessible"
    else
        warning "Staff dashboard HTTPS endpoint not accessible"
    fi
    
    # Admin dashboard health check
    if curl -k -f -s "https://${DOMAIN}/admin-dashboard" > /dev/null; then
        success "Admin dashboard HTTPS endpoint accessible"
    else
        warning "Admin dashboard HTTPS endpoint not accessible"
    fi
}

# SSL security validation
validate_ssl_security() {
    log "Validating SSL security configuration..."
    
    info "Testing SSL/TLS configuration..."
    
    # Test SSL connection
    if echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -text > /dev/null; then
        success "SSL connection test passed"
    else
        warning "SSL connection test failed"
    fi
    
    # Check certificate chain
    local cert_chain=$(echo | openssl s_client -servername "$DOMAIN" -connect "${DOMAIN}:443" 2>/dev/null | openssl x509 -noout -issuer)
    info "Certificate issuer: $cert_chain"
    
    # Check HSTS header
    local hsts_header=$(curl -s -I "https://${DOMAIN}" | grep -i "strict-transport-security" || echo "Not found")
    if [[ "$hsts_header" != "Not found" ]]; then
        success "HSTS header present: $hsts_header"
    else
        warning "HSTS header not found"
    fi
    
    # Security headers check
    info "Checking security headers..."
    local headers=$(curl -s -I "https://${DOMAIN}")
    
    echo "$headers" | grep -i "x-frame-options" && success "X-Frame-Options header present" || warning "X-Frame-Options header missing"
    echo "$headers" | grep -i "x-content-type-options" && success "X-Content-Type-Options header present" || warning "X-Content-Type-Options header missing"
    echo "$headers" | grep -i "x-xss-protection" && success "X-XSS-Protection header present" || warning "X-XSS-Protection header missing"
}

# Post-deployment monitoring setup
setup_monitoring() {
    log "Setting up post-deployment monitoring..."
    
    # Create monitoring script
    cat > "/usr/local/bin/monitor-logen-ssl.sh" << 'EOF'
#!/bin/bash
# SSL monitoring script for logen.locod-ai.com

DOMAIN="logen.locod-ai.com"
LOG_FILE="/var/log/ssl-monitoring.log"

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> $LOG_FILE
}

# Check certificate expiry
CERT_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect ${DOMAIN}:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
CURRENT_EPOCH=$(date +%s)
DAYS_UNTIL_EXPIRY=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
    log "WARNING: SSL certificate expires in $DAYS_UNTIL_EXPIRY days"
fi

# Check service health
if ! curl -s -f https://$DOMAIN/api/health > /dev/null; then
    log "ERROR: API health check failed"
fi

if ! curl -s -f https://$DOMAIN > /dev/null; then
    log "ERROR: Frontend health check failed"
fi

log "Health check completed - Certificate expires in $DAYS_UNTIL_EXPIRY days"
EOF
    
    chmod +x "/usr/local/bin/monitor-logen-ssl.sh"
    
    # Add to crontab for regular monitoring
    (crontab -l 2>/dev/null; echo "*/15 * * * * /usr/local/bin/monitor-logen-ssl.sh") | crontab -
    
    success "SSL monitoring configured (runs every 15 minutes)"
}

# Rollback function
rollback_deployment() {
    log "Rolling back deployment..."
    
    local backup_path=$(cat "/tmp/ssl_deployment_backup_path" 2>/dev/null || echo "")
    
    if [[ -n "$backup_path" ]] && [[ -d "$backup_path" ]]; then
        info "Restoring from backup: $backup_path"
        
        # Stop current services
        cd "$PROJECT_DIR"
        docker-compose -f $DOCKER_COMPOSE_FILE down || true
        
        # Restore nginx configuration
        if [[ -d "$backup_path/$NGINX_CONFIG_DIR" ]]; then
            cp -r "$backup_path/$NGINX_CONFIG_DIR"/* "$PROJECT_DIR/$NGINX_CONFIG_DIR/"
        fi
        
        # Restore environment files
        cp "$backup_path"/.env* "$PROJECT_DIR/" 2>/dev/null || true
        
        success "Configuration restored from backup"
    else
        warning "No backup path found, manual intervention required"
    fi
}

# Display deployment summary
display_deployment_summary() {
    log "=== Deployment Summary ==="
    
    info "Domain: https://${DOMAIN}"
    info "Services deployed:"
    info "  - Frontend: https://${DOMAIN}"
    info "  - Backend API: https://${DOMAIN}/api"
    info "  - Staff Dashboard: https://${DOMAIN}/staff"
    info "  - Admin Dashboard: https://${DOMAIN}/admin-dashboard"
    info "  - Health Check: https://${DOMAIN}/api/health"
    
    info "SSL Certificate:"
    local ssl_dir="/etc/nginx/ssl/${DOMAIN}"
    if [[ -f "${ssl_dir}/fullchain.pem" ]]; then
        local expiry=$(openssl x509 -in "${ssl_dir}/fullchain.pem" -noout -enddate | cut -d= -f2)
        info "  - Certificate expires: $expiry"
    fi
    
    info "Monitoring:"
    info "  - SSL monitoring enabled (every 15 minutes)"
    info "  - Log file: /var/log/ssl-monitoring.log"
    
    info "Next steps:"
    info "  1. Test all endpoints manually"
    info "  2. Run SSL Labs test: https://www.ssllabs.com/ssltest/analyze.html?d=${DOMAIN}"
    info "  3. Update DNS if needed"
    info "  4. Configure staff user accounts"
    info "  5. Monitor logs for any issues"
    
    success "SSL deployment completed for ${DOMAIN}"
}

# Cleanup function
cleanup() {
    rm -f "/tmp/ssl_deployment_backup_path" 2>/dev/null || true
}

# Signal handlers
trap cleanup EXIT
trap 'error "Deployment interrupted by user"; rollback_deployment; exit 1' INT TERM

# Main deployment process
main() {
    log "=== Starting SSL Production Deployment for ${DOMAIN} ==="
    log "Issue #61 - HTTPS/SSL Production Deployment"
    
    pre_deployment_safety_checks
    backup_existing_configs
    test_nginx_config
    generate_ssl_certificates
    update_docker_compose
    deploy_services_with_ssl
    perform_health_checks
    validate_ssl_security
    setup_monitoring
    display_deployment_summary
    
    success "=== SSL Deployment Completed Successfully ==="
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback_deployment
        ;;
    "health")
        perform_health_checks
        ;;
    "ssl-check")
        validate_ssl_security
        ;;
    "monitor")
        /usr/local/bin/monitor-logen-ssl.sh
        ;;
    "logs")
        cd "$PROJECT_DIR"
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
        ;;
    "status")
        cd "$PROJECT_DIR"
        docker-compose -f $DOCKER_COMPOSE_FILE ps
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|ssl-check|monitor|logs|status}"
        echo "  deploy    - Full SSL deployment process (default)"
        echo "  rollback  - Rollback to previous configuration"
        echo "  health    - Run health checks only"
        echo "  ssl-check - Validate SSL configuration"
        echo "  monitor   - Run monitoring check"
        echo "  logs      - Show service logs"
        echo "  status    - Show service status"
        exit 1
        ;;
esac