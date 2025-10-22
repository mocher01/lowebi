#!/bin/bash
# Validation Functions
# Pre-deployment validation and configuration checking

# Validate environment configuration
validate_environment() {
    local env="$1"
    
    log "INFO" "Validating environment configuration: $env"
    
    echo ""
    echo "=== Environment Validation Report - $env ==="
    echo "Generated: $(date)"
    echo ""
    
    local validation_errors=0
    
    # Validate environment name
    validate_environment_name "$env"
    validation_errors=$((validation_errors + $?))
    
    # Validate system requirements
    validate_system_requirements
    validation_errors=$((validation_errors + $?))
    
    # Validate configuration files
    validate_configuration_files "$env"
    validation_errors=$((validation_errors + $?))
    
    # Validate Docker setup
    validate_docker_setup
    validation_errors=$((validation_errors + $?))
    
    # Validate port availability
    validate_port_availability "$env"
    validation_errors=$((validation_errors + $?))
    
    # Validate SSL certificates (production only)
    if [ "$env" = "prod" ]; then
        validate_ssl_setup "$env"
        validation_errors=$((validation_errors + $?))
    fi
    
    # Validate network configuration
    validate_network_configuration "$env"
    validation_errors=$((validation_errors + $?))
    
    echo ""
    echo "=== Validation Summary ==="
    if [ $validation_errors -eq 0 ]; then
        echo -e "${GREEN}✓ All validations passed - Environment ready for deployment${NC}"
        return 0
    else
        echo -e "${RED}✗ $validation_errors validation error(s) found - Please fix before deployment${NC}"
        return $validation_errors
    fi
}

# Validate environment name
validate_environment_name() {
    local env="$1"
    local errors=0
    
    echo "=== Environment Name Validation ==="
    
    case "$env" in
        "dev"|"staging"|"prod")
            echo -e "${GREEN}✓ Environment name '$env' is valid${NC}"
            ;;
        *)
            echo -e "${RED}✗ Invalid environment name: '$env'${NC}"
            echo "  Valid options: dev, staging, prod"
            errors=$((errors + 1))
            ;;
    esac
    
    echo ""
    return $errors
}

# Validate system requirements
validate_system_requirements() {
    local errors=0
    
    echo "=== System Requirements Validation ==="
    
    # Check disk space
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $disk_usage -gt 85 ]; then
        echo -e "${RED}✗ Insufficient disk space: ${disk_usage}% used${NC}"
        echo "  Recommended: Less than 85% disk usage"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ Disk space: ${disk_usage}% used (OK)${NC}"
    fi
    
    # Check memory
    local total_mem=$(free -m | grep Mem | awk '{print $2}')
    if [ $total_mem -lt 2048 ]; then
        echo -e "${RED}✗ Insufficient memory: ${total_mem}MB${NC}"
        echo "  Recommended: At least 2GB RAM"
        errors=$((errors + 1))
    else
        echo -e "${GREEN}✓ Memory: ${total_mem}MB (OK)${NC}"
    fi
    
    # Check Docker version
    if command -v docker >/dev/null 2>&1; then
        local docker_version=$(docker --version | awk '{print $3}' | sed 's/,//')
        echo -e "${GREEN}✓ Docker installed: $docker_version${NC}"
        
        # Check if Docker daemon is running
        if docker info >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Docker daemon is running${NC}"
        else
            echo -e "${RED}✗ Docker daemon is not running${NC}"
            errors=$((errors + 1))
        fi
    else
        echo -e "${RED}✗ Docker not installed${NC}"
        errors=$((errors + 1))
    fi
    
    # Check Docker Compose
    if command -v docker-compose >/dev/null 2>&1; then
        local compose_version=$(docker-compose --version | awk '{print $3}' | sed 's/,//')
        echo -e "${GREEN}✓ Docker Compose installed: $compose_version${NC}"
    else
        echo -e "${RED}✗ Docker Compose not installed${NC}"
        errors=$((errors + 1))
    fi
    
    # Check required commands
    for cmd in "curl" "jq" "bc"; do
        if command -v "$cmd" >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Command '$cmd' available${NC}"
        else
            echo -e "${RED}✗ Command '$cmd' not available${NC}"
            echo "  Install with: apt-get install $cmd"
            errors=$((errors + 1))
        fi
    done
    
    echo ""
    return $errors
}

# Validate configuration files
validate_configuration_files() {
    local env="$1"
    local errors=0
    
    echo "=== Configuration Files Validation ==="
    
    # Check .env file
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        echo -e "${GREEN}✓ Environment file exists: $env_file${NC}"
        
        # Validate required environment variables
        local required_vars=("NODE_ENV" "PORT" "DB_HOST" "DB_PORT" "DB_USERNAME" "DB_PASSWORD" "DB_DATABASE" "JWT_SECRET")
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" "$env_file"; then
                local value=$(grep "^${var}=" "$env_file" | cut -d= -f2)
                if [ -n "$value" ]; then
                    echo -e "${GREEN}✓ Required variable '$var' is set${NC}"
                else
                    echo -e "${RED}✗ Required variable '$var' is empty${NC}"
                    errors=$((errors + 1))
                fi
            else
                echo -e "${RED}✗ Required variable '$var' not found${NC}"
                errors=$((errors + 1))
            fi
        done
    else
        echo -e "${RED}✗ Environment file not found: $env_file${NC}"
        echo "  Run: $0 init $env"
        errors=$((errors + 1))
    fi
    
    # Check docker-compose file
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        echo -e "${GREEN}✓ Docker Compose file exists: $compose_file${NC}"
        
        # Validate docker-compose syntax
        if docker-compose -f "$compose_file" config >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Docker Compose file syntax is valid${NC}"
        else
            echo -e "${RED}✗ Docker Compose file syntax error${NC}"
            docker-compose -f "$compose_file" config 2>&1 | head -5
            errors=$((errors + 1))
        fi
    else
        echo -e "${RED}✗ Docker Compose file not found: $compose_file${NC}"
        echo "  Run: $0 init $env"
        errors=$((errors + 1))
    fi
    
    # Check application Dockerfiles
    local dockerfiles=(
        "$PROJECT_ROOT/apps/backend/Dockerfile.prod"
        "$PROJECT_ROOT/apps/admin-frontend/Dockerfile.prod"
        "$PROJECT_ROOT/apps/frontend/Dockerfile.prod"
    )
    
    for dockerfile in "${dockerfiles[@]}"; do
        if [ -f "$dockerfile" ]; then
            echo -e "${GREEN}✓ Dockerfile exists: $(basename "$(dirname "$dockerfile")")${NC}"
        else
            echo -e "${RED}✗ Dockerfile not found: $dockerfile${NC}"
            errors=$((errors + 1))
        fi
    done
    
    echo ""
    return $errors
}

# Validate Docker setup
validate_docker_setup() {
    local errors=0
    
    echo "=== Docker Setup Validation ==="
    
    # Check Docker daemon
    if docker info >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker daemon is accessible${NC}"
        
        # Check Docker system resources
        local docker_info=$(docker system df 2>/dev/null)
        if [ -n "$docker_info" ]; then
            echo -e "${GREEN}✓ Docker system info available${NC}"
        else
            echo -e "${YELLOW}⚠ Could not retrieve Docker system info${NC}"
        fi
        
        # Check Docker networking
        if docker network ls >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Docker networking functional${NC}"
        else
            echo -e "${RED}✗ Docker networking issues${NC}"
            errors=$((errors + 1))
        fi
        
    else
        echo -e "${RED}✗ Cannot connect to Docker daemon${NC}"
        echo "  Check: sudo systemctl status docker"
        errors=$((errors + 1))
    fi
    
    # Check for conflicting containers
    local conflicting_containers=$(docker ps -a --filter "name=logen-" --format "{{.Names}}" | grep -v -E "logen-.*-(dev|staging|prod)$")
    if [ -n "$conflicting_containers" ]; then
        echo -e "${YELLOW}⚠ Found containers with non-standard naming:${NC}"
        echo "$conflicting_containers"
        echo "  Consider cleaning up with: docker rm \$(docker ps -aq --filter 'name=logen-')"
    else
        echo -e "${GREEN}✓ No conflicting container names found${NC}"
    fi
    
    echo ""
    return $errors
}

# Validate port availability
validate_port_availability() {
    local env="$1"
    local errors=0
    
    echo "=== Port Availability Validation ==="
    
    # Get ports for this environment
    local ports_to_check=()
    
    case "$env" in
        "dev")
            ports_to_check=(${LOGEN_PORTS[backend]} ${LOGEN_PORTS[admin-frontend]} ${LOGEN_PORTS[customer-frontend]} ${LOGEN_PORTS[postgres]} ${LOGEN_PORTS[redis]})
            ;;
        "prod")
            ports_to_check=(${LOGEN_PORTS[backend]} ${LOGEN_PORTS[admin-frontend]} ${LOGEN_PORTS[customer-frontend]} ${LOGEN_PORTS[postgres]} ${LOGEN_PORTS[redis]})
            ;;
        *)
            ports_to_check=(${LOGEN_PORTS[backend]} ${LOGEN_PORTS[admin-frontend]} ${LOGEN_PORTS[customer-frontend]} ${LOGEN_PORTS[postgres]} ${LOGEN_PORTS[redis]})
            ;;
    esac
    
    for port in "${ports_to_check[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port "; then
            # Port is in use - check if it's by our containers
            local using_process=$(netstat -tulnp 2>/dev/null | grep ":$port " | awk '{print $7}')
            local container_using_port=$(docker ps --filter "publish=$port" --format "{{.Names}}" | grep "logen-.*-$env")
            
            if [ -n "$container_using_port" ]; then
                echo -e "${GREEN}✓ Port $port in use by LOGEN container: $container_using_port${NC}"
            else
                echo -e "${RED}✗ Port $port is in use by: $using_process${NC}"
                echo "  Port $port is required for LOGEN $env environment"
                errors=$((errors + 1))
            fi
        else
            echo -e "${GREEN}✓ Port $port is available${NC}"
        fi
    done
    
    echo ""
    return $errors
}

# Validate SSL setup (production only)
validate_ssl_setup() {
    local env="$1"
    local errors=0
    
    echo "=== SSL Certificate Validation ==="
    
    local domains=("logen.locod-ai.com" "admin.logen.locod-ai.com")
    
    for domain in "${domains[@]}"; do
        # Check if certificate files exist in nginx-reverse proxy
        local cert_file="/var/apps/nginx-reverse/certbot/conf/live/$domain/fullchain.pem"
        local key_file="/var/apps/nginx-reverse/certbot/conf/live/$domain/privkey.pem"
        
        if [ -f "$cert_file" ] && [ -f "$key_file" ]; then
            echo -e "${GREEN}✓ SSL certificate files exist for $domain${NC}"
            
            # Check certificate expiration
            local cert_info=$(openssl x509 -in "$cert_file" -noout -dates 2>/dev/null)
            if [ -n "$cert_info" ]; then
                local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
                local expiry_epoch=$(date -d "$expiry_date" +%s 2>/dev/null)
                local current_epoch=$(date +%s)
                local days_until_expiry=$(( (expiry_epoch - current_epoch) / 86400 ))
                
                if [ $days_until_expiry -gt 30 ]; then
                    echo -e "${GREEN}✓ SSL certificate for $domain valid ($days_until_expiry days remaining)${NC}"
                elif [ $days_until_expiry -gt 7 ]; then
                    echo -e "${YELLOW}⚠ SSL certificate for $domain expires soon ($days_until_expiry days remaining)${NC}"
                else
                    echo -e "${RED}✗ SSL certificate for $domain expires very soon ($days_until_expiry days remaining)${NC}"
                    errors=$((errors + 1))
                fi
            else
                echo -e "${RED}✗ Cannot read SSL certificate for $domain${NC}"
                errors=$((errors + 1))
            fi
        else
            echo -e "${RED}✗ SSL certificate files not found for $domain${NC}"
            echo "  Expected: $cert_file and $key_file"
            echo "  Run: cd /var/apps/nginx-reverse && sudo certbot certonly --nginx -d $domain"
            errors=$((errors + 1))
        fi
    done
    
    # Check if certbot is installed
    if command -v certbot >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Certbot is installed${NC}"
    else
        echo -e "${YELLOW}⚠ Certbot not installed (needed for SSL renewal)${NC}"
        echo "  Install with: sudo apt-get install certbot python3-certbot-nginx"
    fi
    
    echo ""
    return $errors
}

# Validate network configuration
validate_network_configuration() {
    local env="$1"
    local errors=0
    
    echo "=== Network Configuration Validation ==="
    
    # Check DNS resolution for production domains
    if [ "$env" = "prod" ]; then
        local domains=("logen.locod-ai.com" "admin.logen.locod-ai.com")
        
        for domain in "${domains[@]}"; do
            if nslookup "$domain" >/dev/null 2>&1; then
                local resolved_ip=$(nslookup "$domain" | grep -A1 "Name:" | tail -1 | awk '{print $2}')
                echo -e "${GREEN}✓ DNS resolution for $domain: $resolved_ip${NC}"
            else
                echo -e "${RED}✗ DNS resolution failed for $domain${NC}"
                errors=$((errors + 1))
            fi
        done
    fi
    
    # Check network connectivity
    if ping -c 1 google.com >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Internet connectivity available${NC}"
    else
        echo -e "${RED}✗ No internet connectivity${NC}"
        echo "  Required for downloading Docker images"
        errors=$((errors + 1))
    fi
    
    # Check Docker Hub connectivity
    if docker pull hello-world >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Docker Hub connectivity OK${NC}"
        docker rmi hello-world >/dev/null 2>&1
    else
        echo -e "${RED}✗ Cannot connect to Docker Hub${NC}"
        echo "  Required for downloading base images"
        errors=$((errors + 1))
    fi
    
    echo ""
    return $errors
}

# Validate service configuration
validate_service_config() {
    local service="$1"
    local env="$2"
    local errors=0
    
    echo "=== Service Configuration Validation: $service ==="
    
    case "$service" in
        "backend")
            errors=$((errors + $(validate_backend_config "$env")))
            ;;
        "admin-frontend")
            errors=$((errors + $(validate_frontend_config "admin-frontend" "$env")))
            ;;
        "customer-frontend")
            errors=$((errors + $(validate_frontend_config "customer-frontend" "$env")))
            ;;
        "postgres")
            errors=$((errors + $(validate_postgres_config "$env")))
            ;;
        "redis")
            errors=$((errors + $(validate_redis_config "$env")))
            ;;
        *)
            echo -e "${RED}✗ Unknown service: $service${NC}"
            errors=$((errors + 1))
            ;;
    esac
    
    echo ""
    return $errors
}

# Validate backend configuration
validate_backend_config() {
    local env="$1"
    local errors=0
    
    # Check if package.json exists
    local package_json="$PROJECT_ROOT/apps/backend/package.json"
    if [ -f "$package_json" ]; then
        echo -e "${GREEN}✓ Backend package.json exists${NC}"
        
        # Check for required dependencies
        local required_deps=("@nestjs/core" "@nestjs/common" "typeorm" "postgres")
        for dep in "${required_deps[@]}"; do
            if grep -q "\"$dep\"" "$package_json"; then
                echo -e "${GREEN}✓ Required dependency '$dep' found${NC}"
            else
                echo -e "${YELLOW}⚠ Dependency '$dep' not found (may be optional)${NC}"
            fi
        done
    else
        echo -e "${RED}✗ Backend package.json not found${NC}"
        errors=$((errors + 1))
    fi
    
    # Check TypeScript configuration
    local tsconfig="$PROJECT_ROOT/apps/backend/tsconfig.json"
    if [ -f "$tsconfig" ]; then
        echo -e "${GREEN}✓ Backend TypeScript config exists${NC}"
    else
        echo -e "${RED}✗ Backend TypeScript config not found${NC}"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Validate frontend configuration
validate_frontend_config() {
    local frontend_type="$1"
    local env="$2"
    local errors=0
    
    local frontend_dir
    case "$frontend_type" in
        "admin-frontend")
            frontend_dir="$PROJECT_ROOT/apps/admin-frontend"
            ;;
        "customer-frontend")
            frontend_dir="$PROJECT_ROOT/apps/frontend"
            ;;
    esac
    
    # Check if package.json exists
    local package_json="$frontend_dir/package.json"
    if [ -f "$package_json" ]; then
        echo -e "${GREEN}✓ $frontend_type package.json exists${NC}"
        
        # Check for Next.js
        if grep -q "\"next\"" "$package_json"; then
            echo -e "${GREEN}✓ Next.js dependency found${NC}"
        else
            echo -e "${RED}✗ Next.js dependency not found${NC}"
            errors=$((errors + 1))
        fi
    else
        echo -e "${RED}✗ $frontend_type package.json not found${NC}"
        errors=$((errors + 1))
    fi
    
    # Check Next.js configuration
    local next_config="$frontend_dir/next.config.ts"
    if [ -f "$next_config" ]; then
        echo -e "${GREEN}✓ $frontend_type Next.js config exists${NC}"
    else
        echo -e "${YELLOW}⚠ $frontend_type Next.js config not found${NC}"
    fi
    
    return $errors
}

# Validate PostgreSQL configuration
validate_postgres_config() {
    local env="$1"
    local errors=0
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
        
        # Validate database credentials
        if [ -n "$DB_USERNAME" ] && [ -n "$DB_PASSWORD" ] && [ -n "$DB_DATABASE" ]; then
            echo -e "${GREEN}✓ Database credentials configured${NC}"
        else
            echo -e "${RED}✗ Incomplete database credentials${NC}"
            errors=$((errors + 1))
        fi
        
        # Validate database port
        if [ -n "$DB_PORT" ] && [ "$DB_PORT" -gt 0 ] && [ "$DB_PORT" -lt 65536 ]; then
            echo -e "${GREEN}✓ Database port valid: $DB_PORT${NC}"
        else
            echo -e "${RED}✗ Invalid database port: $DB_PORT${NC}"
            errors=$((errors + 1))
        fi
    else
        echo -e "${RED}✗ Environment file not found for database validation${NC}"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Validate Redis configuration
validate_redis_config() {
    local env="$1"
    local errors=0
    
    # Redis typically requires minimal configuration
    echo -e "${GREEN}✓ Redis configuration minimal (using defaults)${NC}"
    
    # Check if Redis port is properly configured
    local redis_port=${LOGEN_PORTS[redis]}
    if [ -n "$redis_port" ] && [ "$redis_port" -gt 0 ]; then
        echo -e "${GREEN}✓ Redis port configured: $redis_port${NC}"
    else
        echo -e "${RED}✗ Redis port not properly configured${NC}"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# Pre-deployment checks
pre_deployment_checks() {
    local env="$1"
    
    log "INFO" "Running pre-deployment checks for environment: $env"
    
    local checks_passed=true
    
    # System resource check
    if ! validate_system_requirements >/dev/null 2>&1; then
        log "ERROR" "System requirements check failed"
        checks_passed=false
    fi
    
    # Configuration validation
    if ! validate_configuration_files "$env" >/dev/null 2>&1; then
        log "ERROR" "Configuration validation failed"
        checks_passed=false
    fi
    
    # Port availability
    if ! validate_port_availability "$env" >/dev/null 2>&1; then
        log "ERROR" "Port availability check failed"
        checks_passed=false
    fi
    
    if [ "$checks_passed" = true ]; then
        log "SUCCESS" "All pre-deployment checks passed"
        return 0
    else
        log "ERROR" "Pre-deployment checks failed - run validate command for details"
        return 1
    fi
}