#!/bin/bash

# Production Deployment Script for Website Generator v2
# This script handles the complete production deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/root/website-generator/v2"
DOCKER_COMPOSE_FILE="docker/docker-compose.prod.yml"
ENV_FILE=".env"
BACKUP_DIR="/backups/website-generator"
LOG_FILE="/var/log/deployment.log"

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

# Pre-deployment checks
pre_deployment_checks() {
    log "Starting pre-deployment checks..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check if project directory exists
    if [[ ! -d "$PROJECT_DIR" ]]; then
        error "Project directory does not exist: $PROJECT_DIR"
    fi
    
    # Check if environment file exists
    if [[ ! -f "$PROJECT_DIR/$ENV_FILE" ]]; then
        warning "Environment file not found. Creating from template..."
        cp "$PROJECT_DIR/.env.production" "$PROJECT_DIR/$ENV_FILE"
        warning "Please update the environment variables in $PROJECT_DIR/$ENV_FILE"
        warning "Especially: POSTGRES_PASSWORD, JWT_SECRET, GRAFANA_PASSWORD"
    fi
    
    success "Pre-deployment checks completed"
}

# Create SSL certificates
create_ssl_certificates() {
    log "Creating SSL certificates..."
    
    cd "$PROJECT_DIR/docker/nginx"
    
    if [[ ! -f "ssl/cert.pem" ]] || [[ ! -f "ssl/key.pem" ]]; then
        info "Generating SSL certificates..."
        chmod +x generate-ssl.sh
        ./generate-ssl.sh
        success "SSL certificates generated"
    else
        info "SSL certificates already exist"
    fi
}

# Create backup
create_backup() {
    log "Creating backup before deployment..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    local backup_path="$BACKUP_DIR/$(date +%Y%m%d_%H%M%S)"
    
    # Backup database if running
    if docker ps | grep -q "locod-postgres-prod"; then
        info "Backing up database..."
        docker exec locod-postgres-prod pg_dump -U locod_user locod_prod > "$backup_path/database.sql"
        success "Database backup created"
    fi
    
    # Backup configuration files
    cp -r "$PROJECT_DIR/docker" "$backup_path/"
    cp "$PROJECT_DIR/$ENV_FILE" "$backup_path/"
    
    success "Backup created at $backup_path"
}

# Stop existing services
stop_services() {
    log "Stopping existing services..."
    
    cd "$PROJECT_DIR"
    
    if docker-compose -f $DOCKER_COMPOSE_FILE ps | grep -q "Up"; then
        docker-compose -f $DOCKER_COMPOSE_FILE down
        success "Services stopped"
    else
        info "No running services found"
    fi
}

# Build and deploy
deploy_services() {
    log "Building and deploying services..."
    
    cd "$PROJECT_DIR"
    
    # Build images
    info "Building Docker images..."
    docker-compose -f $DOCKER_COMPOSE_FILE build --no-cache
    
    # Start services
    info "Starting services..."
    docker-compose -f $DOCKER_COMPOSE_FILE up -d
    
    success "Services deployed"
}

# Health checks
health_checks() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    for i in {1..10}; do
        if curl -f -s http://162.55.213.90:7600/api/health > /dev/null; then
            success "Backend health check passed"
            break
        else
            if [[ $i -eq 10 ]]; then
                error "Backend health check failed after 10 attempts"
            fi
            info "Backend health check attempt $i failed, retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    # Check frontend health
    for i in {1..10}; do
        if curl -f -s http://162.55.213.90:7601 > /dev/null; then
            success "Frontend health check passed"
            break
        else
            if [[ $i -eq 10 ]]; then
                error "Frontend health check failed after 10 attempts"
            fi
            info "Frontend health check attempt $i failed, retrying in 10 seconds..."
            sleep 10
        fi
    done
    
    # Check HTTPS endpoints
    if curl -k -f -s https://162.55.213.90/api/health > /dev/null; then
        success "HTTPS health check passed"
    else
        warning "HTTPS health check failed - check SSL configuration"
    fi
}

# Post-deployment tasks
post_deployment_tasks() {
    log "Performing post-deployment tasks..."
    
    # Clean up old Docker images
    info "Cleaning up old Docker images..."
    docker image prune -f
    
    # Display service status
    info "Service status:"
    docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" ps
    
    # Display logs
    info "Recent logs:"
    docker-compose -f "$PROJECT_DIR/$DOCKER_COMPOSE_FILE" logs --tail=20
    
    success "Post-deployment tasks completed"
}

# Main deployment process
main() {
    log "=== Starting Website Generator v2 Production Deployment ==="
    
    pre_deployment_checks
    create_ssl_certificates
    create_backup
    stop_services
    deploy_services
    health_checks
    post_deployment_tasks
    
    success "=== Deployment completed successfully ==="
    info "Frontend: http://162.55.213.90:7601 (Direct) | https://162.55.213.90:7643 (SSL)"
    info "Backend API: http://162.55.213.90:7600 (Direct) | https://162.55.213.90:7643/api (SSL)"
    info "API Documentation: http://162.55.213.90:7600/api/docs"
    info "Health Check: http://162.55.213.90:7600/api/health"
    info "Monitoring: http://162.55.213.90:7690 (Grafana)"
    info "Metrics: http://162.55.213.90:7691 (Prometheus)"
}

# Parse command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        create_backup
        ;;
    "health")
        health_checks
        ;;
    "logs")
        cd "$PROJECT_DIR"
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
        ;;
    "status")
        cd "$PROJECT_DIR"
        docker-compose -f $DOCKER_COMPOSE_FILE ps
        ;;
    "stop")
        stop_services
        ;;
    *)
        echo "Usage: $0 {deploy|backup|health|logs|status|stop}"
        echo "  deploy - Full deployment process (default)"
        echo "  backup - Create backup only"
        echo "  health - Run health checks only"
        echo "  logs   - Show service logs"
        echo "  status - Show service status"
        echo "  stop   - Stop all services"
        exit 1
        ;;
esac