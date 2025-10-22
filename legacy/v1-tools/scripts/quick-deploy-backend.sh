#!/bin/bash

# Quick Backend Deployment Script for Issue #61
# This script quickly deploys the fixed backend on port 7600

set -e

# Configuration
PROJECT_DIR="/var/apps/website-generator/v2"
BACKEND_DIR="$PROJECT_DIR/backend"
LOG_FILE="/var/log/quick-backend-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

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

info() {
    echo -e "${BLUE}INFO: $1${NC}" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}WARNING: $1${NC}" | tee -a $LOG_FILE
}

# Check if we're in the right directory
check_environment() {
    log "Checking deployment environment..."
    
    if [[ ! -d "$PROJECT_DIR" ]]; then
        error "Project directory not found: $PROJECT_DIR"
    fi
    
    if [[ ! -d "$BACKEND_DIR" ]]; then
        error "Backend directory not found: $BACKEND_DIR"
    fi
    
    cd "$BACKEND_DIR"
    
    if [[ ! -f "package.json" ]]; then
        error "package.json not found in backend directory"
    fi
    
    success "Environment check passed"
}

# Stop existing backend process
stop_existing_backend() {
    log "Stopping existing backend processes..."
    
    # Kill any existing Node.js processes running on port 7600
    if lsof -ti:7600; then
        info "Found processes on port 7600, stopping them..."
        kill -9 $(lsof -ti:7600) || true
        sleep 2
    fi
    
    # Stop PM2 processes if they exist
    if command -v pm2 &> /dev/null; then
        pm2 stop website-generator-backend || true
        pm2 delete website-generator-backend || true
    fi
    
    success "Stopped existing backend processes"
}

# Install dependencies and build
build_backend() {
    log "Installing dependencies and building backend..."
    
    cd "$BACKEND_DIR"
    
    # Install dependencies
    info "Installing Node.js dependencies..."
    npm ci --only=production
    
    # Install dev dependencies needed for build
    info "Installing dev dependencies for build..."
    npm ci
    
    # Build the application
    info "Building NestJS application..."
    npm run build
    
    if [[ ! -d "dist" ]]; then
        error "Build failed - dist directory not found"
    fi
    
    success "Backend build completed"
}

# Setup environment
setup_environment() {
    log "Setting up production environment..."
    
    cd "$BACKEND_DIR"
    
    # Create production environment file if it doesn't exist
    if [[ ! -f ".env" ]]; then
        info "Creating production environment file..."
        cat > .env << 'EOF'
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=locod_user
DATABASE_PASSWORD=locod_pass_2024
DATABASE_NAME=locod_db

# JWT Configuration
JWT_SECRET=production-jwt-secret-change-me-2024
JWT_EXPIRATION=15m
REFRESH_TOKEN_SECRET=production-refresh-secret-2024
REFRESH_TOKEN_EXPIRATION=7d

# Security Configuration
BCRYPT_ROUNDS=12

# Application Configuration
NODE_ENV=production
PORT=7600
HTTPS_ENABLED=false
EOF
        warning "Created default .env file - please update secrets for production"
    fi
    
    success "Environment setup completed"
}

# Start backend
start_backend() {
    log "Starting backend on port 7600..."
    
    cd "$BACKEND_DIR"
    
    # Set the port explicitly
    export PORT=7600
    
    if command -v pm2 &> /dev/null; then
        info "Starting with PM2..."
        pm2 start dist/main.js --name "website-generator-backend" --env production
        pm2 save
    else
        info "Starting with nohup..."
        nohup node dist/main.js > /var/log/backend.log 2>&1 &
        echo $! > /var/run/backend.pid
    fi
    
    success "Backend started"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for the application to start
    sleep 10
    
    for i in {1..10}; do
        if curl -f -s http://localhost:7600/api/health > /dev/null; then
            success "Backend health check passed"
            break
        else
            if [[ $i -eq 10 ]]; then
                error "Backend health check failed after 10 attempts"
            fi
            info "Health check attempt $i failed, retrying in 5 seconds..."
            sleep 5
        fi
    done
    
    # Show the backend status
    info "Backend status:"
    if command -v pm2 &> /dev/null; then
        pm2 list
    else
        ps aux | grep node | grep -v grep
    fi
}

# Test endpoints
test_endpoints() {
    log "Testing key endpoints..."
    
    # Test health endpoint
    if curl -f -s http://localhost:7600/api/health; then
        success "Health endpoint working"
    else
        warning "Health endpoint test failed"
    fi
    
    # Test API docs
    if curl -f -s http://localhost:7600/api/docs > /dev/null; then
        success "API documentation endpoint working"
    else
        warning "API docs endpoint test failed"
    fi
    
    # Test auth endpoints exist (should return 400/401, not 404)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:7600/auth/login)
    if [[ $http_code != "404" ]]; then
        success "Auth endpoints available (HTTP $http_code)"
    else
        warning "Auth endpoints may not be working (HTTP $http_code)"
    fi
}

# Main execution
main() {
    log "=== Quick Backend Deployment Started ==="
    
    check_environment
    stop_existing_backend
    build_backend
    setup_environment
    start_backend
    health_check
    test_endpoints
    
    success "=== Backend Deployment Completed ==="
    info "Backend URL: http://162.55.213.90:7600"
    info "API Documentation: http://162.55.213.90:7600/api/docs"
    info "Health Check: http://162.55.213.90:7600/api/health"
    info "Logs: tail -f /var/log/backend.log"
    
    if command -v pm2 &> /dev/null; then
        info "PM2 Status: pm2 status"
        info "PM2 Logs: pm2 logs website-generator-backend"
    fi
}

# Execute main function
main "$@"