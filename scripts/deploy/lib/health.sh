#!/bin/bash
# Health Check Functions
# Comprehensive health monitoring for all LOGEN services

# Run comprehensive health checks
run_health_checks() {
    local env="$1"
    
    log "INFO" "Running comprehensive health checks for environment: $env"
    
    echo ""
    echo "=== LOGEN Health Check Report - Environment: $env ==="
    echo "Generated: $(date)"
    echo ""
    
    local overall_health=0
    
    # System resource checks
    check_system_resources
    local system_health=$?
    overall_health=$((overall_health + system_health))
    
    # Docker service checks
    check_docker_services "$env"
    local docker_health=$?
    overall_health=$((overall_health + docker_health))
    
    # Database connectivity
    check_database_health "$env"
    local db_health=$?
    overall_health=$((overall_health + db_health))
    
    # Redis connectivity
    check_redis_health "$env"
    local redis_health=$?
    overall_health=$((overall_health + redis_health))
    
    # Backend API health
    check_backend_health "$env"
    local backend_health=$?
    overall_health=$((overall_health + backend_health))
    
    # Frontend health
    check_frontend_health "$env"
    local frontend_health=$?
    overall_health=$((overall_health + frontend_health))
    
    # Network connectivity
    check_network_connectivity "$env"
    local network_health=$?
    overall_health=$((overall_health + network_health))
    
    # SSL certificate checks (for production)
    if [ "$env" = "prod" ]; then
        check_ssl_certificates
        local ssl_health=$?
        overall_health=$((overall_health + ssl_health))
    fi
    
    echo ""
    echo "=== Health Check Summary ==="
    if [ $overall_health -eq 0 ]; then
        echo -e "${GREEN}✓ All health checks passed${NC}"
        echo "System Status: HEALTHY"
    else
        echo -e "${RED}✗ $overall_health health check(s) failed${NC}"
        echo "System Status: UNHEALTHY"
    fi
    echo ""
    
    return $overall_health
}

# Check system resources
check_system_resources() {
    echo "=== System Resources ==="
    
    local failed=0
    
    # Check disk space
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $disk_usage -gt 90 ]; then
        echo -e "${RED}✗ Disk Usage: ${disk_usage}% (Critical)${NC}"
        failed=$((failed + 1))
    elif [ $disk_usage -gt 80 ]; then
        echo -e "${YELLOW}⚠ Disk Usage: ${disk_usage}% (Warning)${NC}"
    else
        echo -e "${GREEN}✓ Disk Usage: ${disk_usage}% (OK)${NC}"
    fi
    
    # Check memory usage
    local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    if [ $mem_usage -gt 90 ]; then
        echo -e "${RED}✗ Memory Usage: ${mem_usage}% (Critical)${NC}"
        failed=$((failed + 1))
    elif [ $mem_usage -gt 80 ]; then
        echo -e "${YELLOW}⚠ Memory Usage: ${mem_usage}% (Warning)${NC}"
    else
        echo -e "${GREEN}✓ Memory Usage: ${mem_usage}% (OK)${NC}"
    fi
    
    # Check load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local load_threshold=4 # Adjust based on CPU cores
    if (( $(echo "$load_avg > $load_threshold" | bc -l) )); then
        echo -e "${RED}✗ Load Average: $load_avg (High)${NC}"
        failed=$((failed + 1))
    else
        echo -e "${GREEN}✓ Load Average: $load_avg (OK)${NC}"
    fi
    
    # Check if Docker is running
    if systemctl is-active --quiet docker; then
        echo -e "${GREEN}✓ Docker Service: Running${NC}"
    else
        echo -e "${RED}✗ Docker Service: Not running${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
    return $failed
}

# Check Docker services
check_docker_services() {
    local env="$1"
    echo "=== Docker Services - Environment: $env ==="
    
    local failed=0
    local services=("postgres" "redis" "backend" "admin-frontend" "customer-frontend")
    
    for service in "${services[@]}"; do
        local container_name=$(get_service_name "$service" "$env")
        
        if docker ps --filter "name=$container_name" | grep -q "$container_name"; then
            local status=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")
            
            case "$status" in
                "healthy")
                    echo -e "${GREEN}✓ $service: Healthy${NC}"
                    ;;
                "unhealthy")
                    echo -e "${RED}✗ $service: Unhealthy${NC}"
                    failed=$((failed + 1))
                    ;;
                "starting")
                    echo -e "${YELLOW}⚠ $service: Starting${NC}"
                    ;;
                "no-health-check")
                    # Check if container is running
                    if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
                        echo -e "${GREEN}✓ $service: Running (no health check)${NC}"
                    else
                        echo -e "${RED}✗ $service: Not running properly${NC}"
                        failed=$((failed + 1))
                    fi
                    ;;
                *)
                    echo -e "${RED}✗ $service: Unknown status ($status)${NC}"
                    failed=$((failed + 1))
                    ;;
            esac
        else
            echo -e "${RED}✗ $service: Container not found${NC}"
            failed=$((failed + 1))
        fi
    done
    
    echo ""
    return $failed
}

# Check database health
check_database_health() {
    local env="$1"
    echo "=== Database Health ==="
    
    local failed=0
    local container_name=$(get_service_name "postgres" "$env")
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    fi
    
    # Test database connection
    if docker exec "$container_name" pg_isready -U "$DB_USERNAME" -d "$DB_DATABASE" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Database Connection: OK${NC}"
        
        # Test basic query
        local user_count=$(docker exec "$container_name" psql -U "$DB_USERNAME" -d "$DB_DATABASE" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' \n')
        if [ -n "$user_count" ] && [ "$user_count" -gt 0 ]; then
            echo -e "${GREEN}✓ Database Query: OK (${user_count} users)${NC}"
        else
            echo -e "${YELLOW}⚠ Database Query: No users found${NC}"
        fi
        
        # Check database size
        local db_size=$(docker exec "$container_name" psql -U "$DB_USERNAME" -d "$DB_DATABASE" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_DATABASE'));" 2>/dev/null | tr -d ' ')
        if [ -n "$db_size" ]; then
            echo -e "${GREEN}✓ Database Size: $db_size${NC}"
        fi
        
    else
        echo -e "${RED}✗ Database Connection: Failed${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
    return $failed
}

# Check Redis health
check_redis_health() {
    local env="$1"
    echo "=== Redis Health ==="
    
    local failed=0
    local container_name=$(get_service_name "redis" "$env")
    
    # Test Redis connection
    if docker exec "$container_name" redis-cli ping >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis Connection: OK${NC}"
        
        # Get Redis info
        local redis_version=$(docker exec "$container_name" redis-cli info server | grep "redis_version" | cut -d: -f2 | tr -d '\r')
        local connected_clients=$(docker exec "$container_name" redis-cli info clients | grep "connected_clients" | cut -d: -f2 | tr -d '\r')
        local used_memory=$(docker exec "$container_name" redis-cli info memory | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        
        echo -e "${GREEN}✓ Redis Version: $redis_version${NC}"
        echo -e "${GREEN}✓ Connected Clients: $connected_clients${NC}"
        echo -e "${GREEN}✓ Memory Usage: $used_memory${NC}"
        
    else
        echo -e "${RED}✗ Redis Connection: Failed${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
    return $failed
}

# Check backend API health
check_backend_health() {
    local env="$1"
    echo "=== Backend API Health ==="
    
    local failed=0
    local port=${LOGEN_PORTS[backend]}
    
    # Determine API URL based on environment
    local api_url
    case "$env" in
        "dev")
            api_url="http://localhost:$port"
            ;;
        "prod")
            api_url="https://admin.logen.locod-ai.com"
            ;;
        *)
            api_url="http://localhost:$port"
            ;;
    esac
    
    # Test health endpoint
    if curl -sf "$api_url/api/health" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Health Endpoint: OK${NC}"
        
        # Get detailed health info
        local health_info=$(curl -s "$api_url/api/health" 2>/dev/null)
        if [ -n "$health_info" ]; then
            local db_status=$(echo "$health_info" | jq -r '.database // "unknown"' 2>/dev/null)
            local uptime=$(echo "$health_info" | jq -r '.uptime // "unknown"' 2>/dev/null)
            
            if [ "$db_status" = "healthy" ]; then
                echo -e "${GREEN}✓ Database Status: Healthy${NC}"
            else
                echo -e "${RED}✗ Database Status: $db_status${NC}"
                failed=$((failed + 1))
            fi
            
            if [ "$uptime" != "unknown" ]; then
                echo -e "${GREEN}✓ Uptime: $uptime seconds${NC}"
            fi
        fi
        
    else
        echo -e "${RED}✗ Health Endpoint: Failed${NC}"
        failed=$((failed + 1))
    fi
    
    # Test auth endpoint
    local auth_response=$(curl -s -w "%{http_code}" -o /dev/null -X POST \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrong"}' \
        "$api_url/auth/login" 2>/dev/null)
    
    if [ "$auth_response" = "401" ]; then
        echo -e "${GREEN}✓ Auth Endpoint: OK (properly rejecting invalid credentials)${NC}"
    elif [ "$auth_response" = "500" ]; then
        echo -e "${RED}✗ Auth Endpoint: Internal Server Error${NC}"
        failed=$((failed + 1))
    else
        echo -e "${YELLOW}⚠ Auth Endpoint: Unexpected response ($auth_response)${NC}"
    fi
    
    echo ""
    return $failed
}

# Check frontend health
check_frontend_health() {
    local env="$1"
    echo "=== Frontend Health ==="
    
    local failed=0
    
    # Check admin frontend
    local admin_port=${LOGEN_PORTS[admin-frontend]}
    local admin_url
    case "$env" in
        "prod")
            admin_url="https://admin.logen.locod-ai.com"
            ;;
        *)
            admin_url="http://localhost:$admin_port"
            ;;
    esac
    
    if curl -sf "$admin_url" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Admin Frontend: OK${NC}"
    else
        echo -e "${RED}✗ Admin Frontend: Failed${NC}"
        failed=$((failed + 1))
    fi
    
    # Check customer frontend
    local customer_port=${LOGEN_PORTS[customer-frontend]}
    local customer_url
    case "$env" in
        "prod")
            customer_url="https://logen.locod-ai.com"
            ;;
        *)
            customer_url="http://localhost:$customer_port"
            ;;
    esac
    
    if curl -sf "$customer_url" >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Customer Frontend: OK${NC}"
    else
        echo -e "${RED}✗ Customer Frontend: Failed${NC}"
        failed=$((failed + 1))
    fi
    
    echo ""
    return $failed
}

# Check network connectivity
check_network_connectivity() {
    local env="$1"
    echo "=== Network Connectivity ==="
    
    local failed=0
    local network_name=$(get_network_name "$env")
    
    # Check if Docker network exists
    if docker network ls | grep -q "$network_name"; then
        echo -e "${GREEN}✓ Docker Network: $network_name exists${NC}"
        
        # Check network configuration
        local network_info=$(docker network inspect "$network_name" 2>/dev/null)
        if [ -n "$network_info" ]; then
            local subnet=$(echo "$network_info" | jq -r '.[0].IPAM.Config[0].Subnet // "unknown"' 2>/dev/null)
            echo -e "${GREEN}✓ Network Subnet: $subnet${NC}"
        fi
        
    else
        echo -e "${RED}✗ Docker Network: $network_name not found${NC}"
        failed=$((failed + 1))
    fi
    
    # Test inter-service connectivity
    local backend_container=$(get_service_name "backend" "$env")
    local postgres_container=$(get_service_name "postgres" "$env")
    
    if docker ps --filter "name=$backend_container" | grep -q "$backend_container" && \
       docker ps --filter "name=$postgres_container" | grep -q "$postgres_container"; then
        
        # Test backend -> postgres connectivity
        if docker exec "$backend_container" nc -z postgres 5432 >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Backend -> Database: OK${NC}"
        else
            echo -e "${RED}✗ Backend -> Database: Failed${NC}"
            failed=$((failed + 1))
        fi
    fi
    
    echo ""
    return $failed
}

# Check SSL certificates (production only)
check_ssl_certificates() {
    echo "=== SSL Certificates ==="
    
    local failed=0
    local domains=("logen.locod-ai.com" "admin.logen.locod-ai.com")
    
    for domain in "${domains[@]}"; do
        # Check certificate expiration
        local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [ -n "$cert_info" ]; then
            local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null)
            local current_epoch=$(date +%s)
            local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
            
            if [ $days_until_expiry -gt 30 ]; then
                echo -e "${GREEN}✓ SSL Certificate $domain: Valid ($days_until_expiry days remaining)${NC}"
            elif [ $days_until_expiry -gt 7 ]; then
                echo -e "${YELLOW}⚠ SSL Certificate $domain: Expires soon ($days_until_expiry days remaining)${NC}"
            else
                echo -e "${RED}✗ SSL Certificate $domain: Expires very soon ($days_until_expiry days remaining)${NC}"
                failed=$((failed + 1))
            fi
        else
            echo -e "${RED}✗ SSL Certificate $domain: Could not retrieve certificate info${NC}"
            failed=$((failed + 1))
        fi
    done
    
    echo ""
    return $failed
}

# Performance monitoring
run_performance_check() {
    local env="$1"
    
    echo "=== Performance Monitoring - Environment: $env ==="
    echo ""
    
    # API Response times
    echo "--- API Response Times ---"
    local api_url
    case "$env" in
        "prod")
            api_url="https://admin.logen.locod-ai.com"
            ;;
        *)
            api_url="http://localhost:${LOGEN_PORTS[backend]}"
            ;;
    esac
    
    # Test health endpoint response time
    local response_time=$(curl -w "@/dev/stdin" -s -o /dev/null "$api_url/api/health" <<< '%{time_total}' 2>/dev/null)
    if [ -n "$response_time" ]; then
        echo "Health Endpoint: ${response_time}s"
    fi
    
    # Database query performance
    echo ""
    echo "--- Database Performance ---"
    local container_name=$(get_service_name "postgres" "$env")
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
    fi
    
    # Test query performance
    local query_time=$(docker exec "$container_name" bash -c "time psql -U $DB_USERNAME -d $DB_DATABASE -c 'SELECT COUNT(*) FROM users;'" 2>&1 | grep real | awk '{print $2}')
    if [ -n "$query_time" ]; then
        echo "Simple Query Time: $query_time"
    fi
    
    echo ""
}