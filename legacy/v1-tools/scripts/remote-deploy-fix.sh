#!/bin/bash

# Remote Deployment Fix Script
# This script can be executed on the server to fix the 502 Bad Gateway issue
# Usage: wget -O - https://raw.githubusercontent.com/user/repo/main/scripts/remote-deploy-fix.sh | bash

set -e

echo "🔧 Remote Deployment Fix Script for Portal v2.0"
echo "================================================"

# Configuration
PROJECT_DIR="/var/apps/website-generator/v2"
DOCKER_DIR="$PROJECT_DIR/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.prod.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to execute commands with error handling
execute_cmd() {
    local cmd="$1"
    local description="$2"
    
    print_status "$description"
    if eval "$cmd"; then
        print_success "$description completed"
    else
        print_error "$description failed"
        return 1
    fi
}

# Main deployment process
main() {
    print_status "Starting remote deployment fix..."
    
    # Step 1: Check if we're in the right environment
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Project directory not found: $PROJECT_DIR"
        print_status "Creating project structure..."
        mkdir -p "$PROJECT_DIR"
        cd "$PROJECT_DIR"
        
        # Clone the repository if it doesn't exist
        if [ ! -d ".git" ]; then
            print_status "Cloning repository..."
            git clone https://github.com/your-repo/website-generator.git .
        fi
    fi
    
    # Step 2: Navigate to project directory
    cd "$PROJECT_DIR" || {
        print_error "Cannot navigate to $PROJECT_DIR"
        exit 1
    }
    
    # Step 3: Pull latest changes
    execute_cmd "git fetch origin main" "Fetching latest changes from repository"
    execute_cmd "git reset --hard origin/main" "Resetting to latest commit (f9231ce)"
    
    # Step 4: Check Docker and Docker Compose
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Step 5: Stop existing services gracefully
    print_status "Stopping existing services..."
    if docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        docker-compose -f "$COMPOSE_FILE" down || true
    fi
    
    # Step 6: Clean up old containers and images
    print_status "Cleaning up old containers and images..."
    docker container prune -f || true
    docker image prune -f || true
    
    # Step 7: Rebuild services with updated port configuration
    print_status "Building services with corrected port configuration..."
    execute_cmd "docker-compose -f $COMPOSE_FILE build --no-cache" "Building Docker images"
    
    # Step 8: Start services
    print_status "Starting services..."
    execute_cmd "docker-compose -f $COMPOSE_FILE up -d" "Starting all services"
    
    # Step 9: Wait for services to be healthy
    print_status "Waiting for services to become healthy..."
    
    # Wait for backend
    for i in {1..30}; do
        if curl -f -s http://localhost:7600/api/health > /dev/null 2>&1; then
            print_success "Backend is healthy on port 7600"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend failed to become healthy"
            docker-compose -f "$COMPOSE_FILE" logs backend
            exit 1
        fi
        sleep 2
    done
    
    # Wait for frontend
    for i in {1..30}; do
        if curl -f -s http://localhost:7601 > /dev/null 2>&1; then
            print_success "Frontend is healthy on port 7601"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Frontend failed to become healthy"
            docker-compose -f "$COMPOSE_FILE" logs frontend
            exit 1
        fi
        sleep 2
    done
    
    # Step 10: Test the complete service stack
    print_status "Testing complete service stack..."
    
    # Test through domain
    if curl -f -s -I https://logen.locod-ai.com/ > /dev/null 2>&1; then
        print_success "Portal v2.0 is accessible via https://logen.locod-ai.com"
        
        # Check for actual content
        content=$(curl -s https://logen.locod-ai.com/ | head -n 20)
        if echo "$content" | grep -q -E "(Portal|Website Generator|React|Next)" ; then
            print_success "Portal v2.0 is serving correct content"
        else
            print_warning "Portal is responding but content might not be Portal v2.0"
        fi
    else
        print_error "Portal is still not accessible via domain"
        
        # Additional debugging
        print_status "Testing individual services..."
        curl -I http://localhost:7600/api/health || print_error "Backend test failed"
        curl -I http://localhost:7601/ || print_error "Frontend test failed"
        
        print_status "Checking nginx configuration..."
        docker-compose -f "$COMPOSE_FILE" exec nginx nginx -t || print_error "Nginx config test failed"
    fi
    
    # Step 11: Display final status
    print_status "Final service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    print_status "Service endpoints:"
    echo "  ✅ Backend: http://162.55.213.90:7600/api/health"
    echo "  ✅ Frontend: http://162.55.213.90:7601/"
    echo "  🌐 Portal: https://logen.locod-ai.com/"
    
    print_success "Deployment completed successfully!"
    print_status "If issues persist, check logs with: docker-compose -f $COMPOSE_FILE logs -f"
}

# Run the main function
main "$@"

echo "================================================"
echo "🎉 Remote deployment fix completed!"
echo "Check https://logen.locod-ai.com to verify Portal v2.0 is working"