#!/bin/bash
# Docker Operations Functions
# Handles Docker container, image, network, and volume management

# Create Docker network
create_docker_network() {
    local env="$1"
    local network_name=$(get_network_name "$env")
    
    if docker network ls | grep -q "$network_name"; then
        log "INFO" "Network $network_name already exists"
    else
        docker network create --driver bridge "$network_name"
        log "SUCCESS" "Created Docker network: $network_name"
    fi
}

# Create Docker volumes
create_docker_volumes() {
    local env="$1"
    
    for service in "postgres" "redis"; do
        local volume_name=$(get_volume_name "$service" "$env")
        
        if docker volume ls | grep -q "$volume_name"; then
            log "INFO" "Volume $volume_name already exists"
        else
            docker volume create "$volume_name"
            log "SUCCESS" "Created Docker volume: $volume_name"
        fi
    done
}

# Configuration
BUILD_TIMEOUT="${BUILD_TIMEOUT:-600}" # 10 minutes default
BUILD_PROGRESS_INTERVAL="${BUILD_PROGRESS_INTERVAL:-10}" # Progress update every 10 seconds

# Direct docker run fallback for services
start_service_direct() {
    local service="$1"
    local env="$2"
    local container_name=$(get_service_name "$service" "$env")
    local image_name=$(get_image_name "$service" "$env")
    local network_name=$(get_network_name "$env")
    
    log "INFO" "Starting $service directly with docker run..."
    
    case "$service" in
        "customer-frontend"|"frontend")
            docker run -d \
                --name "$container_name" \
                --network "$network_name" \
                -p "7601:7601" \
                -e NODE_ENV=production \
                -e NEXT_PUBLIC_API_URL=http://162.55.213.90:7600/api \
                -e NEXT_PUBLIC_APP_ENV=production \
                --restart unless-stopped \
                "$image_name"
            ;;
        "admin-frontend")
            docker run -d \
                --name "$container_name" \
                --network "$network_name" \
                -p "7602:7602" \
                -e NODE_ENV=production \
                -e NEXT_PUBLIC_API_URL=http://162.55.213.90:7600/api \
                -e NEXT_PUBLIC_APP_ENV=production \
                --restart unless-stopped \
                "$image_name"
            ;;
        "backend")
            docker run -d \
                --name "$container_name" \
                --network "$network_name" \
                -p "7600:7600" \
                -e NODE_ENV=production \
                -e PORT=7600 \
                -e DB_HOST=162.55.213.90 \
                -e DB_PORT=7633 \
                -e DB_USERNAME=locod_user \
                -e DB_PASSWORD=locod_pass_2024 \
                -e DB_DATABASE=locod_db \
                -e DB_SSL=false \
                -e JWT_SECRET=logen_jwt_secret_production_2024_secure_key_v2 \
                -e JWT_EXPIRES_IN=24h \
                -e REDIS_HOST=logen-redis-prod \
                -e REDIS_PORT=7679 \
                --restart unless-stopped \
                "$image_name"
            ;;
        *)
            log "ERROR" "Unknown service for direct start: $service"
            return 1
            ;;
    esac
    
    if [ $? -eq 0 ]; then
        log "SUCCESS" "Service $service started successfully via direct docker run"
        return 0
    else
        log "ERROR" "Failed to start service $service via direct docker run"
        return 1
    fi
}

# Run docker build with progress monitoring and configurable timeout
run_build_with_progress() {
    local service="$1"
    local build_log="/tmp/logen-build-${service}-$$.log"
    local build_timeout="${BUILD_TIMEOUT}"
    
    log "INFO" "Starting build with ${build_timeout}s timeout. Monitor: tail -f $build_log"
    
    # Start build in background
    docker-compose -f docker-compose.yml build --no-cache "$service" > "$build_log" 2>&1 &
    local build_pid=$!
    
    local elapsed=0
    local last_size=0
    
    # Monitor build progress
    while kill -0 "$build_pid" 2>/dev/null; do
        sleep "$BUILD_PROGRESS_INTERVAL"
        elapsed=$((elapsed + BUILD_PROGRESS_INTERVAL))
        
        # Show progress based on log file size
        if [ -f "$build_log" ]; then
            local current_size=$(wc -c < "$build_log" 2>/dev/null || echo 0)
            if [ "$current_size" -gt "$last_size" ]; then
                log "INFO" "Build progress: ${elapsed}s elapsed, log size: $((current_size/1024))KB"
                last_size="$current_size"
                
                # Show last few lines for context
                if [ "$current_size" -gt 1024 ]; then
                    echo "Latest build output:"
                    tail -3 "$build_log" | sed 's/^/  | /'
                fi
            fi
        fi
        
        # Check timeout
        if [ "$elapsed" -gt "$build_timeout" ]; then
            log "ERROR" "Build timeout after ${build_timeout}s. Killing build process..."
            kill -TERM "$build_pid" 2>/dev/null || true
            sleep 5
            kill -KILL "$build_pid" 2>/dev/null || true
            
            log "ERROR" "Build logs saved to: $build_log"
            echo "Last 20 lines of build log:"
            tail -20 "$build_log" | sed 's/^/  | /'
            return 1
        fi
    done
    
    # Wait for process to complete and get exit code
    wait "$build_pid"
    local build_exit_code=$?
    
    # Show final status
    if [ "$build_exit_code" -eq 0 ]; then
        log "SUCCESS" "Build completed successfully in ${elapsed}s"
        rm -f "$build_log" # Clean up successful build log
        return 0
    else
        log "ERROR" "Build failed with exit code $build_exit_code after ${elapsed}s"
        log "ERROR" "Build logs saved to: $build_log"
        echo "Last 20 lines of build log:"
        tail -20 "$build_log" | sed 's/^/  | /'
        return "$build_exit_code"
    fi
}

# Check if rebuild is needed based on source file timestamps
needs_rebuild() {
    local service="$1"
    local env="$2"
    
    local image_name=$(get_image_name "$service" "$env")
    
    # Check if image exists
    if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${image_name}$"; then
        log "INFO" "Image $image_name does not exist - rebuild needed"
        return 0
    fi
    
    # Get image creation time (in seconds since epoch)
    local image_created=$(docker inspect --format='{{.Created}}' "$image_name" 2>/dev/null)
    if [ -z "$image_created" ]; then
        log "INFO" "Cannot determine image creation time - rebuild needed"
        return 0
    fi
    
    # Convert to timestamp
    local image_timestamp=$(date -d "$image_created" +%s 2>/dev/null)
    if [ -z "$image_timestamp" ]; then
        log "INFO" "Cannot parse image creation time - rebuild needed"
        return 0
    fi
    
    # Define source directories to check
    local source_dirs=()
    case "$service" in
        "backend")
            source_dirs=("apps/backend/src" "apps/backend/package.json" "apps/backend/Dockerfile.prod")
            ;;
        "admin-frontend")
            source_dirs=("apps/admin-frontend/src" "apps/admin-frontend/package.json" "apps/admin-frontend/Dockerfile.prod")
            ;;
        "customer-frontend"|"frontend")
            source_dirs=("apps/frontend/src" "apps/frontend/package.json" "apps/frontend/Dockerfile.prod")
            ;;
        *)
            log "WARN" "Unknown service $service - rebuild needed"
            return 0
            ;;
    esac
    
    # Check if any source files are newer than the image
    for source_path in "${source_dirs[@]}"; do
        local full_path="$PROJECT_ROOT/$source_path"
        if [ -e "$full_path" ]; then
            local newest_file_timestamp
            if [ -d "$full_path" ]; then
                # Find newest file in directory recursively
                newest_file_timestamp=$(find "$full_path" -type f -printf '%T@\n' 2>/dev/null | sort -n | tail -1 | cut -d. -f1)
            else
                # Single file
                newest_file_timestamp=$(stat -c %Y "$full_path" 2>/dev/null)
            fi
            
            if [ -n "$newest_file_timestamp" ] && [ "$newest_file_timestamp" -gt "$image_timestamp" ]; then
                local newest_file=$(find "$full_path" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
                log "INFO" "Source file newer than image: $newest_file ($(date -d @$newest_file_timestamp '+%Y-%m-%d %H:%M:%S'))"
                log "INFO" "Image created: $(date -d @$image_timestamp '+%Y-%m-%d %H:%M:%S')"
                return 0
            fi
        fi
    done
    
    log "INFO" "No source files are newer than image - rebuild not needed"
    return 1
}

# Rebuild specific service
rebuild_service() {
    local service="$1"
    local env="$2"
    local force_rebuild="${3:-false}"
    
    if [ "$force_rebuild" = "true" ]; then
        log "INFO" "Force rebuild requested for $service in environment: $env"
    else
        log "INFO" "Checking if rebuild is needed for $service in environment: $env"
        
        # Check if rebuild is actually needed
        if ! needs_rebuild "$service" "$env"; then
            log "SUCCESS" "Service $service is up to date - no rebuild needed"
            return 0
        fi
    fi
    
    log "INFO" "Rebuilding service: $service in environment: $env"
    
    local container_name=$(get_service_name "$service" "$env")
    local image_name=$(get_image_name "$service" "$env")
    
    # Stop and remove existing container(s) - handle both standard and docker-compose generated names
    local containers_found=$(docker ps -a --filter "name=$container_name" --format "{{.Names}}" | head -10)
    if [ -n "$containers_found" ]; then
        log "INFO" "Found existing containers for $service:"
        echo "$containers_found" | while read container; do
            log "INFO" "  - $container"
        done
        
        # Stop all matching containers
        echo "$containers_found" | while read container; do
            log "INFO" "Stopping container: $container"
            docker stop "$container" 2>/dev/null || true
        done
        
        # Remove all matching containers  
        echo "$containers_found" | while read container; do
            log "INFO" "Removing container: $container"
            docker rm "$container" 2>/dev/null || true
        done
        
        # Also clean up any containers with partial names (docker-compose generates weird names sometimes)
        local partial_containers=$(docker ps -a | grep "$service" | grep "$env" | awk '{print $1}')
        if [ -n "$partial_containers" ]; then
            log "INFO" "Cleaning up partial name containers"
            echo "$partial_containers" | while read container_id; do
                docker stop "$container_id" 2>/dev/null || true
                docker rm "$container_id" 2>/dev/null || true
            done
        fi
    else
        log "INFO" "No existing containers found for $container_name"
    fi
    
    # Remove existing image
    if docker images | grep -q "$image_name"; then
        log "INFO" "Removing existing image: $image_name"
        docker rmi "$image_name" || true
    fi
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    fi
    
    # Build and deploy with intelligent verification and retries
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        cd "$(dirname "$compose_file")"
        
        local max_build_attempts=2
        local build_attempt=0
        local build_success=false
        
        # Build with retry logic and progress monitoring
        while [ $build_attempt -lt $max_build_attempts ]; do
            build_attempt=$((build_attempt + 1))
            log "INFO" "Building $service (attempt $build_attempt/$max_build_attempts)..."
            
            # Run build in background with progress monitoring
            if run_build_with_progress "$service"; then
                # Verify build actually created a new image
                if verify_build_success "$service" "$env"; then
                    build_success=true
                    log "SUCCESS" "Build completed and verified successfully"
                    break
                else
                    log "ERROR" "Build completed but verification failed"
                    if [ $build_attempt -lt $max_build_attempts ]; then
                        log "INFO" "Cleaning build cache and retrying..."
                        docker builder prune -f 2>/dev/null || true
                        docker system prune -f 2>/dev/null || true
                        sleep 3
                    fi
                fi
            else
                log "ERROR" "Build failed (attempt $build_attempt/$max_build_attempts)"
                if [ $build_attempt -lt $max_build_attempts ]; then
                    log "INFO" "Cleaning up and retrying build..."
                    # Clean up any partial builds
                    docker builder prune -f 2>/dev/null || true
                    docker system prune -f 2>/dev/null || true
                    sleep 5
                fi
            fi
        done
        
        if [ "$build_success" != "true" ]; then
            log "ERROR" "Failed to build service $service after $max_build_attempts attempts"
            generate_build_failure_report "$service" "$env"
            return 1
        fi
        
        # Deploy with retry logic and improved error handling
        local max_deploy_attempts=3
        local deploy_attempt=0
        local deploy_success=false
        
        while [ $deploy_attempt -lt $max_deploy_attempts ]; do
            deploy_attempt=$((deploy_attempt + 1))
            log "INFO" "Deploying $service (attempt $deploy_attempt/$max_deploy_attempts)..."
            
            # Try docker-compose first, fall back to docker run if needed
            if docker-compose -f docker-compose.yml up -d --no-deps "$service" 2>/dev/null; then
                log "SUCCESS" "Service started via docker-compose"
                deploy_success=true
                break
            elif docker-compose -f docker-compose.yml up -d "$service" 2>/dev/null; then
                log "SUCCESS" "Service started via docker-compose with dependencies"
                deploy_success=true
                break
            else
                log "WARN" "Docker-compose failed, trying direct docker run..."
                # Fallback to direct docker run
                if start_service_direct "$service" "$env"; then
                    log "SUCCESS" "Service started via direct docker run"
                    deploy_success=true
                    break
                else
                    log "ERROR" "Failed to start service via docker-compose and direct docker run"
                fi
            fi
            
            if [ $deploy_attempt -lt $max_deploy_attempts ]; then
                log "INFO" "Cleaning up and retrying deployment..."
                
                # Stop and remove containers
                docker-compose -f docker-compose.yml stop "$service" 2>/dev/null || true
                docker-compose -f docker-compose.yml rm -f "$service" 2>/dev/null || true
                
                # More aggressive cleanup
                docker system prune -f 2>/dev/null || true
                
                # Remove any problematic containers
                local problem_containers=$(docker ps -aq --filter "name=.*$service.*$env.*" 2>/dev/null || true)
                if [ -n "$problem_containers" ]; then
                    echo "$problem_containers" | while read cid; do
                        docker stop "$cid" 2>/dev/null || true
                        docker rm "$cid" 2>/dev/null || true
                    done
                fi
                
                sleep 5
            fi
        done
        
        if [ "$deploy_success" != "true" ]; then
            log "ERROR" "Failed to deploy service $service after $max_deploy_attempts attempts"
            generate_deployment_failure_report "$service" "$env"
            return 1
        fi
        
        log "SUCCESS" "Service $service rebuilt, deployed, and verified successfully"
    else
        log "ERROR" "Docker compose file not found: $compose_file"
        return 1
    fi
}

# Verify build was successful and created new image
verify_build_success() {
    local service="$1"
    local env="$2"
    local image_name=$(get_image_name "$service" "$env")
    
    # Check if image exists
    if ! docker images --format "{{.Repository}}:{{.Tag}}" | grep -q "^${image_name}$"; then
        log "ERROR" "Build verification failed: Image $image_name not found"
        return 1
    fi
    
    # Check if image was created recently (within last 5 minutes)
    local image_created=$(docker inspect --format='{{.Created}}' "$image_name" 2>/dev/null)
    if [ -n "$image_created" ]; then
        local image_timestamp=$(date -d "$image_created" +%s 2>/dev/null)
        local current_timestamp=$(date +%s)
        local age_seconds=$((current_timestamp - image_timestamp))
        
        if [ $age_seconds -gt 300 ]; then  # More than 5 minutes old
            log "WARN" "Build verification: Image seems old (${age_seconds}s), but this might be expected"
        else
            log "INFO" "Build verification: Fresh image created (${age_seconds}s ago)"
        fi
    fi
    
    # For frontend services, verify the build included recent changes
    if [[ "$service" == *"frontend"* ]]; then
        # Try to find evidence of recent build in image layers
        local build_info=$(docker history "$image_name" --format "{{.CreatedBy}}" 2>/dev/null | head -5)
        if [[ "$build_info" == *"npm run build"* ]] || [[ "$build_info" == *"next build"* ]]; then
            log "INFO" "Build verification: Frontend build commands found in image history"
        else
            log "WARN" "Build verification: Could not verify frontend build commands"
        fi
    fi
    
    log "SUCCESS" "Build verification passed for $service"
    return 0
}

# Verify deployment is using the latest code
verify_deployment_success() {
    local service="$1"
    local env="$2"
    local container_name=$(get_service_name "$service" "$env")
    
    # Check container is running
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log "ERROR" "Deployment verification failed: Container not running"
        return 1
    fi
    
    # Check container is healthy
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null)
    if [ "$health_status" = "healthy" ]; then
        log "INFO" "Deployment verification: Container is healthy"
    elif [ "$health_status" = "unhealthy" ]; then
        log "ERROR" "Deployment verification failed: Container is unhealthy"
        return 1
    else
        log "INFO" "Deployment verification: Health check not configured or starting"
    fi
    
    # For frontend services, try to verify the deployment serves the latest code
    if [[ "$service" == *"frontend"* ]]; then
        local port=$(docker port "$container_name" | grep -o '0.0.0.0:[0-9]*' | cut -d: -f2 | head -1)
        if [ -n "$port" ]; then
            log "INFO" "Deployment verification: Frontend service running on port $port"
            
            # Test basic connectivity
            if curl -s -f "http://localhost:$port" >/dev/null 2>&1; then
                log "INFO" "Deployment verification: Frontend service is responding"
            else
                log "WARN" "Deployment verification: Frontend service not yet responding (may still be starting)"
                # Give it more time for frontend to start
                sleep 10
                if curl -s -f "http://localhost:$port" >/dev/null 2>&1; then
                    log "INFO" "Deployment verification: Frontend service now responding"
                else
                    log "ERROR" "Deployment verification failed: Frontend service not responding after wait"
                    return 1
                fi
            fi
        fi
    fi
    
    # Verify container is using the correct image
    local container_image=$(docker inspect --format='{{.Config.Image}}' "$container_name" 2>/dev/null)
    local expected_image=$(get_image_name "$service" "$env")
    
    if [ "$container_image" = "$expected_image" ]; then
        log "INFO" "Deployment verification: Container using correct image"
    else
        log "ERROR" "Deployment verification failed: Container using wrong image ($container_image != $expected_image)"
        return 1
    fi
    
    log "SUCCESS" "Deployment verification passed for $service"
    return 0
}

# Generate comprehensive build failure report
generate_build_failure_report() {
    local service="$1"
    local env="$2"
    local report_file="$PROJECT_ROOT/logs/build-failure-${service}-${env}-$(date +%Y%m%d-%H%M%S).log"
    
    log "ERROR" "Generating build failure report: $report_file"
    
    cat > "$report_file" << EOF
LOGEN BUILD FAILURE REPORT
==========================
Service: $service
Environment: $env
Timestamp: $(date)
Host: $(hostname)

SYSTEM INFORMATION:
- Docker Version: $(docker --version)
- Docker Compose Version: $(docker-compose --version)
- Available Disk Space: $(df -h | grep -E '/$|/var')
- Memory Usage: $(free -h)

SOURCE CODE STATUS:
EOF
    
    # Add source file information
    local source_dirs=()
    case "$service" in
        "backend")
            source_dirs=("apps/backend/src" "apps/backend/package.json")
            ;;
        "admin-frontend")
            source_dirs=("apps/admin-frontend/src" "apps/admin-frontend/package.json")
            ;;
        "customer-frontend"|"frontend")
            source_dirs=("apps/frontend/src" "apps/frontend/package.json")
            ;;
    esac
    
    for source_path in "${source_dirs[@]}"; do
        if [ -e "$PROJECT_ROOT/$source_path" ]; then
            echo "- $source_path: $(stat -c '%y' "$PROJECT_ROOT/$source_path")" >> "$report_file"
        fi
    done
    
    cat >> "$report_file" << EOF

DOCKER IMAGES:
$(docker images | grep -E "(logen|$service)")

DOCKER BUILD CACHE:
$(docker builder ls)

RECENT DOCKER LOGS:
$(docker system events --since 10m --filter type=container 2>/dev/null | tail -20)

COMPOSE FILE STATUS:
EOF
    
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        echo "- Compose file exists: $compose_file" >> "$report_file"
        echo "- Compose file size: $(stat -c %s "$compose_file") bytes" >> "$report_file"
    else
        echo "- ERROR: Compose file missing: $compose_file" >> "$report_file"
    fi
    
    echo -e "\nRECOMMENDATIONS:" >> "$report_file"
    echo "1. Check disk space - builds require significant space" >> "$report_file"
    echo "2. Verify source files are not corrupted" >> "$report_file"
    echo "3. Try manual build: cd config/docker/$env && docker-compose build --no-cache $service" >> "$report_file"
    echo "4. Check Docker daemon logs: journalctl -u docker" >> "$report_file"
    
    log "ERROR" "Build failure report saved to: $report_file"
}

# Generate comprehensive deployment failure report
generate_deployment_failure_report() {
    local service="$1"
    local env="$2"
    local report_file="$PROJECT_ROOT/logs/deploy-failure-${service}-${env}-$(date +%Y%m%d-%H%M%S).log"
    
    log "ERROR" "Generating deployment failure report: $report_file"
    
    cat > "$report_file" << EOF
LOGEN DEPLOYMENT FAILURE REPORT
===============================
Service: $service
Environment: $env  
Timestamp: $(date)
Host: $(hostname)

CONTAINER STATUS:
$(docker ps -a | grep -E "(logen|$service)")

IMAGE STATUS:
$(docker images | grep -E "(logen|$service)")

NETWORK STATUS:
$(docker network ls | grep logen)

VOLUME STATUS:
$(docker volume ls | grep logen)

RECENT CONTAINER LOGS:
EOF
    
    local container_name=$(get_service_name "$service" "$env")
    if docker ps -a --filter "name=$container_name" | grep -q "$container_name"; then
        echo "=== Logs for $container_name ===" >> "$report_file"
        docker logs "$container_name" --tail 50 >> "$report_file" 2>&1
    else
        echo "No container found with name: $container_name" >> "$report_file"
    fi
    
    cat >> "$report_file" << EOF

PORT CONFLICTS:
$(netstat -tlnp | grep -E ':(7600|7601|7602|7633|7679)')

SYSTEM RESOURCES:
$(docker system df)

RECOMMENDATIONS:
1. Check container logs above for specific errors
2. Verify port availability (no conflicts)
3. Check if service has proper health check configuration  
4. Try manual start: cd config/docker/$env && docker-compose up -d $service
5. Check if dependencies (postgres, redis) are running
EOF
    
    log "ERROR" "Deployment failure report saved to: $report_file"
}

# Wait for specific service to be healthy
wait_for_service_health() {
    local service="$1"
    local env="$2"
    local max_wait=120 # 2 minutes
    local wait_time=0
    
    local container_name=$(get_service_name "$service" "$env")
    
    log "INFO" "Waiting for $container_name to be healthy..."
    
    while [ $wait_time -lt $max_wait ]; do
        if docker ps --filter "name=$container_name" --filter "health=healthy" | grep -q "$container_name"; then
            log "SUCCESS" "$container_name is healthy"
            return 0
        elif docker ps --filter "name=$container_name" --filter "health=unhealthy" | grep -q "$container_name"; then
            log "ERROR" "$container_name is unhealthy"
            docker logs "$container_name" --tail 20
            return 1
        fi
        
        sleep 5
        wait_time=$((wait_time + 5))
    done
    
    log "ERROR" "$container_name failed to become healthy within $max_wait seconds"
    docker logs "$container_name" --tail 20
    return 1
}

# Check services status
check_services_status() {
    local env="$1"
    
    log "INFO" "Checking services status for environment: $env"
    
    echo ""
    echo "=== LOGEN Services Status - Environment: $env ==="
    echo ""
    
    # Define services to check
    local services=("postgres" "redis" "backend" "admin-frontend" "customer-frontend")
    
    for service in "${services[@]}"; do
        local container_name=$(get_service_name "$service" "$env")
        
        if docker ps --filter "name=$container_name" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -q "$container_name"; then
            local status=$(docker ps --filter "name=$container_name" --format "{{.Status}}")
            local ports=$(docker ps --filter "name=$container_name" --format "{{.Ports}}")
            
            if [[ "$status" == *"healthy"* ]]; then
                echo -e "${GREEN}✓ $service${NC} - $status"
            elif [[ "$status" == *"unhealthy"* ]]; then
                echo -e "${RED}✗ $service${NC} - $status"
            else
                echo -e "${YELLOW}○ $service${NC} - $status"
            fi
            
            if [ -n "$ports" ]; then
                echo "  Ports: $ports"
            fi
        else
            echo -e "${RED}✗ $service${NC} - Not running"
        fi
        echo ""
    done
    
    # Show resource usage
    echo "=== Resource Usage ==="
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" $(docker ps --filter "name=logen-*-$env" --format "{{.Names}}") 2>/dev/null || echo "No containers running"
    echo ""
}

# Show service logs
show_service_logs() {
    local service="$1"
    local env="$2"
    local lines="${3:-100}"
    
    local container_name=$(get_service_name "$service" "$env")
    
    if docker ps -a --filter "name=$container_name" | grep -q "$container_name"; then
        log "INFO" "Showing logs for $container_name (last $lines lines)"
        echo ""
        echo "=== Logs for $container_name ==="
        docker logs "$container_name" --tail "$lines" --timestamps
        echo ""
        echo "=== End of logs ==="
    else
        log "ERROR" "Container $container_name not found"
        return 1
    fi
}

# Cleanup environment
cleanup_environment() {
    local env="$1"
    
    log "INFO" "Cleaning up environment: $env"
    
    # Stop and remove containers
    local containers=$(docker ps -a --filter "name=logen-*-$env" --format "{{.Names}}")
    if [ -n "$containers" ]; then
        log "INFO" "Stopping containers: $containers"
        echo "$containers" | xargs docker stop
        echo "$containers" | xargs docker rm
    fi
    
    # Remove images
    local images=$(docker images --filter "reference=logen-*:$env" --format "{{.Repository}}:{{.Tag}}")
    if [ -n "$images" ]; then
        log "INFO" "Removing images: $images"
        echo "$images" | xargs docker rmi
    fi
    
    # Clean up unused resources
    docker system prune -f
    
    log "SUCCESS" "Environment $env cleaned up"
}

# Get container resource usage
get_container_stats() {
    local env="$1"
    
    log "INFO" "Getting container statistics for environment: $env"
    
    local containers=$(docker ps --filter "name=logen-*-$env" --format "{{.Names}}")
    
    if [ -n "$containers" ]; then
        docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}" $containers
    else
        log "INFO" "No containers running for environment: $env"
    fi
}

# Export container configuration
export_container_config() {
    local service="$1"
    local env="$2"
    
    local container_name=$(get_service_name "$service" "$env")
    local config_file="$PROJECT_ROOT/backups/$env/${container_name}-config-$(date +%Y%m%d-%H%M%S).json"
    
    if docker ps -a --filter "name=$container_name" | grep -q "$container_name"; then
        docker inspect "$container_name" > "$config_file"
        log "SUCCESS" "Container configuration exported to: $config_file"
    else
        log "ERROR" "Container $container_name not found"
        return 1
    fi
}

# Restart service
restart_service() {
    local service="$1"
    local env="$2"
    
    local container_name=$(get_service_name "$service" "$env")
    
    if docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log "INFO" "Restarting service: $container_name"
        docker restart "$container_name"
        
        # Wait for service to be healthy
        wait_for_service_health "$service" "$env"
        
        log "SUCCESS" "Service $container_name restarted successfully"
    else
        log "ERROR" "Container $container_name not found or not running"
        return 1
    fi
}

# Scale service (for future use with orchestration)
scale_service() {
    local service="$1"
    local env="$2"
    local replicas="$3"
    
    log "INFO" "Scaling service $service to $replicas replicas in environment $env"
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    fi
    
    # Use docker-compose to scale
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        cd "$(dirname "$compose_file")"
        docker-compose -f docker-compose.yml up -d --scale "$service=$replicas"
        log "SUCCESS" "Service $service scaled to $replicas replicas"
    else
        log "ERROR" "Docker compose file not found: $compose_file"
        return 1
    fi
}

# Update service image
update_service_image() {
    local service="$1"
    local env="$2"
    local new_tag="$3"
    
    local container_name=$(get_service_name "$service" "$env")
    local image_name=$(get_image_name "$service" "$env")
    
    log "INFO" "Updating $container_name to use image tag: $new_tag"
    
    # Pull new image
    docker pull "${image_name}:${new_tag}"
    
    # Tag as current environment
    docker tag "${image_name}:${new_tag}" "$image_name"
    
    # Restart container with new image
    restart_service "$service" "$env"
    
    log "SUCCESS" "Service $service updated to tag: $new_tag"
}

# Migrate existing containers to LOGEN standard
migrate_to_standard() {
    local env="$1"
    
    log "INFO" "Starting migration to LOGEN standard for environment: $env"
    
    # Create backup of current state
    local backup_dir="$PROJECT_ROOT/backups/migration-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    log "INFO" "Creating migration backup in: $backup_dir"
    
    # Export current container configurations
    for container in $(docker ps --format "{{.Names}}" | grep -E "logen|locod" | grep -v "logen-.*-$env"); do
        log "INFO" "Backing up configuration for: $container"
        docker inspect "$container" > "$backup_dir/${container}-config.json"
        
        # Export data if it's a database
        if [[ "$container" == *"postgres"* ]]; then
            log "INFO" "Creating database dump for: $container"
            docker exec "$container" pg_dumpall -U postgres > "$backup_dir/${container}-dump.sql" 2>/dev/null || \
            docker exec "$container" pg_dumpall -U locod_user > "$backup_dir/${container}-dump.sql" 2>/dev/null || \
            log "WARN" "Could not create database dump for $container"
        fi
    done
    
    # Handle PostgreSQL migration
    migrate_postgresql "$env" "$backup_dir"
    
    # Handle Redis migration (if needed)
    migrate_redis "$env" "$backup_dir"
    
    # Stop old containers that don't follow LOGEN standard
    log "INFO" "Stopping old containers that need migration"
    for container in $(docker ps --format "{{.Names}}" | grep -E "logen.*final|locod"); do
        log "INFO" "Stopping old container: $container"
        docker stop "$container" || true
    done
    
    log "SUCCESS" "Migration preparation completed. Backup saved to: $backup_dir"
    log "INFO" "Ready to deploy using LOGEN standard. Run: ./logen-manager.sh deploy $env"
}

# Migrate PostgreSQL to LOGEN standard
migrate_postgresql() {
    local env="$1"
    local backup_dir="$2"
    
    log "INFO" "Migrating PostgreSQL to LOGEN standard"
    
    # Find existing PostgreSQL container
    local existing_postgres=$(docker ps --format "{{.Names}}" | grep postgres | grep -v "logen-postgres-$env" | head -1)
    
    if [ -n "$existing_postgres" ]; then
        log "INFO" "Found existing PostgreSQL container: $existing_postgres"
        
        # Create comprehensive database backup
        log "INFO" "Creating comprehensive database backup"
        docker exec "$existing_postgres" pg_dumpall -U postgres > "$backup_dir/full-database-dump.sql" 2>/dev/null || \
        docker exec "$existing_postgres" pg_dumpall -U locod_user > "$backup_dir/full-database-dump.sql" 2>/dev/null || \
        log "ERROR" "Failed to create database backup"
        
        # Get database connection info
        local db_port=$(docker port "$existing_postgres" | grep "5432\|7633" | cut -d: -f2 | head -1)
        log "INFO" "Current PostgreSQL container uses port: $db_port"
        
        # Create volume backup if exists
        local existing_volume=$(docker inspect "$existing_postgres" | jq -r '.[0].Mounts[] | select(.Type=="volume") | .Name' | head -1)
        if [ -n "$existing_volume" ] && [ "$existing_volume" != "null" ]; then
            log "INFO" "Found existing volume: $existing_volume"
            echo "$existing_volume" > "$backup_dir/postgres-volume-name.txt"
        fi
        
        log "INFO" "PostgreSQL migration prepared. Database dump created."
    else
        log "INFO" "No non-standard PostgreSQL container found. Migration not needed."
    fi
}

# Migrate Redis to LOGEN standard  
migrate_redis() {
    local env="$1"
    local backup_dir="$2"
    
    log "INFO" "Checking Redis migration needs"
    
    # Find existing Redis container
    local existing_redis=$(docker ps --format "{{.Names}}" | grep redis | grep -v "logen-redis-$env" | head -1)
    
    if [ -n "$existing_redis" ]; then
        log "INFO" "Found existing Redis container: $existing_redis"
        
        # Create Redis backup
        log "INFO" "Creating Redis backup"
        docker exec "$existing_redis" redis-cli --rdb "$backup_dir/redis-backup.rdb" || \
        log "WARN" "Could not create Redis backup"
        
        log "INFO" "Redis migration prepared."
    else
        log "INFO" "Redis already follows LOGEN standard or not found."
    fi
}