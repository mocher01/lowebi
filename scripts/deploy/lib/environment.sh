#!/bin/bash
# Environment Management Functions
# Handles initialization, validation, and configuration of different environments

# Fixed port allocation (NEVER CHANGE THESE)
declare -A LOGEN_PORTS=(
    ["backend"]="7600"
    ["admin-frontend"]="7602"
    ["customer-frontend"]="7601"
    ["postgres"]="7633"
    ["redis"]="7679"
)

# Service naming convention
get_service_name() {
    local service="$1"
    local env="$2"
    echo "logen-${service}-${env}"
}

# Image naming convention
get_image_name() {
    local service="$1"
    local env="$2"
    echo "logen-${service}:${env}"
}

# Network naming convention
get_network_name() {
    local env="$1"
    echo "logen-network-${env}"
}

# Volume naming convention
get_volume_name() {
    local service="$1"
    local env="$2"
    echo "logen-${service}-${env}-data"
}

# Initialize environment
init_environment() {
    local env="$1"
    
    log "INFO" "Initializing environment: $env"
    
    # Validate environment name
    case "$env" in
        "dev"|"staging"|"prod")
            log "INFO" "Valid environment: $env"
            ;;
        *)
            log "ERROR" "Invalid environment: $env. Must be dev, staging, or prod"
            return 1
            ;;
    esac
    
    # Create directory structure
    create_environment_structure "$env"
    
    # Generate configuration files
    generate_environment_config "$env"
    
    # Create Docker network
    create_docker_network "$env"
    
    # Create volumes
    create_docker_volumes "$env"
    
    log "SUCCESS" "Environment $env initialized"
}

# Create environment directory structure
create_environment_structure() {
    local env="$1"
    
    log "INFO" "Creating directory structure for $env"
    
    local base_dir="$PROJECT_ROOT"
    
    # Create environment-specific directories
    mkdir -p "$base_dir/config/environments/$env"
    mkdir -p "$base_dir/config/docker/$env"
    mkdir -p "$base_dir/config/nginx/$env"
    mkdir -p "$base_dir/config/database/$env"
    mkdir -p "$base_dir/logs/$env"
    mkdir -p "$base_dir/backups/$env"
    mkdir -p "$base_dir/ssl/$env"
    
    log "SUCCESS" "Directory structure created for $env"
}

# Generate environment configuration
generate_environment_config() {
    local env="$1"
    
    log "INFO" "Generating configuration for $env"
    
    # Generate .env file
    generate_env_file "$env"
    
    # Generate docker-compose file
    generate_docker_compose "$env"
    
    # Generate nginx configuration
    generate_nginx_config "$env"
    
    log "SUCCESS" "Configuration generated for $env"
}

# Generate .env file
generate_env_file() {
    local env="$1"
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    
    log "INFO" "Generating .env file for $env"
    
    case "$env" in
        "dev")
            cat > "$env_file" << EOF
# LOGEN Development Environment
NODE_ENV=development
PORT=${LOGEN_PORTS[backend]}

# Database Configuration
DB_HOST=localhost
DB_PORT=${LOGEN_PORTS[postgres]}
DB_USERNAME=locod_user
DB_PASSWORD=locod_pass_2024
DB_DATABASE=locod_db
DB_SSL=false

# JWT Configuration
JWT_SECRET=logen_jwt_secret_development_2024
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=${LOGEN_PORTS[redis]}

# Frontend URLs
NEXT_PUBLIC_API_URL=http://localhost:${LOGEN_PORTS[backend]}
NEXT_PUBLIC_APP_ENV=development

# Admin Configuration
ADMIN_EMAIL=admin@locod.ai
ADMIN_PASSWORD=admin123

# CORS Origins
CORS_ORIGINS=http://localhost:3000,http://localhost:${LOGEN_PORTS[customer-frontend]},http://localhost:${LOGEN_PORTS[admin-frontend]}
EOF
            ;;
            
        "staging")
            cat > "$env_file" << EOF
# LOGEN Staging Environment
NODE_ENV=staging
PORT=${LOGEN_PORTS[backend]}

# Database Configuration
DB_HOST=logen-postgres-staging
DB_PORT=5432
DB_USERNAME=logen_staging_user
DB_PASSWORD=logen_staging_pass_2024_secure
DB_DATABASE=logen_staging
DB_SSL=require

# JWT Configuration
JWT_SECRET=logen_jwt_secret_staging_2024_secure_key
JWT_EXPIRES_IN=12h

# Redis Configuration
REDIS_HOST=logen-redis-staging
REDIS_PORT=6379

# Frontend URLs
NEXT_PUBLIC_API_URL=https://staging-api.logen.locod-ai.com
NEXT_PUBLIC_APP_ENV=staging

# Admin Configuration
ADMIN_EMAIL=admin@locod.ai
ADMIN_PASSWORD=\${ADMIN_PASSWORD_STAGING}

# CORS Origins
CORS_ORIGINS=https://staging.logen.locod-ai.com,https://admin-staging.logen.locod-ai.com
EOF
            ;;
            
        "prod")
            cat > "$env_file" << EOF
# LOGEN Production Environment
NODE_ENV=production
PORT=${LOGEN_PORTS[backend]}

# Database Configuration
DB_HOST=162.55.213.90
DB_PORT=${LOGEN_PORTS[postgres]}
DB_USERNAME=locod_user
DB_PASSWORD=locod_pass_2024
DB_DATABASE=locod_db
DB_SSL=false

# JWT Configuration
JWT_SECRET=logen_jwt_secret_production_2024_secure_key_v2
JWT_EXPIRES_IN=24h

# Redis Configuration
REDIS_HOST=logen-redis-prod
REDIS_PORT=${LOGEN_PORTS[redis]}

# Frontend URLs
NEXT_PUBLIC_API_URL=http://162.55.213.90:7600
NEXT_PUBLIC_APP_ENV=production

# Admin Configuration
ADMIN_EMAIL=admin@locod.ai
ADMIN_PASSWORD=admin123

# CORS Origins
CORS_ORIGINS=https://logen.locod-ai.com,https://admin.logen.locod-ai.com
EOF
            ;;
    esac
    
    log "SUCCESS" ".env file created for $env"
}

# Generate docker-compose file
generate_docker_compose() {
    local env="$1"
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    
    log "INFO" "Generating docker-compose.yml for $env"
    
    # Base compose template
    cat > "$compose_file" << EOF
version: '3.8'

networks:
  $(get_network_name "$env"):
    driver: bridge
    name: $(get_network_name "$env")

volumes:
  $(get_volume_name "postgres" "$env"):
    name: $(get_volume_name "postgres" "$env")
  $(get_volume_name "redis" "$env"):
    name: $(get_volume_name "redis" "$env")

services:
  # PostgreSQL Database
  postgres:
    image: postgres:15-alpine
    container_name: $(get_service_name "postgres" "$env")
    environment:
      POSTGRES_USER: \${DB_USERNAME}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
      POSTGRES_DB: \${DB_DATABASE}
      PGPORT: 7633
    volumes:
      - $(get_volume_name "postgres" "$env"):/var/lib/postgresql/data
    ports:
      - "${LOGEN_PORTS[postgres]}:7633"
    command: postgres -p 7633
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U \${DB_USERNAME} -d \${DB_DATABASE} -p 7633"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: $(get_service_name "redis" "$env")
    ports:
      - "${LOGEN_PORTS[redis]}:6379"
    volumes:
      - $(get_volume_name "redis" "$env"):/data
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # NestJS Backend
  backend:
    build:
      context: ../../../apps/backend
      dockerfile: Dockerfile.prod
    image: $(get_image_name "backend" "$env")
    container_name: $(get_service_name "backend" "$env")
    environment:
      - NODE_ENV=\${NODE_ENV}
      - PORT=\${PORT}
      - DB_HOST=\${DB_HOST}
      - DB_PORT=\${DB_PORT}
      - DB_USERNAME=\${DB_USERNAME}
      - DB_PASSWORD=\${DB_PASSWORD}
      - DB_DATABASE=\${DB_DATABASE}
      - DB_SSL=\${DB_SSL}
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_EXPIRES_IN=\${JWT_EXPIRES_IN}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "${LOGEN_PORTS[backend]}:${LOGEN_PORTS[backend]}"
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${LOGEN_PORTS[backend]}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  # Admin Frontend
  admin-frontend:
    build:
      context: ../../../apps/admin-frontend
      dockerfile: Dockerfile.prod
    image: $(get_image_name "admin-frontend" "$env")
    container_name: $(get_service_name "admin-frontend" "$env")
    environment:
      - NODE_ENV=\${NODE_ENV}
      - PORT=${LOGEN_PORTS[admin-frontend]}
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_APP_ENV=\${NEXT_PUBLIC_APP_ENV}
    ports:
      - "${LOGEN_PORTS[admin-frontend]}:${LOGEN_PORTS[admin-frontend]}"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${LOGEN_PORTS[admin-frontend]}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  # Customer Frontend
  customer-frontend:
    build:
      context: ../../../apps/frontend
      dockerfile: Dockerfile.prod
    image: $(get_image_name "customer-frontend" "$env")
    container_name: $(get_service_name "customer-frontend" "$env")
    environment:
      - NODE_ENV=\${NODE_ENV}
      - PORT=${LOGEN_PORTS[customer-frontend]}
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_APP_ENV=\${NEXT_PUBLIC_APP_ENV}
    ports:
      - "${LOGEN_PORTS[customer-frontend]}:${LOGEN_PORTS[customer-frontend]}"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${LOGEN_PORTS[customer-frontend]}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
EOF

    log "SUCCESS" "docker-compose.yml created for $env"
}

# Generate production docker-compose (no internal PostgreSQL)
generate_prod_docker_compose() {
    local env="$1"
    local compose_file="$PROJECT_ROOT/config/docker/$env/docker-compose.yml"
    
    log "INFO" "Generating production docker-compose.yml (external database)"
    
    cat > "$compose_file" << EOF
version: '3.8'

networks:
  $(get_network_name "$env"):
    driver: bridge
    name: $(get_network_name "$env")

volumes:
  $(get_volume_name "redis" "$env"):
    name: $(get_volume_name "redis" "$env")

services:
  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: $(get_service_name "redis" "$env")
    ports:
      - "${LOGEN_PORTS[redis]}:6379"
    volumes:
      - $(get_volume_name "redis" "$env"):/data
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # NestJS Backend (External PostgreSQL)
  backend:
    build:
      context: ../../../apps/backend
      dockerfile: Dockerfile.prod
    image: $(get_image_name "backend" "$env")
    container_name: $(get_service_name "backend" "$env")
    environment:
      - NODE_ENV=\${NODE_ENV}
      - PORT=\${PORT}
      - DB_HOST=\${DB_HOST}
      - DB_PORT=\${DB_PORT}
      - DB_USERNAME=\${DB_USERNAME}
      - DB_PASSWORD=\${DB_PASSWORD}
      - DB_DATABASE=\${DB_DATABASE}
      - DB_SSL=\${DB_SSL}
      - JWT_SECRET=\${JWT_SECRET}
      - JWT_EXPIRES_IN=\${JWT_EXPIRES_IN}
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    ports:
      - "${LOGEN_PORTS[backend]}:${LOGEN_PORTS[backend]}"
    depends_on:
      redis:
        condition: service_healthy
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${LOGEN_PORTS[backend]}/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  # Admin Frontend
  admin-frontend:
    build:
      context: ../../../apps/admin-frontend
      dockerfile: Dockerfile.prod
    image: $(get_image_name "admin-frontend" "$env")
    container_name: $(get_service_name "admin-frontend" "$env")
    environment:
      - NODE_ENV=\${NODE_ENV}
      - PORT=${LOGEN_PORTS[admin-frontend]}
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_APP_ENV=\${NEXT_PUBLIC_APP_ENV}
    ports:
      - "${LOGEN_PORTS[admin-frontend]}:${LOGEN_PORTS[admin-frontend]}"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${LOGEN_PORTS[admin-frontend]}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped

  # Customer Frontend
  customer-frontend:
    build:
      context: ../../../apps/frontend
      dockerfile: Dockerfile.prod
    image: $(get_image_name "customer-frontend" "$env")
    container_name: $(get_service_name "customer-frontend" "$env")
    environment:
      - NODE_ENV=\${NODE_ENV}
      - PORT=${LOGEN_PORTS[customer-frontend]}
      - NEXT_PUBLIC_API_URL=\${NEXT_PUBLIC_API_URL}
      - NEXT_PUBLIC_APP_ENV=\${NEXT_PUBLIC_APP_ENV}
    ports:
      - "${LOGEN_PORTS[customer-frontend]}:${LOGEN_PORTS[customer-frontend]}"
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - $(get_network_name "$env")
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:${LOGEN_PORTS[customer-frontend]}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    restart: unless-stopped
EOF

    log "SUCCESS" "Production docker-compose.yml created (external database)"
}

# Generate nginx configuration
generate_nginx_config() {
    local env="$1"
    local nginx_dir="$PROJECT_ROOT/config/nginx/$env"
    
    log "INFO" "Generating nginx configuration for $env"
    
    mkdir -p "$nginx_dir"
    
    # Generate main nginx.conf
    cat > "$nginx_dir/nginx.conf" << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1000;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
EOF

    case "$env" in
        "dev")
            # Development nginx config
            cat > "$nginx_dir/logen-dev.conf" << EOF
server {
    listen 80;
    server_name localhost logen-dev.local;

    # Customer Frontend
    location / {
        proxy_pass http://localhost:${LOGEN_PORTS[customer-frontend]};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:${LOGEN_PORTS[backend]}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name admin-dev.local admin.localhost;

    # Admin Frontend
    location / {
        proxy_pass http://localhost:${LOGEN_PORTS[admin-frontend]};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # API routes
    location /api/ {
        proxy_pass http://localhost:${LOGEN_PORTS[backend]}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
            ;;
            
        "prod")
            # Production nginx config (existing domains)
            cat > "$nginx_dir/logen-prod.conf" << EOF
# Customer Portal
server {
    listen 80;
    server_name logen.locod-ai.com;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name logen.locod-ai.com;

    ssl_certificate /etc/letsencrypt/live/logen.locod-ai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/logen.locod-ai.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    # Customer Frontend
    location / {
        proxy_pass http://127.0.0.1:${LOGEN_PORTS[customer-frontend]};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:${LOGEN_PORTS[backend]}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Admin Portal
server {
    listen 80;
    server_name admin.logen.locod-ai.com;
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    server_name admin.logen.locod-ai.com;

    ssl_certificate /etc/letsencrypt/live/admin.logen.locod-ai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.logen.locod-ai.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Enhanced security headers for admin portal
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https:; connect-src 'self' https: wss:;" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Admin Frontend
    location / {
        proxy_pass http://127.0.0.1:${LOGEN_PORTS[admin-frontend]};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Disable caching for admin interface
        proxy_cache_bypass 1;
        proxy_no_cache 1;
        add_header Cache-Control "no-cache, no-store, must-revalidate" always;
        add_header Pragma "no-cache" always;
        add_header Expires "0" always;
    }

    # API routes
    location /api/ {
        proxy_pass http://127.0.0.1:${LOGEN_PORTS[backend]}/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 60;
        proxy_send_timeout 300;
    }

    # Admin routes
    location /admin/ {
        proxy_pass http://127.0.0.1:${LOGEN_PORTS[backend]}/admin/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_Set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 60;
        proxy_send_timeout 300;
    }

    # Auth routes
    location /auth/ {
        proxy_pass http://127.0.0.1:${LOGEN_PORTS[backend]}/auth/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_Set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
        proxy_connect_timeout 60;
        proxy_send_timeout 300;
    }
}
EOF
            ;;
    esac
    
    log "SUCCESS" "Nginx configuration created for $env"
}

# Deploy environment
deploy_environment() {
    local env="$1"
    
    log "INFO" "Starting deployment for environment: $env"
    
    # Pre-deployment validation
    validate_environment "$env"
    
    # Load environment configuration
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    if [ -f "$env_file" ]; then
        set -a
        source "$env_file"
        set +a
        log "INFO" "Loaded environment configuration: $env_file"
    else
        log "ERROR" "Environment file not found: $env_file"
        return 1
    fi
    
    # Check for existing LOGEN containers and stop them
    log "INFO" "Checking for existing LOGEN containers in environment: $env"
    local existing_containers=$(docker ps -a --filter "name=logen-.*-$env" --format "{{.Names}}")
    if [ -n "$existing_containers" ]; then
        log "WARN" "Found existing LOGEN containers, stopping them:"
        echo "$existing_containers"
        docker stop $existing_containers 2>/dev/null || true
        docker rm $existing_containers 2>/dev/null || true
        log "INFO" "Existing containers removed"
    fi
    
    # Copy .env file to docker-compose directory
    local compose_dir="$PROJECT_ROOT/config/docker/$env"
    local env_file="$PROJECT_ROOT/config/environments/$env/.env"
    
    if [ -f "$env_file" ]; then
        log "INFO" "Copying environment file to compose directory"
        cp "$env_file" "$compose_dir/.env"
    fi
    
    # Run docker-compose with force recreate to ensure clean deployment
    local compose_file="$compose_dir/docker-compose.yml"
    if [ -f "$compose_file" ]; then
        log "INFO" "Deploying with docker-compose: $compose_file"
        cd "$compose_dir"
        # First, stop any existing services
        docker-compose -f docker-compose.yml down --remove-orphans 2>/dev/null || true
        # Then deploy with fresh containers
        docker-compose -f docker-compose.yml up -d --build --force-recreate
    else
        log "ERROR" "Docker compose file not found: $compose_file"
        return 1
    fi
    
    # Wait for services to be healthy
    wait_for_services_health "$env"
    
    log "SUCCESS" "Deployment completed for environment: $env"
}

# Wait for services to be healthy
wait_for_services_health() {
    local env="$1"
    local max_wait=300 # 5 minutes
    local wait_time=0
    
    log "INFO" "Waiting for services to be healthy..."
    
    while [ $wait_time -lt $max_wait ]; do
        local all_healthy=true
        
        # Check each service
        for service in "postgres" "redis" "backend" "admin-frontend" "customer-frontend"; do
            local container_name=$(get_service_name "$service" "$env")
            
            if docker ps --filter "name=$container_name" --filter "health=healthy" | grep -q "$container_name"; then
                log "DEBUG" "$container_name is healthy"
            else
                log "DEBUG" "$container_name is not healthy yet"
                all_healthy=false
            fi
        done
        
        if [ "$all_healthy" = true ]; then
            log "SUCCESS" "All services are healthy"
            return 0
        fi
        
        sleep 10
        wait_time=$((wait_time + 10))
    done
    
    log "ERROR" "Services failed to become healthy within $max_wait seconds"
    return 1
}