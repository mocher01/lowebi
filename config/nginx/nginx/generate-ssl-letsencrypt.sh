#!/bin/bash

# Let's Encrypt SSL Certificate Generation for logen.locod-ai.com
# Issue #61 - HTTPS/SSL Production Deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="logen.locod-ai.com"
EMAIL="admin@locod-ai.com"  # Update with actual email
SSL_DIR="/etc/nginx/ssl/${DOMAIN}"
CERTBOT_DIR="/etc/letsencrypt"
WEBROOT_PATH="/var/www/certbot"

# Functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

error() {
    echo -e "${RED}ERROR: $1${NC}"
    exit 1
}

success() {
    echo -e "${GREEN}SUCCESS: $1${NC}"
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}INFO: $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites for SSL certificate generation..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
    
    # Check if certbot is installed
    if ! command -v certbot &> /dev/null; then
        info "Installing certbot..."
        if command -v apt-get &> /dev/null; then
            apt-get update
            apt-get install -y certbot
        elif command -v yum &> /dev/null; then
            yum install -y certbot
        else
            error "Package manager not found. Please install certbot manually."
        fi
    fi
    
    # Create SSL directory
    mkdir -p "$SSL_DIR"
    mkdir -p "$WEBROOT_PATH"
    
    success "Prerequisites check completed"
}

# Generate temporary nginx configuration for ACME challenge
create_temp_nginx_config() {
    log "Creating temporary nginx configuration for ACME challenge..."
    
    cat > /tmp/nginx-acme-challenge.conf << EOF
events {
    worker_connections 1024;
}

http {
    server {
        listen 80;
        server_name ${DOMAIN};
        
        location /.well-known/acme-challenge/ {
            root ${WEBROOT_PATH};
        }
        
        location / {
            return 444;  # Close connection without response
        }
    }
}
EOF
    
    success "Temporary nginx configuration created"
}

# Stop existing nginx if running
stop_existing_nginx() {
    log "Stopping existing nginx if running..."
    
    if systemctl is-active --quiet nginx; then
        systemctl stop nginx
        info "Nginx stopped"
    elif docker ps | grep -q nginx; then
        warning "Docker nginx containers found. Please stop them manually before running this script."
        warning "Run: docker stop \$(docker ps -q --filter ancestor=nginx)"
        error "Cannot proceed with Docker nginx running"
    else
        info "No nginx service found running"
    fi
}

# Start temporary nginx for ACME challenge
start_temp_nginx() {
    log "Starting temporary nginx for ACME challenge..."
    
    nginx -t -c /tmp/nginx-acme-challenge.conf
    nginx -c /tmp/nginx-acme-challenge.conf
    
    # Wait for nginx to start
    sleep 5
    
    if ! pgrep nginx > /dev/null; then
        error "Failed to start temporary nginx"
    fi
    
    success "Temporary nginx started"
}

# Generate SSL certificate using Let's Encrypt
generate_ssl_certificate() {
    log "Generating SSL certificate for ${DOMAIN}..."
    
    # Run certbot
    certbot certonly \
        --webroot \
        --webroot-path="$WEBROOT_PATH" \
        --email "$EMAIL" \
        --agree-tos \
        --non-interactive \
        --expand \
        -d "$DOMAIN"
    
    if [[ $? -ne 0 ]]; then
        error "Failed to generate SSL certificate"
    fi
    
    success "SSL certificate generated successfully"
}

# Copy certificates to nginx SSL directory
copy_certificates() {
    log "Copying certificates to nginx SSL directory..."
    
    # Copy certificate files
    cp "${CERTBOT_DIR}/live/${DOMAIN}/fullchain.pem" "${SSL_DIR}/fullchain.pem"
    cp "${CERTBOT_DIR}/live/${DOMAIN}/privkey.pem" "${SSL_DIR}/privkey.pem"
    
    # Set proper permissions
    chmod 644 "${SSL_DIR}/fullchain.pem"
    chmod 600 "${SSL_DIR}/privkey.pem"
    chown root:root "${SSL_DIR}/"*
    
    success "Certificates copied to ${SSL_DIR}"
}

# Stop temporary nginx
stop_temp_nginx() {
    log "Stopping temporary nginx..."
    
    pkill nginx || true
    rm -f /tmp/nginx-acme-challenge.conf
    
    success "Temporary nginx stopped"
}

# Setup certificate auto-renewal
setup_auto_renewal() {
    log "Setting up certificate auto-renewal..."
    
    # Create renewal script
    cat > "/etc/cron.d/letsencrypt-${DOMAIN}" << EOF
# Let's Encrypt certificate renewal for ${DOMAIN}
# Runs twice daily at random minutes
$(shuf -i 0-59 -n 1) $(shuf -i 0-23 -n 1),$(shuf -i 0-23 -n 1) * * * root /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx 2>/dev/null || docker exec locod-nginx-prod nginx -s reload 2>/dev/null || true"
EOF
    
    # Test renewal
    certbot renew --dry-run
    
    if [[ $? -eq 0 ]]; then
        success "Certificate auto-renewal configured successfully"
    else
        warning "Certificate auto-renewal test failed"
    fi
}

# Validate SSL certificate
validate_certificate() {
    log "Validating SSL certificate..."
    
    if [[ -f "${SSL_DIR}/fullchain.pem" ]] && [[ -f "${SSL_DIR}/privkey.pem" ]]; then
        info "Certificate files found:"
        info "  - Fullchain: ${SSL_DIR}/fullchain.pem"
        info "  - Private key: ${SSL_DIR}/privkey.pem"
        
        # Check certificate validity
        openssl x509 -in "${SSL_DIR}/fullchain.pem" -text -noout | grep -E "(Subject:|Issuer:|Not Before|Not After)"
        
        success "SSL certificate validation completed"
    else
        error "SSL certificate files not found"
    fi
}

# Create backup of old certificates
backup_old_certificates() {
    log "Creating backup of old certificates if they exist..."
    
    if [[ -f "${SSL_DIR}/fullchain.pem" ]]; then
        BACKUP_DIR="${SSL_DIR}/backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp "${SSL_DIR}/"*.pem "$BACKUP_DIR/" 2>/dev/null || true
        info "Old certificates backed up to ${BACKUP_DIR}"
    fi
}

# Main execution
main() {
    log "=== Starting Let's Encrypt SSL Certificate Generation for ${DOMAIN} ==="
    log "Issue #61 - HTTPS/SSL Production Deployment"
    
    check_prerequisites
    backup_old_certificates
    create_temp_nginx_config
    stop_existing_nginx
    start_temp_nginx
    generate_ssl_certificate
    copy_certificates
    stop_temp_nginx
    setup_auto_renewal
    validate_certificate
    
    success "=== SSL Certificate Generation Completed Successfully ==="
    info "Certificate files are ready at: ${SSL_DIR}"
    info "Next steps:"
    info "1. Start your nginx with the updated configuration"
    info "2. Test HTTPS access to https://${DOMAIN}"
    info "3. Run SSL Labs test for security validation"
    info "4. Monitor auto-renewal with: certbot certificates"
}

# Parse command line arguments
case "${1:-generate}" in
    "generate")
        main
        ;;
    "renew")
        log "Renewing certificate for ${DOMAIN}..."
        certbot renew --cert-name "$DOMAIN"
        copy_certificates
        success "Certificate renewed"
        ;;
    "validate")
        validate_certificate
        ;;
    "test-renewal")
        certbot renew --dry-run
        ;;
    *)
        echo "Usage: $0 {generate|renew|validate|test-renewal}"
        echo "  generate     - Generate new SSL certificate (default)"
        echo "  renew        - Renew existing certificate"
        echo "  validate     - Validate existing certificate"
        echo "  test-renewal - Test certificate renewal process"
        exit 1
        ;;
esac