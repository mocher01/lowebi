#!/bin/bash
# LOGEN Quick Deploy Script
# Reliable, fast deployment without timeouts
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC}  [$timestamp] $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC}  [$timestamp] $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} [$timestamp] $message" ;;
        *) echo "[$timestamp] $message" ;;
    esac
}

# Main deployment function
deploy_service() {
    local service="${1:-customer-frontend}"
    local env="${2:-prod}"
    
    log "INFO" "Starting quick deployment for $service in $env environment"
    
    # Navigate to the correct docker compose directory
    cd "$PROJECT_ROOT/config/docker/$env"
    
    # Stop existing container
    log "INFO" "Stopping existing container..."
    docker-compose stop "$service" 2>/dev/null || true
    docker-compose rm -f "$service" 2>/dev/null || true
    
    # Remove old image to force rebuild
    local image_name="logen-${service}:${env}"
    log "INFO" "Removing old image: $image_name"
    docker rmi "$image_name" 2>/dev/null || true
    
    # Build new image (no timeout, let it complete, force no cache)
    log "INFO" "Building new image with no cache... (this may take 2-3 minutes)"
    if docker-compose build --no-cache "$service"; then
        log "INFO" "Build completed successfully"
    else
        log "ERROR" "Build failed"
        exit 1
    fi
    
    # Start the new container
    log "INFO" "Starting new container..."
    if docker-compose up -d --no-deps "$service"; then
        log "INFO" "Container started successfully"
    else
        log "WARN" "docker-compose up failed, trying direct docker run..."
        
        # Fallback to direct docker run
        case "$service" in
            "customer-frontend")
                docker run -d \
                    --name "logen-customer-frontend-prod" \
                    --network "logen-network-prod" \
                    -p "7601:7601" \
                    -e NODE_ENV=production \
                    -e NEXT_PUBLIC_API_URL=http://162.55.213.90:7600/api \
                    --restart unless-stopped \
                    "$image_name"
                ;;
            "admin-frontend")
                docker run -d \
                    --name "logen-admin-frontend-prod" \
                    --network "logen-network-prod" \
                    -p "7602:7602" \
                    -e NODE_ENV=production \
                    -e NEXT_PUBLIC_API_URL=http://162.55.213.90:7600/api \
                    --restart unless-stopped \
                    "$image_name"
                ;;
            "backend")
                docker run -d \
                    --name "logen-backend-prod" \
                    --network "logen-network-prod" \
                    -p "7600:7600" \
                    -e NODE_ENV=production \
                    -e PORT=7600 \
                    -e DB_HOST=162.55.213.90 \
                    -e DB_PORT=7633 \
                    -e DB_USERNAME=locod_user \
                    -e DB_PASSWORD=locod_pass_2024 \
                    -e DB_DATABASE=locod_db \
                    --restart unless-stopped \
                    "$image_name"
                ;;
        esac
    fi
    
    # Wait for health check
    log "INFO" "Waiting for service to be healthy..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if docker ps | grep -q "${service}.*healthy"; then
            log "INFO" "✅ Service is healthy!"
            break
        fi
        
        # Also check if container is at least running
        if docker ps | grep -q "${service}"; then
            log "INFO" "Container is running (attempt $attempt/$max_attempts)..."
        else
            log "ERROR" "Container not running!"
            docker ps -a | grep "${service}" || true
            exit 1
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    # Show final status
    log "INFO" "Deployment complete! Checking status..."
    docker ps | grep "logen-${service}-${env}" || log "WARN" "Container not found in docker ps"
    
    # Test the endpoint
    case "$service" in
        "customer-frontend")
            if curl -s -o /dev/null -w "%{http_code}" http://162.55.213.90:7601/ | grep -q "200"; then
                log "INFO" "✅ Customer frontend is responding on port 7601"
            else
                log "WARN" "⚠️ Customer frontend not responding yet"
            fi
            ;;
        "admin-frontend")
            if curl -s -o /dev/null -w "%{http_code}" http://162.55.213.90:7602/ | grep -q "200"; then
                log "INFO" "✅ Admin frontend is responding on port 7602"
            else
                log "WARN" "⚠️ Admin frontend not responding yet"
            fi
            ;;
        "backend")
            if curl -s -o /dev/null -w "%{http_code}" http://162.55.213.90:7600/api/health | grep -q "200"; then
                log "INFO" "✅ Backend is responding on port 7600"
            else
                log "WARN" "⚠️ Backend not responding yet"
            fi
            ;;
    esac
    
    log "INFO" "🚀 Deployment of $service completed successfully!"
}

# Main execution
if [ $# -eq 0 ]; then
    echo "Usage: $0 <service> [env]"
    echo "Services: customer-frontend, admin-frontend, backend"
    echo "Environments: prod (default), dev"
    exit 1
fi

deploy_service "$@"